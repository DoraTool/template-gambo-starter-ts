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
 * All input angles are in **degrees (°)** and measured **clockwise**.
 * Reference system:
 *   - 0° = screen space vertical up
 *   - Clockwise: right = 90°, down = 180°, left = 270°.
 *
 * Purpose:
 *   Compute the rotation (in radians) needed for a sprite so that it always
 *   points in the desired flight direction.
 *
 * @param {number} assetDirectionAngle
 *   - The default facing angle of the asset (clockwise, degrees).
 *   - Defined as the angle between the sprite’s arrow direction (when rotation = 0)
 *     and the 0° (up) direction.
 *   - Example: if the arrow image points to the upper-right by default, use 45.
 *
 * @param {number} targetAngle
 *   - The intended flight direction angle (clockwise, degrees).
 *   - Defined as the angle between the flight direction and 0° (up).
 *   - Typically obtained using Phaser.Math.Angle.Between, then converted
 *     to this clockwise coordinate system.
 *
 * @returns {number}
 *   - The final rotation angle in radians.
 *   - Can be assigned directly to `sprite.rotation`.
 *
 * Usage examples:
 *   // Example 1: asset arrow points upper-right (45°), flight direction = up (0°)
 *   this.sprite.rotation = computeRotationCW(45, 0);
 *   // => returns -45° in radians, rotates the arrow from upper-right to up
 *
 *   // Example 2: asset arrow points right (90°), flight direction = right (90°)
 *   this.sprite.rotation = computeRotationCW(90, 90);
 *   // => returns 0 radians, no rotation needed
 */
export function computeRotationCW(assetDirectionAngle: number, targetAngle: number) {
  // Both angles are in the same clockwise coordinate system, so just subtract
  return Phaser.Math.DegToRad(targetAngle - assetDirectionAngle);
}
