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
  scene: [CarStudioScene]
};

class CarStudioScene extends Phaser.Scene {
  constructor() { super('CarStudio'); }

  create() {
    this.isDriving = false;
    this.playStart = Date.now();

    // 1. Generate Textures with Code
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Wheels
    g.fillStyle(0x222222, 1); g.fillCircle(30, 30, 30);
    g.fillStyle(0x888888, 1); g.fillCircle(30, 30, 15);
    g.generateTexture('wheel', 60, 60);

    // Car Bodies (White so we can tint them any color)
    g.clear(); g.fillStyle(0xffffff, 1); g.fillRoundedRect(0, 0, 240, 100, 20); g.generateTexture('body', 240, 100);

    // Buttons
    g.clear(); g.fillStyle(0xffffff, 1); g.fillRoundedRect(0, 0, 120, 60, 15); g.generateTexture('btn', 120, 60);
    g.destroy();

    // 2. Build the Car
    this.carGroup = this.add.container(400, 350);
    this.carBody = this.add.image(0, 0, 'body');
    this.carBody.setTint(0x2ecc71); // Default Green
    this.wheel1 = this.add.image(-70, 50, 'wheel');
    this.wheel2 = this.add.image(70, 50, 'wheel');
    this.carGroup.add([this.wheel1, this.wheel2, this.carBody]);

    // 3. UI - Paint Buttons
    this.add.text(400, 80, 'Dino Car Studio', { fontFamily: 'system-ui', fontSize: '40px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(400, 130, 'Paint your car, then hit Drive!', { fontFamily: 'system-ui', fontSize: '20px', color: '#9ba4b5' }).setOrigin(0.5);

    const colors = [
      { color: 0xe74c3c, x: 250 }, // Red
      { color: 0x3498db, x: 400 }, // Blue
      { color: 0x2ecc71, x: 550 }  // Green
    ];

    colors.forEach(c => {
      const btn = this.add.image(c.x, 200, 'btn').setTint(c.color).setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => {
        if (this.isDriving) return;
        this.carBody.setTint(c.color);
        this.tweens.add({ targets: btn, scaleX: 0.9, scaleY: 0.9, duration: 100, yoyo: true });
      });
    });

    // 4. UI - Drive Button
    this.driveBtn = this.add.text(400, 480, '🏁 Drive!', {
      fontFamily: 'system-ui', fontSize: '36px', color: '#0b1a2b', backgroundColor: '#f1c40f',
      padding: { x: 40, y: 20 }, borderRadius: 20
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.driveBtn.on('pointerdown', () => {
      if (this.isDriving) return;
      this.driveCar();
    });

    // 5. Home Button
    this.add.text(760, 20, '🏠', { fontSize: '32px' }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).on('pointerdown', () => { window.location.href = '/dino/'; });
  }

  driveCar() {
    this.isDriving = true;
    this.driveBtn.setVisible(false);

    // Bounce animation
    this.tweens.add({
      targets: this.carGroup,
      y: 330,
      duration: 100,
      yoyo: true,
      repeat: 3
    });

    // Spin wheels
    this.tweens.add({
      targets: [this.wheel1, this.wheel2],
      angle: 360,
      duration: 300,
      repeat: 5
    });

    // Drive across screen
    this.tweens.add({
      targets: this.carGroup,
      x: 900,
      duration: 1500,
      delay: 400,
      ease: 'Power2',
      onComplete: () => {
        this.time.delayedCall(500, () => this.resetCar());
      }
    });
  }

  resetCar() {
    this.carGroup.x = -200; // Start off screen left
    this.carGroup.y = 350;
    this.wheel1.angle = 0;
    this.wheel2.angle = 0;

    // Drive back to center
    this.tweens.add({
      targets: this.carGroup,
      x: 400,
      duration: 1000,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.isDriving = false;
        this.driveBtn.setVisible(true);

        // Save Progress!
        if (window.DinoProgress) {
          window.DinoProgress.record('dino-car-studio', 5); // Give 5 stars
          window.DinoProgress.addPlaytime(Math.round((Date.now() - this.playStart) / 1000));
        }
      }
    });
  }
}

new Phaser.Game(config);
