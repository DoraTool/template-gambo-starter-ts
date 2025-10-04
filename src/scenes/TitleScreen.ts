import Phaser from 'phaser';
import { screenSize } from '../gameConfig.json';
import { LevelManager } from '../LevelManager';
import { initScale } from '../utils';

export class TitleScreen extends Phaser.Scene {
  private isStarting: boolean = false; // Initialize starting flag
  private background!: Phaser.GameObjects.Image;
  private gameTitle!: Phaser.GameObjects.Image;
  private pressEnterText!: Phaser.GameObjects.Text;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private backgroundMusic!: Phaser.Sound.BaseSound;

  constructor() {
    super({
      key: "TitleScreen",
    });
    this.isStarting = false; // Initialize starting flag
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
    this.background = this.add.image(screenWidth / 2, screenHeight / 2, "space_background");
    
    // Use initScale instead of setScale
    initScale(this.background, { x: 0.5, y: 0.5 }, screenWidth, screenHeight);
  }

  private createUI(): void {
    // Use native Phaser elements for layout
    this.createGameTitle();
    this.createPressEnterText();
  }

  private createGameTitle(): void {
    const screenWidth = screenSize.width.value;
    const screenHeight = screenSize.height.value;
    
    this.gameTitle = this.add.image(screenWidth / 2, screenHeight * 0.35, "game_title");
    
    const maxTitleWidth = screenWidth * 0.7;
    const maxTitleHeight = screenHeight * 0.6;

    // Use initScale instead of setScale
    initScale(this.gameTitle, { x: 0.5, y: 0.5 }, maxTitleWidth, maxTitleHeight);
    
    // Ensure top distance is 50px
    this.gameTitle.y = 50 + this.gameTitle.displayHeight / 2;
  }

  private createPressEnterText(): void {
    const screenWidth = screenSize.width.value;
    const screenHeight = screenSize.height.value;
    
    // Create PRESS ENTER text (centered at bottom)
    this.pressEnterText = this.add.text(screenWidth / 2, screenSize.height.value * 0.75, 'PRESS ENTER', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: Math.min(screenWidth / 20, 48) + 'px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 10,
      align: 'center'
    }).setOrigin(0.5, 0.5);

    // Ensure bottom distance is 80px
    this.pressEnterText.y = screenHeight - 80 - this.pressEnterText.displayHeight / 2;

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
    this.backgroundMusic = this.sound.add("space_battle_8bit_theme", {
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
