"use strict";

// Logic Brick Breaker — MÀN 1
// sân 500 × 500, gạch 50 × 10 (8 cột × 3 hàng), thanh đỡ 80 × 10, bóng 10 × 10
// Hệ tọa độ: (0, 0) là góc trên trái của sân, x tăng sang phải, y tăng xuống dưới
class BrickBreakerGame {
  constructor() {
    this.width = 500;
    this.height = 500;
    this.step = 1 / 240; // bước vật lý cố định
    // Mỗi phần tử là một màn. Hiện mới có màn 1; thêm màn mới bằng cách thêm vào mảng này
    this.levels = [
      { name: "Khởi động", type: "normal", rows: 3, speed: 250 }
    ];
    this.paddle = { x: 0, y: 485, width: 80, height: 10, speed: 350 }; // cách đáy 5px
    this.ball = { x: 0, y: 0, radius: 5, vx: 0, vy: 0 };
    this.restart();
  }

  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  circleIntersectsRect(circle, rect) {
    const x = this.clamp(circle.x, rect.x, rect.x + rect.width);
    const y = this.clamp(circle.y, rect.y, rect.y + rect.height);
    return (circle.x - x) ** 2 + (circle.y - y) ** 2 <= circle.radius ** 2;
  }

  getCurrentLevel() {
    return { ...this.levels[this.level - 1] };
  }

  getRemainingBrickCount() {
    return this.bricks.filter(brick => brick.hp > 0).length;
  }

  hasNextLevel() {
    return this.level < this.levels.length;
  }

  restart() {
    this.score = 0;
    this.lives = 3;
    this.loadLevel(1);
  }

  loadLevel(levelNumber) {
    this.level = levelNumber;
    this.status = "ready";
    this.time = 0;
    this.accumulator = 0;
    this.direction = 0;
    this.bricks = this.createBricks();
    this.paddle.x = (this.width - this.paddle.width) / 2; // 210
    this.resetBall();
  }

  // 8 cột × 3 hàng, gạch 50 × 10, khoảng cách 10px, lề trái 15px, lề trên 45px
  createBricks() {
    const config = this.getCurrentLevel();
    const columns = 8, width = 50, height = 10, gap = 10;
    const startX = 15, startY = 45;
    const result = [];
    for (let row = 0; row < config.rows; row++) {
      for (let column = 0; column < columns; column++) {
        result.push({
          id: row * columns + column, row, column,
          x: startX + column * (width + gap),
          y: startY + row * (height + gap),
          width, height, hp: 1, maxHp: 1
        });
      }
    }
    return result;
  }

  resetBall() {
    this.ball.x = this.paddle.x + this.paddle.width / 2;
    this.ball.y = this.paddle.y - this.ball.radius - 1;
    this.ball.vx = 0;
    this.ball.vy = 0;
  }

  launchBall() {
    const speed = this.getCurrentLevel().speed;
    this.ball.vx = speed * 0.35;
    this.ball.vy = -Math.sqrt(speed ** 2 - this.ball.vx ** 2);
    this.status = "playing";
    this.accumulator = 0;
  }

  nextLevel() {
    if (!this.hasNextLevel()) return false;
    this.loadLevel(this.level + 1);
    return true;
  }

  setDirection(direction) {
    this.direction = Math.sign(direction); // -1: trái; 0: dừng; 1: phải
  }

  pause() {
    if (this.status !== "playing") return;
    this.status = "paused";
    this.direction = 0;
    this.accumulator = 0;
  }

  resume() {
    this.status = "playing";
  }

  update(deltaSeconds) {
    if (!["ready", "playing"].includes(this.status)) return;
    this.accumulator += Math.min(deltaSeconds, 0.25);
    while (this.accumulator + 1e-12 >= this.step) {
      this.accumulator = Math.max(0, this.accumulator - this.step);
      this.updateStep(this.step);
      if (!["ready", "playing"].includes(this.status)) { this.accumulator = 0; break; }
    }
  }

  updateStep(dt) {
    this.movePaddle(dt);
    if (this.status === "ready") { this.resetBall(); return; }
    this.time += dt;
    const previous = { x: this.ball.x, y: this.ball.y };
    this.moveBall(dt);
    this.handleWallCollision();
    if (this.ball.y - this.ball.radius > this.height) { this.loseLife(); return; }
    this.handlePaddleCollision(previous);
    this.handleBrickCollision(previous);
    this.checkLevelCompletion();
  }

  movePaddle(dt) {
    this.paddle.x = this.clamp(this.paddle.x + this.direction * this.paddle.speed * dt,
      0, this.width - this.paddle.width);
  }

  moveBall(dt) {
    this.ball.x += this.ball.vx * dt;
    this.ball.y += this.ball.vy * dt;
  }

  // ===== Va chạm =====
  handleWallCollision() {
    const b = this.ball;
    if (b.x < b.radius) { b.x = b.radius; b.vx = Math.abs(b.vx); }
    if (b.x > this.width - b.radius) { b.x = this.width - b.radius; b.vx = -Math.abs(b.vx); }
    if (b.y < b.radius) { b.y = b.radius; b.vy = Math.abs(b.vy); }
  }

  // Vị trí chạm trên thanh đỡ quyết định góc bật (tối đa 60° so với phương thẳng đứng)
  // chạm mép phải thì bật phải, mép trái thì bật sang trái, ở chính giữa thì thẳng đứng
  handlePaddleCollision(previous) {
    const b = this.ball;
    const p = this.paddle;
    if (b.vy <= 0 || previous.y + b.radius > p.y || !this.circleIntersectsRect(b, p)) return;
    b.y = p.y - b.radius - 0.1;
    const offset = this.clamp((b.x - (p.x + p.width / 2)) / (p.width / 2), -1, 1);
    const speed = this.getCurrentLevel().speed;
    b.vx = speed * Math.sin(offset * Math.PI / 3);
    if (Math.abs(b.vx) < 20) b.vx = offset < 0 ? -20 : 20;
    b.vy = -Math.sqrt(speed ** 2 - b.vx ** 2);
  }

  // Dựa vào vị trí cũ của bóng để chọn mặt bật, rồi đẩy bóng ra ngoài gạch
  reflectBall(rect, previous) {
    const b = this.ball;
    if (previous.y + b.radius <= rect.y) {
      b.y = rect.y - b.radius - 0.1; b.vy = -Math.abs(b.vy);
    } else if (previous.y - b.radius >= rect.y + rect.height) {
      b.y = rect.y + rect.height + b.radius + 0.1; b.vy = Math.abs(b.vy);
    } else if (previous.x <= rect.x) {
      b.x = rect.x - b.radius - 0.1; b.vx = -Math.abs(b.vx);
    } else {
      b.x = rect.x + rect.width + b.radius + 0.1; b.vx = Math.abs(b.vx);
    }
  }

  handleBrickCollision(previous) {
    for (const brick of this.bricks) {
      if (brick.hp <= 0 || !this.circleIntersectsRect(this.ball, brick)) continue;
      this.reflectBall(brick, previous);
      this.hitBrick(brick);
      break; // mỗi bước chỉ tính một gạch
    }
  }

  // Phá vỡ gạch: +10 điểm; đánh trúng nhưng gạch còn sống: +2 điểm
  hitBrick(brick) {
    brick.hp--;
    this.score += brick.hp === 0 ? 10 : 2;
  }
  // tính mạng và kq
  loseLife() {
    this.lives--;
    this.direction = 0;
    this.resetBall();
    this.status = this.lives === 0 ? "gameover" : "ready";
  }

  checkLevelCompletion() {
    if (this.getRemainingBrickCount() === 0) this.finishLevel();
  }

  // Qua màn: thưởng 100 điểm và 1 mạng (tối đa 5), rồi chờ lệnh chuyển màn
  finishLevel() {
    this.score += 100;
    this.lives = Math.min(5, this.lives + 1);
    this.direction = 0;
    this.status = "levelClear";
  }

  getState() {
    return {
      status: this.status, level: this.level, levelName: this.getCurrentLevel().name,
      score: this.score, lives: this.lives, time: this.time,
      width: this.width, height: this.height,
      remainingBricks: this.getRemainingBrickCount(),
      hasNextLevel: this.hasNextLevel(),
      paddle: { ...this.paddle }, ball: { ...this.ball },
      bricks: this.bricks.map(brick => ({ ...brick }))
    };
  }
}