import Phaser from 'phaser';
import { screenSize } from '../gameConfig.json';

interface GameOverUISceneData {
  currentLevelKey?: string;
}

export class GameOverUIScene extends Phaser.Scene {
  private currentLevelKey: string | null = null; // Store the current level scene key
  private isRestarting: boolean = false; // Reset restart flag
  private overlay!: Phaser.GameObjects.Graphics;
  private mainContainer!: any; // rexUI Sizer type
  private gameOverTitle!: Phaser.GameObjects.Text;
  private failureText!: Phaser.GameObjects.Text;
  private pressEnterText!: Phaser.GameObjects.Text;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({
      key: "GameOverUIScene",
    });
  }

  init(data: GameOverUISceneData): void {
    // Receive data passed from the level scene
    this.currentLevelKey = data.currentLevelKey || "Level1Scene";
    // Reset restart flag
    this.isRestarting = false;
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

    // Create semi-transparent red overlay to create danger atmosphere
    this.overlay = this.add.graphics();
    this.overlay.fillStyle(0x330000, 0.8); // Dark red, 80% transparency
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

    // Create game over title
    this.createGameOverTitle();

    // Create flexible space in the middle
    this.mainContainer.addSpace();

    // Create failure text
    this.createFailureText();

    // Add some space
    this.mainContainer.addSpace();

    // Create PRESS ENTER text
    this.createPressEnterText();

    // Layout UI
    this.mainContainer.layout();
  }

  private createGameOverTitle(): void {
    const screenWidth = screenSize.width.value;
    
    // Create game over title text
    this.gameOverTitle = this.add.text(0, 0, 'GAME OVER', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: Math.min(screenWidth / 12, 80) + 'px',
      color: '#FF0000', // Red color
      stroke: '#000000',
      strokeThickness: 8,
      align: 'center'
    }).setOrigin(0.5, 0.5);

    // Add to main container
    this.mainContainer.add(this.gameOverTitle, {
        proportion: 0, 
        align: 'center',
    });

    // Add blinking animation for title (faster frequency to create urgency)
    this.tweens.add({
      targets: this.gameOverTitle,
      alpha: 0.5,
      duration: 500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }

  private createFailureText(): void {
    const screenWidth = screenSize.width.value;
    
    // Create failure text
    this.failureText = this.add.text(0, 0, 'Your gundam has been destroyed!', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: Math.min(screenWidth / 25, 36) + 'px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5, 0.5);

    // Add to main container
    this.mainContainer.add(this.failureText, {
        proportion: 0, 
        align: 'center',
    });
  }

  private createPressEnterText(): void {
    const screenWidth = screenSize.width.value;
    
    console.log('use font RetroPixel');
    
    // Create PRESS ENTER text
    this.pressEnterText = this.add.text(0, 0, 'PRESS ENTER TO RESTART', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: Math.min(screenWidth / 25, 36) + 'px',
      color: '#FFFF00', // Yellow color
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
    this.input.on('pointerdown', () => this.restartGame());

    // Listen for key press events
    this.enterKey.on('down', () => this.restartGame());
    this.spaceKey.on('down', () => this.restartGame());
  }

  private restartGame(): void {
    // Prevent multiple triggers
    if (this.isRestarting) return;
    this.isRestarting = true;

    console.log(`Restarting current level: ${this.currentLevelKey}`);

    // Stop current level's background music
    const currentScene = this.scene.get(this.currentLevelKey!) as any;
    if (currentScene && currentScene.backgroundMusic) {
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
    
    // Restart current level
    this.scene.start(this.currentLevelKey!);
  }

  update(): void {
    // Game over UI scene doesn't need special update logic
  }
}
