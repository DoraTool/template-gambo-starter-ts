import Phaser from 'phaser'
import { Sizer } from 'phaser3-rex-plugins/templates/ui/ui-components.js'

export class UIScene extends Phaser.Scene {
  private gameSceneKey!: string
  private healthBar!: Phaser.GameObjects.Graphics
  private healthText!: Phaser.GameObjects.Text
  private uiContainer!: Sizer

  constructor() {
    super({ key: "UIScene" })
  }

  init(data: { gameSceneKey: string }) {
    this.gameSceneKey = data.gameSceneKey
  }

  create() {
    // Create UI container using rexUI Sizer
    this.uiContainer = this.rexUI.add.sizer({
      x: 0,
      y: 0,
      width: this.cameras.main.width,
      height: 100,
      orientation: 'horizontal',
      space: { left: 20, right: 20, top: 20, bottom: 20, item: 20 }
    })

    // Create health display
    this.createHealthDisplay()

    // Position UI container at top of screen
    this.uiContainer.setPosition(0, 0)
    this.uiContainer.setScrollFactor(0) // Keep UI fixed on screen
    this.uiContainer.layout()
  }

  createHealthDisplay() {
    // Create health bar background
    const healthBarBg = this.add.graphics()
    healthBarBg.fillStyle(0x000000, 0.5)
    healthBarBg.fillRoundedRect(0, 0, 200, 30, 5)

    // Create health bar
    this.healthBar = this.add.graphics()
    this.updateHealthBar(100) // Start with full health

    // Create health text
    this.healthText = this.add.text(0, 0, 'Health: 100%', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'RetroPixel'
    })

    // Create health container using OverlapSizer for layered elements
    const healthContainer = this.rexUI.add.overlapSizer({
      width: 200,
      height: 40
    })

    // Add elements to health container
    healthContainer.add(healthBarBg, { align: 'left-top' })
    healthContainer.add(this.healthBar, { align: 'left-top' })
    healthContainer.add(this.healthText, { align: 'center' })

    // Add health container to main UI container
    this.uiContainer.add(healthContainer, { expand: false })
  }

  updateHealthBar(healthPercentage: number) {
    this.healthBar.clear()
    
    // Determine health bar color based on percentage
    let color = 0x00ff00 // Green
    if (healthPercentage < 30) {
      color = 0xff0000 // Red
    } else if (healthPercentage < 60) {
      color = 0xffff00 // Yellow
    }

    // Draw health bar
    this.healthBar.fillStyle(color)
    const barWidth = (healthPercentage / 100) * 190 // 190 = 200 - 10 (padding)
    this.healthBar.fillRoundedRect(5, 5, barWidth, 20, 3)

    // Update health text
    this.healthText.setText(`Health: ${Math.round(healthPercentage)}%`)
  }

  update() {
    // Get player from game scene and update health display
    const gameScene = this.scene.get(this.gameSceneKey) as any
    if (gameScene && gameScene.player) {
      const healthPercentage = gameScene.player.getHealthPercentage()
      this.updateHealthBar(healthPercentage)
    }
  }
}
