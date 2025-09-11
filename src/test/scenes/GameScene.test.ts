import { describe, it, expect, afterEach } from "vitest";
import Phaser from "phaser";
import {
  bootScene,
  destroyGame,
  tickFrames,
  waitUntil,
} from "../helpers/phaser";
import GameScene from "../../scenes/GameScene";

let currentGame: Phaser.Game | null = null;

afterEach(async () => {
  if (currentGame) {
    await destroyGame(currentGame);
    currentGame = null;
  }
});

describe("GameScene (HEADLESS)", () => {
  it("boots and runs at least a few frames without errors", async () => {
    const { game, scene } = await bootScene(GameScene);
    currentGame = game;

    // Tick frame until scene is active
    await waitUntil(() => scene.scene?.isActive(), 10000);

    // Tick frame 5 times
    await tickFrames(5);

    expect(scene.scene.isActive()).toBe(true);
  });
});
