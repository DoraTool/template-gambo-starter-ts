import Phaser from 'phaser';

interface TriggerOrigin {
  x: number;
  y: number;
}

// Create collision trigger
export const createTrigger = (
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    origin: TriggerOrigin = { x: 0.5, y: 0.5 }
): Phaser.GameObjects.Zone => {
    const customCollider = scene.add.zone(x, y, width, height).setOrigin(origin.x, origin.y);

    scene.physics.add.existing(customCollider);
    (customCollider.body as Phaser.Physics.Arcade.Body).setAllowGravity(false); // Not affected by gravity
    (customCollider.body as Phaser.Physics.Arcade.Body).setImmovable(true);
    return customCollider;
};

export const resetOriginAndOffset = (sprite: any): void => {
  // If the scene is not active, do not reset the origin and offset
  if (!sprite.scene.sys.isActive()) {
    return;
  }

  const animationsData = sprite.scene.cache.json.get("animations");
  if (!animationsData) {
    throw new Error("animations.json is not loaded, please check if the file is in the assets folder");
  } else if (!animationsData.anims) {
    throw new Error("the first key of animations.json must be 'anims', please check the file");
  }

  // Return corresponding origin data based on different animations
  // Get origin data from loaded animations data
  let baseOriginX = 0.5;
  let baseOriginY = 1.0;
  const currentAnim = sprite.anims.currentAnim;
  if (currentAnim) {
    // Find animation config by key from loaded JSON
    const animConfig = animationsData.anims.find((anim: any) => anim.key === currentAnim.key);
    if (animConfig) {
      baseOriginX = animConfig.originX || 0.5;
      baseOriginY = animConfig.originY || 1.0;
    } else {
      console.error(`Animation config not found for key: ${currentAnim.key}`);
    }
  }

  if (!sprite.facingDirection) {
    throw new Error("resetOriginAndOffset input parameter sprite's facingDirection property cannot be empty");
  }

  if (sprite.facingDirection !== "up" && sprite.facingDirection !== "down" && sprite.facingDirection !== "left" && sprite.facingDirection !== "right") { 
    throw new Error("resetOriginAndOffset input parameter sprite's facingDirection property only supports up, down, left, right values");
  }

  let animOriginX = sprite.facingDirection === "left" ? (1 - baseOriginX) : baseOriginX;
  let animOriginY = baseOriginY;
  
  // Set origin
  sprite.setOrigin(animOriginX, animOriginY);
  
  // Calculate offset to align collision box's bottomCenter with animation frame's origin
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  const unscaledBodyWidth = body.width / sprite.scale
  const unscaledBodyHeight = body.height / sprite.scale
  body.setOffset(
    sprite.width * animOriginX - unscaledBodyWidth / 2, 
    sprite.height * animOriginY - unscaledBodyHeight
  );
}

// All Arcade Sprite constructors must initialize origin, scale, size, offset through this function
export const initScale = (
    sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image, 
    origin: { x: number; y: number }, 
    maxDisplayWidth?: number,
    maxDisplayHeight?: number, 
    bodyWidthFactorToDisplayWidth?: number,
    bodyHeightFactorToDisplayHeight?: number
): void => {
  sprite.setOrigin(origin.x, origin.y)

  let displayScale
  let displayHeight
  let displayWidth
  if (maxDisplayHeight && maxDisplayWidth) {
    if (sprite.height / sprite.width > maxDisplayHeight / maxDisplayWidth) {
      displayHeight = maxDisplayHeight
      displayScale = maxDisplayHeight / sprite.height
      displayWidth = sprite.width * displayScale
    } else {
      displayWidth = maxDisplayWidth
      displayScale = maxDisplayWidth / sprite.width
      displayHeight = sprite.height * displayScale
    }
  } else if (maxDisplayHeight) {
    displayHeight = maxDisplayHeight
    displayScale = maxDisplayHeight / sprite.height
    displayWidth = sprite.width * displayScale
  } else if (maxDisplayWidth) {
    displayWidth = maxDisplayWidth
    displayScale = maxDisplayWidth / sprite.width
    displayHeight = sprite.height * displayScale
  } else {
    throw new Error("initScale input parameter maxDisplayHeight and maxDisplayWidth cannot be undefined at the same time");
  }

  sprite.setScale(displayScale)
  const displayBodyWidth = displayWidth * bodyWidthFactorToDisplayWidth
  const displayBodyHeight = displayHeight * bodyHeightFactorToDisplayHeight
  
  if (sprite.body instanceof Phaser.Physics.Arcade.Body) {
      // Body.setSize requires the unscaled body size as input, because the size of the Dynamic Body will scale with sprite.setScale
      const unscaledBodyWidth = displayBodyWidth / displayScale
      const unscaledBodyHeight = displayBodyHeight / displayScale 
      sprite.body.setSize(unscaledBodyWidth, unscaledBodyHeight)

      // Body.setOffset requires the unscaled offset as input, because the offset of the Dynamic Body will scale with sprite.setScale
      const unscaledOffsetX = sprite.width * origin.x - unscaledBodyWidth * origin.x
      const unscaledOffsetY = sprite.height * origin.y - unscaledBodyHeight * origin.y
      sprite.body.setOffset(unscaledOffsetX, unscaledOffsetY)
  } else if (sprite.body instanceof Phaser.Physics.Arcade.StaticBody) {
      // StaticBody.setSize requires the scaled body size(displayBodyWidth, displayBodyHeight) as input, because the size of StaticBody will not scale with sprite.setScale
      sprite.body.setSize(displayBodyWidth, displayBodyHeight)

      // **Don't use StaticBody.setOffset**: this function has a serious bug.
      // Use StaticBody.position.set instead
      const displayTopLeft = sprite.getTopLeft();
      const bodyPositionX = displayTopLeft.x + (sprite.displayWidth * origin.x - displayBodyWidth * origin.x);
      const bodyPositionY = displayTopLeft.y + (sprite.displayHeight * origin.y - displayBodyHeight * origin.y);
      sprite.body.position.set(bodyPositionX, bodyPositionY);
  }
}

/**
 * In some cases, scene.physics.add.collider and scene.physics.add.overlap internally call collideCallback.call(callbackContext, object2, object1), causing parameter order reversal
 * This function ensures that the callback function always receives parameters in the order (object1, object2)
 */
export const addCollider = (
  scene: Phaser.Scene,
  object1: Phaser.Types.Physics.Arcade.ArcadeColliderType,
  object2: Phaser.Types.Physics.Arcade.ArcadeColliderType,
  collideCallback?: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
  processCallback?: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
  callbackContext?: any
): Phaser.Physics.Arcade.Collider => {
if (shouldSwap(object1, object2)) {
  return scene.physics.add.collider(object1, object2, (obj1: any, obj2: any) => {
    collideCallback?.call(callbackContext, obj2, obj1)
  }, (obj1: any, obj2: any) => {
    processCallback?.call(callbackContext, obj2, obj1)
  }, callbackContext);
} else {
  return scene.physics.add.collider(object1, object2, collideCallback, processCallback, callbackContext);
}
};

export const addOverlap = (
  scene: Phaser.Scene,
  object1: Phaser.Types.Physics.Arcade.ArcadeColliderType,
  object2: Phaser.Types.Physics.Arcade.ArcadeColliderType,
  collideCallback?: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
  processCallback?: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
  callbackContext?: any
): Phaser.Physics.Arcade.Collider => {
  if (shouldSwap(object1, object2)) {
    return scene.physics.add.overlap(object1, object2, (obj1: any, obj2: any) => {
      collideCallback?.call(callbackContext, obj2, obj1)
    }, (obj1: any, obj2: any) => {
      processCallback?.call(callbackContext, obj2, obj1)
    }, callbackContext);
  } else {
    return scene.physics.add.overlap(object1, object2, collideCallback, processCallback, callbackContext);
  }
};

const shouldSwap = (object1: any, object2: any) => {
  const object1IsPhysicsGroup = object1 && (object1 as any).isParent && !((object1 as any).physicsType === undefined);
  const object1IsTilemap = object1 && (object1 as any).isTilemap;
  const object2IsPhysicsGroup = object2 && (object2 as any).isParent && !((object2 as any).physicsType === undefined);
  const object2IsTilemap = object2 && (object2 as any).isTilemap;

  // In the following cases, Phaser internally calls collideCallback.call(callbackContext, object2, object1), causing parameter order reversal
  return (
      (object1IsPhysicsGroup && !object2IsPhysicsGroup && !object2IsTilemap) ||
      (object1IsTilemap && !object2IsPhysicsGroup && !object2IsTilemap) ||
      (object1IsTilemap && object2IsPhysicsGroup)
  );
}