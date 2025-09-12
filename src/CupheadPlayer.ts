import Phaser from 'phaser'
import { createTrigger } from './utils'
import { playerConfig } from './gameConfig.json'

export class CupheadPlayer extends Phaser.Physics.Arcade.Sprite {
  public scene: Phaser.Scene
  public facingDirection: string
  public walkSpeed: number
  public jumpPower: number
  public isDead: boolean
  public isAttacking: boolean
  public isHurting: boolean
  public isInvulnerable: boolean
  public hurtingDuration: number
  public invulnerableTime: number
  public currentMeleeTargets: Set<any>
  public maxHealth: number
  public health: number
  public collisionBoxWidth: number
  public collisionBoxHeight: number
  public characterScale: number
  public attackTrigger: Phaser.Physics.Arcade.Sprite
  public jumpSound: Phaser.Sound.BaseSound
  public shootSound: Phaser.Sound.BaseSound
  public hurtSound: Phaser.Sound.BaseSound

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "cuphead_idle_frame1")
    this.scene = scene

    // Add to scene and physics system
    scene.add.existing(this)
    scene.physics.add.existing(this)

    // Character properties
    this.facingDirection = "right"
    this.walkSpeed = playerConfig.walkSpeed.value
    this.jumpPower = playerConfig.jumpPower.value

    // State flags
    this.isDead = false // Death state
    this.isAttacking = false // Attack state
    this.isHurting = false // Hurt stun state
    this.isInvulnerable = false // Invulnerable state
    this.hurtingDuration = playerConfig.hurtingDuration.value // Hurt stun duration, recommended 100ms
    this.invulnerableTime = playerConfig.invulnerableTime.value // Invulnerable time, recommended 2000ms
    
    // Attack target tracking system
    this.currentMeleeTargets = new Set() // Record targets already hit by current attack

    // Player health system
    this.maxHealth = playerConfig.maxHealth.value
    this.health = this.maxHealth

    // Set physics properties
    this.body!.setGravityY(playerConfig.gravityY.value)

    // Set collision box based on idle animation
    this.collisionBoxWidth = 318 * 0.9
    this.collisionBoxHeight = 560 * 0.9
    this.body!.setSize(this.collisionBoxWidth, this.collisionBoxHeight)

    // Set character scale
    const standardHeight = 2 * 64
    this.characterScale = standardHeight / 560
    this.setScale(this.characterScale)

    // Set initial origin
    this.setOrigin(0.5, 1.0)

    // Create animations
    this.createAnimations()

    // Play idle animation
    this.play("cuphead_idle_anim")
    this.resetOriginAndOffset()

    // Create attack trigger
    this.createAttackTrigger()

    // Initialize all sound effects
    this.initializeSounds()
  }

  // Initialize all sound effects
  initializeSounds() {
    this.jumpSound = this.scene.sound.add("cuphead_jump_sound", { volume: 0.3 })
    this.shootSound = this.scene.sound.add("cuphead_shoot_sound", { volume: 0.3 })
    this.hurtSound = this.scene.sound.add("cuphead_hurt_sound", { volume: 0.3 })
  }

  createAnimations() {
    const anims = this.scene.anims

    // Idle animation
    if (!anims.exists("cuphead_idle_anim")) {
      anims.create({
        key: "cuphead_idle_anim",
        frames: [
          {
            key: "cuphead_idle_frame1",
            duration: 800,
          },
          {
            key: "cuphead_idle_frame2",
            duration: 800,
          },
        ],
        repeat: -1,
      })
    }

    // Walk animation
    if (!anims.exists("cuphead_walk_anim")) {
      anims.create({
        key: "cuphead_walk_anim",
        frames: [
          {
            key: "cuphead_walk_frame1",
            duration: 300,
          },
          {
            key: "cuphead_walk_frame2",
            duration: 300,
          },
        ],
        repeat: -1,
      })
    }

    // Jump up animation
    if (!anims.exists("cuphead_jump_up_anim")) {
      anims.create({
        key: "cuphead_jump_up_anim",
        frames: [
          {
            key: "cuphead_jump_frame1",
            duration: 200,
          },
        ],
        repeat: 0,
      })
    }

    // Jump down animation
    if (!anims.exists("cuphead_jump_down_anim")) {
      anims.create({
        key: "cuphead_jump_down_anim",
        frames: [
          {
            key: "cuphead_jump_frame2",
            duration: 200,
          },
        ],
        repeat: 0,
      })
    }

    // Attack animation
    if (!anims.exists("cuphead_attack_anim")) {
      anims.create({
        key: "cuphead_attack_anim",
        frames: [
          {
            key: "cuphead_attack_frame1",
            duration: 50,
          },
          {
            key: "cuphead_attack_frame2",
            duration: 100,
          },
        ],
        repeat: 0,
      })
    }

    // Die animation
    if (!anims.exists("cuphead_die_anim")) {
      anims.create({
        key: "cuphead_die_anim",
        frames: [
          {
            key: "cuphead_die_frame1",
            duration: 500,
          },
          {
            key: "cuphead_die_frame2",
            duration: 500,
          },
        ],
        repeat: 0,
      })
    }
  }

  update(cursors: Phaser.Types.Input.Keyboard.CursorKeys, attackKey: Phaser.Input.Keyboard.Key) {
    if (!this.body || !this.active || this.isDead || this.isAttacking || this.isHurting) {
      return
    }

    // Handle death state
    if (!this.isDead) {
      this.handleDying()
    }

    // Handle attack state
    if (!this.isDead && !this.isAttacking && !this.isHurting) {
      this.handleAttacks(attackKey)
    }

    // Handle movement
    if (!this.isDead && !this.isAttacking && !this.isHurting) {
      this.handleMovement(cursors)
    }

    // Update attack trigger
    this.updateAttackTrigger()
  }

  handleDying() {
    if (this.health <= 0 && !this.isDead) {
      this.health = 0
      this.isDead = true
      this.body!.setVelocityX(0)
      this.play("cuphead_die_anim", true)
      this.resetOriginAndOffset()
      this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation: any) => {
        if (animation.key === "cuphead_die_anim") {
          this.scene.scene.launch("GameOverUIScene", { 
            currentLevelKey: this.scene.scene.key 
          })
        }
      })
    } else if(this.y > (this.scene as any).mapHeight + 100 && !this.isDead) { // If it's a side-scroll game, falling out of the world's bottom edge is considered death
      this.health = 0
      this.isDead = true
      this.scene.scene.launch("GameOverUIScene", { 
        currentLevelKey: this.scene.scene.key 
      })
    }
  }

  handleAttacks(attackKey: Phaser.Input.Keyboard.Key) {
    // Attack (Space key)
    if (
      Phaser.Input.Keyboard.JustDown(attackKey) &&
      !this.isAttacking
    ) {
      // Clear attack target records, start new attack
      this.currentMeleeTargets.clear()
      // Update trigger before attack
      this.updateAttackTrigger()
      this.isAttacking = true
      this.body!.setVelocityX(0) // Stop movement during attack

      this.play("cuphead_attack_anim", true)
      this.resetOriginAndOffset()
      this.shootSound.play()
      this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation: any) => {
        if (animation.key === "cuphead_attack_anim") {
          this.isAttacking = false
          // Clear target records when attack ends
          this.currentMeleeTargets.clear()
        }
      })
    }
  }

  handleMovement(cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
    // Normal mode movement control
    if (cursors.left!.isDown) {
      this.body!.setVelocityX(-this.walkSpeed)
      this.facingDirection = "left"
    } else if (cursors.right!.isDown) {
      this.body!.setVelocityX(this.walkSpeed)
      this.facingDirection = "right"
    } else {
      this.body!.setVelocityX(0)
    }

    // Update facing direction
    this.setFlipX(this.facingDirection === "left")

    // Jump
    if (cursors.up!.isDown && this.body!.onFloor()) {
      this.body!.setVelocityY(-this.jumpPower)
      this.jumpSound.play()
    }

    // Update animation
    if (!this.body!.onFloor()) {
      if (this.body!.velocity.y < 0) {
        // Rising phase
        this.play("cuphead_jump_up_anim", true)
        this.resetOriginAndOffset()
      } else {
        // Falling phase
        this.play("cuphead_jump_down_anim", true)
        this.resetOriginAndOffset()
      }
    } else if (Math.abs(this.body!.velocity.x) > 0) {
      // Walking
      this.play("cuphead_walk_anim", true)
      this.resetOriginAndOffset()
    } else {
      // Idle
      this.play("cuphead_idle_anim", true)
      this.resetOriginAndOffset()
    }
  }

  resetOriginAndOffset() {
    // Return corresponding origin data based on different animations
    let baseOriginX = 0.5;
    let baseOriginY = 1.0;
    const currentAnim = this.anims.currentAnim;
    if (currentAnim) {
      switch(currentAnim.key) {
        case "cuphead_idle_anim":
          baseOriginX = 0.5;
          baseOriginY = 1.0;
          break;
        case "cuphead_walk_anim":
          baseOriginX = 0.519;
          baseOriginY = 1.0;
          break;
        case "cuphead_jump_up_anim":
        case "cuphead_jump_down_anim":
          baseOriginX = 0.486;
          baseOriginY = 1.0;
          break;
        case "cuphead_attack_anim":
          baseOriginX = 0.217;
          baseOriginY = 1.0;
          break;
        case "cuphead_die_anim":
          baseOriginX = 0.342;
          baseOriginY = 1.0;
          break;
        default:
          baseOriginX = 0.5;
          baseOriginY = 1.0;
          break;
      }
    }

    let animOriginX = this.facingDirection === "left" ? (1 - baseOriginX) : baseOriginX;
    let animOriginY = baseOriginY;
    
    // Set origin
    this.setOrigin(animOriginX, animOriginY);
    
    // Calculate offset to align collision box's bottomCenter with animation frame's origin
    this.body!.setOffset(
      this.width * animOriginX - this.collisionBoxWidth / 2, 
      this.height * animOriginY - this.collisionBoxHeight
    );
  }

  takeDamage(damage: number) {
    if (this.isInvulnerable || this.isDead) return
    
    this.health -= damage
    this.isHurting = true
    this.isInvulnerable = true
    this.hurtSound.play()

    // Hurt stun logic
    this.scene.time.delayedCall(this.hurtingDuration, () => {
      this.isHurting = false
    })

    // Blinking logic during invulnerable time
    let blinkCount = 0
    const blinkInterval = 100
    const totalBlinks = this.invulnerableTime / blinkInterval

    const blinkTimer = this.scene.time.addEvent({
      delay: blinkInterval,
      callback: () => {
        this.setAlpha(this.alpha === 1 ? 0.5 : 1)
        blinkCount++
        if (blinkCount >= totalBlinks) {
          this.setAlpha(1)
          this.isInvulnerable = false
          blinkTimer.destroy()
        }
      },
      repeat: totalBlinks - 1
    })
  }

  getHealthPercentage(): number {
    return (this.health / this.maxHealth) * 100
  }

  // Create attack trigger
  createAttackTrigger() {
    // Use utility method to create attack trigger
    this.attackTrigger = createTrigger(this.scene, 0, 0, 150, 120)
  }

  // Update attack trigger
  updateAttackTrigger() {
    let triggerX = 0
    let triggerY = 0
    let triggerWidth = 150
    let triggerHeight = 120

    const playerCenterX = this.x
    // Character origin is at bottom, needs to be offset
    const playerCenterY = this.y - this.body!.height / 2

    switch(this.facingDirection) {
      case "right":
        triggerWidth = 150
        triggerHeight = 120
        triggerX = playerCenterX + triggerWidth / 2 // Character center point offset right
        triggerY = playerCenterY
        break;
      case "left":
        triggerWidth = 150
        triggerHeight = 120
        triggerX = playerCenterX - triggerWidth / 2 // Character center point offset left
        triggerY = playerCenterY
        break;
    }
    
    this.attackTrigger.setPosition(triggerX, triggerY)
    this.attackTrigger.body!.setSize(triggerWidth, triggerHeight)
  }
}
