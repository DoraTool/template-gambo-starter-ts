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