import Phaser from 'phaser';
import { screenSize } from '../gameConfig.json';
import { LevelManager } from '../LevelManager';

interface VictoryUISceneData {
  currentLevelKey: string;
}

export class VictoryUIScene extends Phaser.Scene {
  private currentLevelKey: string | null = null; // Store the current level scene key
  private overlay!: Phaser.GameObjects.Graphics;
  private mainContainer!: any; // rexUI Sizer type
  private victoryTitle!: Phaser.GameObjects.Text;
  private subtitle!: Phaser.GameObjects.Text;
  private pressEnterText!: Phaser.GameObjects.Text;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({
      key: "VictoryUIScene",
    });
  }

  init(data: VictoryUISceneData): void {
    // Receive data passed from the level scene
    this.currentLevelKey = data.currentLevelKey;
  }

  create(): void {
    // Create semi-transparent overlay background
    this.createOverlay();

    // Create UI directly, fonts have been loaded through Phaser loader
    this.createUI();

    // Setup input controls
    this.setupInputs();
  }

  private createOverlay(): void {
    // Get screen dimensions
    const screenWidth = screenSize.width.value;
    const screenHeight = screenSize.height.value;

    // Create semi-transparent black overlay
    this.overlay = this.add.graphics();
    this.overlay.fillStyle(0x000000, 0.7); // Black, 70% transparency
    this.overlay.fillRect(0, 0, screenWidth, screenHeight);
  }

  private createUI(): void {
    const screenWidth = screenSize.width.value;
    const screenHeight = screenSize.height.value;

    // Create vertical layout container using rexUI
    this.mainContainer = this.rexUI.add.sizer({
      x: screenWidth / 2,
      y: screenHeight / 2,
      width: screenWidth,
      height: screenHeight,
      orientation: 'vertical',
      space: { 
        top: 150,           // Top padding
        bottom: 150,        // Bottom padding
        left: 20,          // Left padding
        right: 20          // Right padding
      }
    });

    // Create victory title
    this.createVictoryTitle();

    // Create flexible space in the middle
    this.mainContainer.addSpace();

    // Create subtitle
    this.createSubtitle();

    // Add some space
    this.mainContainer.addSpace();

    // Create PRESS ENTER text
    this.createPressEnterText();

    // Layout UI
    this.mainContainer.layout();
  }

  private createVictoryTitle(): void {
    const screenWidth = screenSize.width.value;
    
    // Create victory title text
    this.victoryTitle = this.add.text(0, 0, 'LEVEL COMPLETE!', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: Math.min(screenWidth / 15, 64) + 'px',
      color: '#FFD700', // Gold color
      stroke: '#000000',
      strokeThickness: 6,
      align: 'center'
    }).setOrigin(0.5, 0.5);

    // Add to main container
    this.mainContainer.add(this.victoryTitle, {
        proportion: 0, 
        align: 'center',
    });

    // Add blinking animation for victory text
    this.tweens.add({
      targets: this.victoryTitle,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }

  private createSubtitle(): void {
    const screenWidth = screenSize.width.value;
    
    // Create subtitle text
    this.subtitle = this.add.text(0, 0, 'All enemies defeated!', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: Math.min(screenWidth / 25, 36) + 'px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5, 0.5);

    // Add to main container
    this.mainContainer.add(this.subtitle, {
        proportion: 0, 
        align: 'center',
    });
  }

  private createPressEnterText(): void {
    const screenWidth = screenSize.width.value;
    
    console.log('use font RetroPixel');
    
    // Create PRESS ENTER text
    this.pressEnterText = this.add.text(0, 0, 'PRESS ENTER FOR NEXT LEVEL', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: Math.min(screenWidth / 25, 36) + 'px',
      color: '#00FF00', // Green color
      stroke: '#000000',
      strokeThickness: 6,
      align: 'center'
    }).setOrigin(0.5, 0.5);

    // Add to main container
    this.mainContainer.add(this.pressEnterText, { 
      proportion: 0, 
      align: 'center',
    });

    // Add blinking animation
    this.tweens.add({
      targets: this.pressEnterText,
      alpha: 0.3,
      duration: 800,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }

  private setupInputs(): void {
    // Clean up any existing event listeners
    this.input.off('pointerdown');
    
    // Create keyboard input
    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Listen for mouse click events (listen directly on input)
    this.input.on('pointerdown', () => this.goToNextLevel());

    // Listen for key press events
    this.enterKey.on('down', () => this.goToNextLevel());
    this.spaceKey.on('down', () => this.goToNextLevel());
  }

  private goToNextLevel(): void {
    console.log(`Going to next level from: ${this.currentLevelKey}`);

    // Use LevelManager directly to get next level information
    const nextLevelKey = LevelManager.getNextLevelScene(this.currentLevelKey!);
    if (!nextLevelKey) {
      console.error(`No next level found for: ${this.currentLevelKey}`);
      return;
    }

    console.log(`Next level: ${nextLevelKey}`);

    // Get current level scene to stop background music
    const currentScene = this.scene.get(this.currentLevelKey!) as any;

    // Stop current level's background music
    if (currentScene.backgroundMusic) {
      currentScene.backgroundMusic.stop();
    }

    // Clean up event listeners
    this.input.off('pointerdown');
    if (this.enterKey) {
      this.enterKey.off('down');
    }
    if (this.spaceKey) {
      this.spaceKey.off('down');
    }

    // Stop all game-related scenes
    this.scene.stop("UIScene");
    this.scene.stop(this.currentLevelKey!);
    
    // Start next level
    this.scene.start(nextLevelKey);
  }

  update(): void {
    // Victory UI scene doesn't need special update logic
  }
}
