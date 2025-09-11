import 'phaser';

declare global {
  namespace Phaser {
    interface Scene {
      rexUI: any;
    }
  }
}

export {};
