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
 * 计算素材旋转角度（upAngle 和 flightAngle 都按顺时针计算）
 * @param {number} upAngle - 素材自身朝向，顺时针角度
 * @param {number} targetAngle - 期望飞行方向，顺时针角度
 * @returns {number} 最终旋转角度（弧度）
 * 以素材箭头朝向右上角，角度为45度，飞行角度为屏幕空间垂直向上飞行角度0度计算示例
 * this.sprite.rotation = computeRotationCW(45, 0);
 */
export function computeRotationCW(upAngle: number, targetAngle: number) {
  // 两者都按顺时针，直接相减即可
  return Phaser.Math.DegToRad(targetAngle - upAngle);
}