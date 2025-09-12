import Phaser from 'phaser'
import { CupheadPlayer } from './CupheadPlayer'
import { SaltShakerEnemy } from './SaltShakerEnemy'
import { LevelManager } from './LevelManager'

export abstract class BaseLevelScene extends Phaser.Scene {
  public player!: CupheadPlayer
  public enemies!: Phaser.GameObjects.Group
  public decorations!: Phaser.GameObjects.Group
  public cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  public attackKey!: Phaser.Input.Keyboard.Key
  public mapWidth!: number
  public mapHeight!: number
  public gameCompleted: boolean = false
  public backgroundMusic!: Phaser.Sound.BaseSound

  constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
    super(config)
  }

  // Common creation method
  createBaseElements() {
    // Initialize gameCompleted flag
    this.gameCompleted = false

    // Set map size
    this.setupMapSize()

    // Create background
    this.createBackground()

    // Create map

    // Create decoration elements
    this.decorations = this.add.group()
    this.createDecorations()

    // Create enemies
    this.enemies = this.add.group()
    this.createEnemies()

    // Create player
    this.createPlayer()

    // Set basic collisions
    this.setupBaseCollisions()
    this.createTileMap()

    // Set player's world boundary collision
    this.player.body!.setCollideWorldBounds(true)

    // Set camera
    this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight)
    this.cameras.main.startFollow(this.player)
    this.cameras.main.setLerp(0.1, 0.1)

    // Set world boundaries
    // If it's a side-scroll game, only enable left/right/top collisions, disable bottom boundary collision
    this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight, true, true, true, false)

    // Create input controls
    this.setupInputs()

    // Set attack collision detection
    this.setupAttackCollision()

    // Show UI, pass current scene Key
    this.scene.launch("UIScene", { gameSceneKey: this.scene.key })
  }

  setupBaseCollisions() {
    // Player collides with collidable tile layer
    const groundLayer = this.add.group() // This will be set up in createTileMap
    
    // Enemies collide with collidable tile layer
    // This will be implemented in subclasses

    // Player and enemy collision - player gets knocked back and hurt
    this.physics.add.overlap(
      this.player,
      this.enemies,
      (player: any, enemy: any) => {
        if (player.isInvulnerable || player.isHurting || player.isDead || enemy.isDead) return
        
        // Knockback effect
        const knockbackDirection = player.x < enemy.x ? -1 : 1
        player.body.setVelocityX(knockbackDirection * 300)
        
        // Player takes damage
        player.takeDamage(1)
      }
    )
  }

  setupInputs() {
    // Create input controls
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.attackKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
  }

  // Set attack collision detection
  setupAttackCollision() {
    // Set collision detection between player attack trigger and enemies
    this.physics.add.overlap(
      this.player.attackTrigger,
      this.enemies,
      (trigger: any, enemy: any) => {
        if (this.player.isAttacking && !this.player.currentMeleeTargets.has(enemy)) {
          // No response in death or hurt state
          if (enemy.isHurting || enemy.isDead) return
          // Add enemy to attacked list
          this.player.currentMeleeTargets.add(enemy)
          
          // Knockback effect
          const knockbackDirection = this.player.x < enemy.x ? 1 : -1
          enemy.knockback(knockbackDirection, 200)
          
          // Finally call takeDamage (takeDamage method should not include knockback logic)
          enemy.takeDamage(1)
        }
      }
    )
  }

  // Common update method
  baseUpdate() {
    // Update player
    this.player.update(this.cursors, this.attackKey)

    // Update enemies
    this.enemies.children.entries.forEach((enemy: any) => {
      if (enemy.update) {
        enemy.update(this.time.now, 16) // 16ms delta for 60fps
      }
    })

    // Check if all enemies are defeated
    this.checkEnemiesDefeated()
  }

  // Check if all enemies are defeated (common method)
  checkEnemiesDefeated() {
    const currentEnemyCount = this.enemies.children.entries.filter((enemy: any) => enemy.active).length
    
    // If all enemies are defeated, launch corresponding UI scene
    if (currentEnemyCount === 0 && !this.gameCompleted) {
      this.gameCompleted = true

      if (LevelManager.isLastLevel(this.scene.key)) {
        console.log("Game completed!")
        this.scene.launch("GameCompleteUIScene", { 
          currentLevelKey: this.scene.key
        })
      } else {
        this.scene.launch("VictoryUIScene", { 
          currentLevelKey: this.scene.key
        })
      }
    }
  }

  // Abstract methods that subclasses need to override
  abstract setupMapSize(): void
  abstract createPlayer(): void
  abstract createEnemies(): void
  abstract createBackground(): void
  abstract createTileMap(): void
  abstract createDecorations(): void
}
