const config = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#0b1a2b',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 600
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 600 }, debug: false }
  },
  scene: [DinoParkScene]
};

class DinoParkScene extends Phaser.Scene {
  constructor() { super('DinoPark'); }

  create() {
    this.score = 0;
    this.lives = 3;

    // Draw the graphics with code (no images needed!)
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x2ecc71, 1); g.fillRoundedRect(0, 0, 80, 60, 12); g.generateTexture('dino', 80, 60);
    g.clear(); g.fillStyle(0xf1c40f, 1); g.fillCircle(20, 20, 20); g.generateTexture('egg', 40, 40);
    g.clear(); g.fillStyle(0xe74c3c, 1); g.fillRect(0, 0, 40, 40); g.generateTexture('rock', 40, 40);
    g.destroy();

    this.player = this.physics.add.sprite(400, 500, 'dino').setCollideWorldBounds(true);

    this.eggs = this.physics.add.group();
    this.rocks = this.physics.add.group();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.on('pointermove', (p) => {
      if (p.isDown) this.player.x = Phaser.Math.Clamp(p.worldX, 40, 760);
    });

    this.time.addEvent({ delay: 900, loop: true, callback: () => this.spawnFalling() });

    this.physics.add.overlap(this.player, this.eggs, (_, egg) => {
      egg.destroy(); this.score += 1; this.updateHUD();
      this.cameras.main.flash(120, 46, 204, 113);
    });

    this.physics.add.overlap(this.player, this.rocks, (_, rock) => {
      rock.destroy(); this.lives -= 1; this.updateHUD();
      this.cameras.main.shake(160, 0.01);
      if (this.lives <= 0) this.gameOver();
    });

    this.hud = this.add.text(20, 20, '', { fontFamily: 'system-ui', fontSize: '24px', color: '#fff' });
    this.updateHUD();

    this.add.text(760, 20, '🏠', { fontSize: '32px' }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).on('pointerdown', () => { window.location.href = '/dino/'; });

    this.playStart = Date.now();
  }

  spawnFalling() {
    const isRock = Math.random() < 0.35;
    const group = isRock ? this.rocks : this.eggs;
    const item = group.create(Phaser.Math.Between(60, 740), -40, isRock ? 'rock' : 'egg');
    item.setVelocityY(Phaser.Math.Between(120, 220));
    item.setAngularVelocity(isRock ? 180 : 0);
  }

  updateHUD() { this.hud.setText(`⭐ ${this.score}    ❤️ ${this.lives}`); }

  update() {
    const speed = 320;
    if (this.cursors.left.isDown) this.player.setVelocityX(-speed);
    else if (this.cursors.right.isDown) this.player.setVelocityX(speed);
    else this.player.setVelocityX(0);

    [this.eggs, this.rocks].forEach((group) => {
      group.getChildren().forEach((child) => { if (child.y > 640) child.destroy(); });
    });
  }

  gameOver() {
    if (window.DinoProgress) {
      window.DinoProgress.record('dino-park', Math.min(5, this.score));
      window.DinoProgress.addPlaytime(Math.round((Date.now() - this.playStart) / 1000));
    }
    this.scene.pause();
    this.add.text(400, 300, `Game Over!\n⭐ ${this.score}\nTap to play again`, { fontFamily: 'system-ui', fontSize: '40px', color: '#fff', align: 'center' }).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.scene.restart());
  }
}

new Phaser.Game(config);
