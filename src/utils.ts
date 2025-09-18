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
 * 所有输入角度均为“度（°）”，并且**按顺时针方向**测量。
 * 基准约定：
 *   - 0° = 屏幕竖直向上（up）
 *   - 顺时针增加：右 = 90°，下 = 180°，左 = 270°。
 *
 * 用途：
 *   计算素材（sprite）需要旋转的弧度，使其始终沿飞行方向指向目标。
 *
 * @param {number} assetDirectionAngle
 *   - 素材自身的默认朝向角度（顺时针，度）
 *   - 指 sprite 在 rotation = 0 时，图片自身箭头指向与 0°(up) 的夹角
 *   - 例：如果箭头素材在美术图里默认朝右上，则此值 = 45
 *
 * @param {number} targetAngle
 *   - 期望的飞行方向角度（顺时针，度）
 *   - 与 0°(up) 的夹角
 *   - 通常由 Phaser.Math.Angle.Between 计算目标点方向，再换算成此坐标系
 *
 * @returns {number}
 *   - 最终旋转角度（弧度）
 *   - 可直接赋给 sprite.rotation
 *
 * 使用示例：
 *   // 例1：素材箭头默认朝向右上（45°），目标方向 = 竖直向上（0°）
 *   this.sprite.rotation = computeRotationCW(45, 0);
 *   // => 返回 -45°(弧度)，让箭头从右上旋转到正上
 *
 *   // 例2：素材箭头默认朝向右（90°），目标方向 = 右（90°）
 *   this.sprite.rotation = computeRotationCW(90, 90);
 *   // => 返回 0 (弧度)，不需要旋转
 */
export function computeRotationCW(assetDirectionAngle: number, targetAngle: number) {
  // 两者都在同一顺时针坐标系下，直接相减即可
  return Phaser.Math.DegToRad(targetAngle - assetDirectionAngle);
}
