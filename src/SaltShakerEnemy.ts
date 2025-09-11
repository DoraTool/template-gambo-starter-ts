import Phaser from 'phaser'
import FSM from 'phaser3-rex-plugins/plugins/fsm.js'

// Enemy FSM class
class SaltShakerEnemyFSM extends FSM {
  public scene: Phaser.Scene
  public enemy: SaltShakerEnemy
  public lastAttackTime: number
  public attackCooldown: number

  constructor(scene: Phaser.Scene, enemy: SaltShakerEnemy) {
    super({
      start: 'idle'
    })
    this.scene = scene
    this.enemy = enemy
    this.lastAttackTime = 0
    this.attackCooldown = 4000 // 4 seconds attack cooldown
  }

  // idle state
  enter_idle() {
    this.enemy.setVelocityX(0)
    console.log('Enemy entering idle state')
  }

  update_idle(time: number, delta: number) {
    const player = (this.scene as any).player
    if (!player || this.enemy.isDead || this.enemy.isHurting) return

    const distanceToPlayer = Phaser.Math.Distance.Between(
      this.enemy.x, this.enemy.y,
      player.x, player.y
    )

    // If player is within attack range and cooldown is over
    if (distanceToPlayer < 200 && time - this.lastAttackTime > this.attackCooldown) {
      this.goto('attacking')
    } else if (distanceToPlayer < 300) {
      // If player is within detection range, start moving
      this.goto('moving')
    }
  }

  // moving state
  enter_moving() {
    console.log('Enemy entering moving state')
  }

  update_moving(time: number, delta: number) {
    const player = (this.scene as any).player
    if (!player || this.enemy.isDead || this.enemy.isHurting) return

    const distanceToPlayer = Phaser.Math.Distance.Between(
      this.enemy.x, this.enemy.y,
      player.x, player.y
    )

    // If player is within attack range and cooldown is over
    if (distanceToPlayer < 200 && time - this.lastAttackTime > this.attackCooldown) {
      this.goto('attacking')
      return
    }

    // Move towards player
    if (player.x < this.enemy.x) {
      this.enemy.setVelocityX(-60) // Move left
      this.enemy.facingDirection = "left"
    } else {
      this.enemy.setVelocityX(60) // Move right
      this.enemy.facingDirection = "right"
    }

    // Update facing direction
    this.enemy.setFlipX(this.enemy.facingDirection === "left")

    // If player is too far, return to idle
    if (distanceToPlayer > 400) {
      this.goto('idle')
    }
  }

  // attacking state
  enter_attacking() {
    this.enemy.setVelocityX(0)
    this.enemy.isAttacking = true
    this.lastAttackTime = this.scene.time.now
    console.log('Enemy entering attacking state')
    
    // Attack animation complete after 1 second, return to idle
    this.scene.time.delayedCall(1000, () => {
      this.enemy.isAttacking = false
      this.goto('idle')
    })
  }

  update_attacking(time: number, delta: number) {
    // Do nothing during attack, wait for timer to finish
  }
}

export class SaltShakerEnemy extends Phaser.Physics.Arcade.Sprite {
  public scene: Phaser.Scene
  public facingDirection: string
  public isDead: boolean
  public isAttacking: boolean
  public isHurting: boolean
  public maxHealth: number
  public health: number
  public collisionBoxWidth: number
  public collisionBoxHeight: number
  public characterScale: number
  public fsm: SaltShakerEnemyFSM
  public defeatSound: Phaser.Sound.BaseSound

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "salt_shaker_enemy")

    // Add to scene and physics system
    scene.add.existing(this)
    scene.physics.add.existing(this)

    // Character properties
    this.scene = scene
    this.facingDirection = "left"

    // State flags
    this.isDead = false
    this.isAttacking = false
    this.isHurting = false

    // Enemy health system
    this.maxHealth = 2
    this.health = this.maxHealth

    // Set physics properties
    this.body!.setGravityY(1200) // Same gravity as player for side-scroll game

    // Set collision box based on sprite size
    this.collisionBoxWidth = 943 * 0.9
    this.collisionBoxHeight = 981 * 0.9
    this.body!.setSize(this.collisionBoxWidth, this.collisionBoxHeight)

    // Set character scale - salt shaker should be about 1.5 tiles high
    const standardHeight = 1.5 * 64
    this.characterScale = standardHeight / 981
    this.setScale(this.characterScale)

    // Set initial origin for ground objects
    this.setOrigin(0.5, 1.0)

    // Initialize sounds first
    this.initializeSounds()

    // Initialize FSM last, after all other properties are set
    this.fsm = new SaltShakerEnemyFSM(scene, this)
  }

  // Initialize all sound effects
  initializeSounds() {
    this.defeatSound = this.scene.sound.add("enemy_defeat_sound", { volume: 0.3 })
  }

  update(time: number, delta: number) {
    if (!this.body || !this.active || this.isDead) {
      return
    }

    // Handle death state
    this.handleDying()

    // Update FSM
    this.fsm.update(time, delta)
  }

  handleDying() {
    if (this.health <= 0 && !this.isDead) {
      this.health = 0
      this.isDead = true
      this.body!.setVelocityX(0)
      this.defeatSound.play()
      
      // Fade out and destroy
      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        duration: 500,
        onComplete: () => {
          this.destroy()
        }
      })
    }
  }

  takeDamage(damage: number) {
    if (this.isDead || this.isHurting) return
    
    this.health -= damage
    this.isHurting = true

    // Flash red when hurt
    this.setTint(0xff0000)
    this.scene.time.delayedCall(200, () => {
      this.clearTint()
      this.isHurting = false
    })
  }

  // Knockback effect
  knockback(direction: number, force: number = 200) {
    if (this.body) {
      this.body.setVelocityX(direction * force)
    }
  }
}
