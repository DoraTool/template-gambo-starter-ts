import Phaser from 'phaser'
import { BaseLevelScene } from './BaseLevelScene'
import { CupheadPlayer } from './CupheadPlayer'
import { SaltShakerEnemy } from './SaltShakerEnemy'

export class KitchenLevel1Scene extends BaseLevelScene {
  private tilemap!: Phaser.Tilemaps.Tilemap
  private groundLayer!: Phaser.Tilemaps.TilemapLayer

  constructor() {
    super({
      key: "KitchenLevel1Scene",
    })
  }

  create() {
    // Create basic game elements
    this.createBaseElements()

    // Play background music
    this.backgroundMusic = this.sound.add("kitchen_adventure_theme", {
      volume: 0.6,
      loop: true
    })
    this.backgroundMusic.play()
  }

  update() {
    // Call base update method
    this.baseUpdate()
  }

  // Subclass override method: Set map size method, where 30 and 20 must match the width and height in the map asset info
  setupMapSize() {
    this.mapWidth = 30 * 64
    this.mapHeight = 20 * 64
  }

  // Create player at appropriate position
  createPlayer() {
    // Place player on the main ground platform, left side
    this.player = new CupheadPlayer(this, 200, this.mapHeight - 64)
  }

  // Create enemies based on map layout
  createEnemies() {
    // Place enemies on different platforms based on map info
    
    // Enemy on left middle platform (x0:2, y0:14, x1:8, y1:16)
    const leftPlatformY = 14 * 64
    const leftPlatformCenterX = (2 + 8) * 64 / 2
    const enemy1 = new SaltShakerEnemy(this, leftPlatformCenterX, leftPlatformY)
    this.enemies.add(enemy1)

    // Enemy on central high platform (x0:12, y0:10, x1:18, y1:12)
    const centralPlatformY = 10 * 64
    const centralPlatformCenterX = (12 + 18) * 64 / 2
    const enemy2 = new SaltShakerEnemy(this, centralPlatformCenterX, centralPlatformY)
    this.enemies.add(enemy2)

    // Enemy on right middle platform (x0:22, y0:14, x1:28, y1:16)
    const rightPlatformY = 14 * 64
    const rightPlatformCenterX = (22 + 28) * 64 / 2
    const enemy3 = new SaltShakerEnemy(this, rightPlatformCenterX, rightPlatformY)
    this.enemies.add(enemy3)
  }

  // Create background
  createBackground() {
    // Calculate background scale to match map height
    const bgTexture = this.textures.get('kitchen_background')
    const bgScale = this.mapHeight / bgTexture.getSourceImage().height
    const bgWidth = bgTexture.getSourceImage().width * bgScale

    // Create tiled background if needed
    for (let x = 0; x < this.mapWidth; x += bgWidth) {
      this.add.image(x, this.mapHeight, 'kitchen_background')
        .setOrigin(0, 1)
        .setScale(bgScale)
        .setScrollFactor(0.2) // Parallax scrolling
    }
  }

  // Create tile map
  createTileMap() {
    // Create tilemap from JSON
    this.tilemap = this.make.tilemap({ key: 'kitchen_level1_map' })
    
    // Add tileset
    const tileset = this.tilemap.addTilesetImage('kitchen_floor_tileset', 'kitchen_floor_tileset')
    
    // Create ground layer
    this.groundLayer = this.tilemap.createLayer('ground_layer', tileset!)!
    
    // Set collision for all non-empty tiles (exclude -1 which is empty)
    this.groundLayer.setCollisionByExclusion([-1])
    
    // Set up collisions with player and enemies
    this.physics.add.collider(this.player, this.groundLayer)
    this.physics.add.collider(this.enemies, this.groundLayer)
  }

  // Create decorations based on map layout
  createDecorations() {
    // Add decorations on various platforms
    
    // Decorations on main ground platform
    this.addDecoration('kitchen_pot_variant_1', 400, this.mapHeight - 64, 0.8)
    this.addDecoration('kitchen_utensil_variant_1', 600, this.mapHeight - 64, 0.6)
    this.addDecoration('kitchen_bottle_variant_1', 800, this.mapHeight - 64, 0.7)
    this.addDecoration('kitchen_food_variant_1', 1000, this.mapHeight - 64, 0.5)

    // Decorations on left middle platform
    const leftPlatformY = 14 * 64
    this.addDecoration('kitchen_pot_variant_2', 4 * 64, leftPlatformY, 0.8)
    this.addDecoration('kitchen_utensil_variant_2', 6 * 64, leftPlatformY, 0.6)

    // Decorations on central high platform
    const centralPlatformY = 10 * 64
    this.addDecoration('kitchen_bottle_variant_2', 14 * 64, centralPlatformY, 0.7)
    this.addDecoration('kitchen_food_variant_2', 16 * 64, centralPlatformY, 0.5)

    // Decorations on right middle platform
    const rightPlatformY = 14 * 64
    this.addDecoration('kitchen_pot_variant_1', 24 * 64, rightPlatformY, 0.8)
    this.addDecoration('kitchen_bottle_variant_1', 26 * 64, rightPlatformY, 0.7)

    // Decorations on upper platforms
    const leftUpperPlatformY = 6 * 64
    this.addDecoration('kitchen_utensil_variant_1', 7 * 64, leftUpperPlatformY, 0.6)
    
    const rightUpperPlatformY = 6 * 64
    this.addDecoration('kitchen_food_variant_1', 23 * 64, rightUpperPlatformY, 0.5)
  }

  // Helper method to add decorations with consistent scaling
  private addDecoration(key: string, x: number, y: number, baseScale: number) {
    const decoration = this.add.image(x, y, key)
    decoration.setOrigin(0.5, 1) // Ground objects origin
    
    // Calculate scale based on decoration height relative to tile size
    const targetHeight = baseScale * 64 // Scale relative to tile size
    const actualHeight = decoration.height
    const scale = targetHeight / actualHeight
    decoration.setScale(scale)
    
    // Decorations are just visual elements, no physics needed
    this.decorations.add(decoration)
  }
}
