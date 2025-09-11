import Phaser from 'phaser';
import { screenSize } from '../gameConfig.json';

interface GameCompleteUISceneData {
  currentLevelKey?: string;
}

export class GameCompleteUIScene extends Phaser.Scene {
  private currentLevelKey: string | null = null; // Store the current level scene key
  private isTransitioning: boolean = false; // Reset transition flag
  private overlay!: Phaser.GameObjects.Graphics;
  private mainContainer!: any; // rexUI Sizer type
  private gameCompleteTitle!: Phaser.GameObjects.Text;
  private congratulationsText!: Phaser.GameObjects.Text;
  private pressEnterText!: Phaser.GameObjects.Text;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({
      key: "GameCompleteUIScene",
    });
  }

  init(data: GameCompleteUISceneData): void {
    // Receive data passed from the level scene
    this.currentLevelKey = data.currentLevelKey || "Level2Scene";
    // Reset transition flag
    this.isTransitioning = false;
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
        top: 120,           // Top padding
        bottom: 120,        // Bottom padding
        left: 20,          // Left padding
        right: 20          // Right padding
      }
    });

    // Create game complete title
    this.createGameCompleteTitle();

    // Create flexible space in the middle
    this.mainContainer.addSpace();

    // Create congratulations text
    this.createCongratulationsText();

    // Add some space
    this.mainContainer.addSpace();

    // Create PRESS ENTER text
    this.createPressEnterText();

    // Layout UI
    this.mainContainer.layout();
  }

  private createGameCompleteTitle(): void {
    const screenWidth = screenSize.width.value;
    
    // Create game complete title text
    this.gameCompleteTitle = this.add.text(0, 0, 'GAME COMPLETE!', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: Math.min(screenWidth / 13, 72) + 'px',
      color: '#FFD700', // Gold color
      stroke: '#000000',
      strokeThickness: 8,
      align: 'center'
    }).setOrigin(0.5, 0.5);

    // Add to main container
    this.mainContainer.add(this.gameCompleteTitle, {
        proportion: 0, 
        align: 'center',
    });

    // Add blinking animation for title
    this.tweens.add({
      targets: this.gameCompleteTitle,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 1200,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }

  private createCongratulationsText(): void {
    const screenWidth = screenSize.width.value;
    
    // Create congratulations text
    this.congratulationsText = this.add.text(0, 0, 'Congratulations!\nYou have completed all levels!', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: Math.min(screenWidth / 25, 36) + 'px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5, 0.5);

    // Add to main container
    this.mainContainer.add(this.congratulationsText, {
        proportion: 0, 
        align: 'center',
    });

    // Add rainbow color effect
    this.tweens.add({
      targets: this.congratulationsText,
      duration: 3000,
      repeat: -1,
      onUpdate: () => {
        const hue = (this.time.now * 0.1) % 360;
        const color = Phaser.Display.Color.HSVToRGB(hue / 360, 1, 1) as Phaser.Types.Display.ColorObject;
        this.congratulationsText.setColor(`rgb(${Math.floor(color.r)}, ${Math.floor(color.g)}, ${Math.floor(color.b)})`);
      }
    });
  }

  private createPressEnterText(): void {
    const screenWidth = screenSize.width.value;
    
    console.log('use font RetroPixel');
    
    // Create PRESS ENTER text
    this.pressEnterText = this.add.text(0, 0, 'PRESS ENTER TO RETURN TO MENU', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: Math.min(screenWidth / 28, 32) + 'px',
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
    this.input.on('pointerdown', () => this.returnToMenu());

    // Listen for key press events
    this.enterKey.on('down', () => this.returnToMenu());
    this.spaceKey.on('down', () => this.returnToMenu());
  }

  private returnToMenu(): void {
    // Prevent multiple triggers
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    console.log("Returning to title screen");

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
    
    // Start title screen
    this.scene.start("TitleScreen");
  }

  update(): void {
    // Game complete UI scene doesn't need special update logic
  }
}
