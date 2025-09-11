import Phaser from 'phaser';
import { screenSize } from '../gameConfig.json';
import { LevelManager } from '../LevelManager';

export class TitleScreen extends Phaser.Scene {
  private isStarting: boolean = false; // Initialize starting flag
  private background!: Phaser.GameObjects.Image;
  private gameTitle!: Phaser.GameObjects.Image;
  private pressEnterText!: Phaser.GameObjects.Text;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private backgroundMusic!: Phaser.Sound.BaseSound;
  private mainContainer!: any; // rexUI Sizer type

  constructor() {
    super({
      key: "TitleScreen",
    });
  }

  init(): void {
    // Reset starting flag
    this.isStarting = false;
  }

  create(): void {
    // Create background
    this.createBackground();

    // Create UI directly, fonts are already loaded through Phaser loader
    this.createUI();

    // Setup input controls
    this.setupInputs();

    // Play background music
    this.playBackgroundMusic();
  }

  private createBackground(): void {
    // Get screen dimensions
    const screenWidth = screenSize.width.value;
    const screenHeight = screenSize.height.value;

    // Create background and scale to fill screen
    this.background = this.add.image(screenWidth / 2, screenHeight / 2, "kitchen_background");
    
    // Calculate scale ratio to fill screen
    const scaleX = screenWidth / this.background.width;
    const scaleY = screenHeight / this.background.height;
    const scale = Math.max(scaleX, scaleY); // Use larger scale ratio to ensure complete coverage

    this.background.setScale(scale);
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
        top: 50,            // Top padding
        bottom: 80,         // Bottom padding
        left: 20,           // Left padding
        right: 20           // Right padding
      }
    });

    // Create game title
    this.createGameTitle();

    // Create flexible space in the middle
    this.mainContainer.addSpace();

    // Create PRESS ENTER text
    this.createPressEnterText();

    // Layout UI
    this.mainContainer.layout();
  }

  private createGameTitle(): void {
    const screenWidth = screenSize.width.value;
    const screenHeight = screenSize.height.value;
    
    // Create game title image
    this.gameTitle = this.add.image(0, 0, "cuphead_kitchen_title");
    
    const maxTitleWidth = screenWidth * 0.7;
    const maxTitleHeight = screenHeight * 0.6;

    if (this.gameTitle.width / this.gameTitle.height > maxTitleWidth / maxTitleHeight) {
        this.gameTitle.setScale(maxTitleWidth / this.gameTitle.width);
    } else {
        this.gameTitle.setScale(maxTitleHeight / this.gameTitle.height);
    }

    // Add to main container
    this.mainContainer.add(this.gameTitle, {
        proportion: 0, 
        align: 'center',
    });
  }

  private createPressEnterText(): void {
    const screenWidth = screenSize.width.value;
    
    // Create PRESS ENTER text
    this.pressEnterText = this.add.text(0, 0, 'PRESS ENTER', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: Math.min(screenWidth / 20, 48) + 'px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 10,
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
      duration: 1000,
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
    this.input.on('pointerdown', () => this.startGame());

    // Listen for key events
    this.enterKey.on('down', () => this.startGame());
    this.spaceKey.on('down', () => this.startGame());
  }

  private playBackgroundMusic(): void {
    // Play background music (lower volume)
    this.backgroundMusic = this.sound.add("kitchen_adventure_theme", {
      volume: 0.4,
      loop: true
    });
    this.backgroundMusic.play();
  }

  private startGame(): void {
    // Prevent multiple triggers
    if (this.isStarting) return;
    this.isStarting = true;

    // Stop background music
    if (this.backgroundMusic) {
      this.backgroundMusic.stop();
    }

    // Add transition effect
    this.cameras.main.fadeOut(500, 0, 0, 0);
    
    // Start first level after delay
    this.time.delayedCall(500, () => {
      const firstLevelScene = LevelManager.getFirstLevelScene();
      if (firstLevelScene) {
        this.scene.start(firstLevelScene);
      } else {
        console.error("No first level scene found in LEVEL_ORDER");
      }
    });
  }

  update(): void {
    // Title screen doesn't need special update logic
  }
}
