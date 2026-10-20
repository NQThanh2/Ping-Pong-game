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
    this.choiLai();
  }

  gioiHan(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  kiemTraVaChamTronChuNhat(circle, rect) {
    const x = this.gioiHan(circle.x, rect.x, rect.x + rect.width);
    const y = this.gioiHan(circle.y, rect.y, rect.y + rect.height);
    return (circle.x - x) ** 2 + (circle.y - y) ** 2 <= circle.radius ** 2;
  }

  layManHienTai() {
    return { ...this.levels[this.level - 1] };
  }

  demGachConLai() {
    return this.bricks.filter(brick => brick.hp > 0).length;
  }

  coManTiepTheo() {
    return this.level < this.levels.length;
  }

  choiLai() {
    this.score = 0;
    this.lives = 3;
    this.taiMan(1);
  }

  taiMan(levelNumber) {
    this.level = levelNumber;
    this.status = "ready";
    this.time = 0;
    this.accumulator = 0;
    this.direction = 0;
    this.bricks = this.taoGach();
    this.paddle.x = (this.width - this.paddle.width) / 2; // 210
    this.datLaiBong();
  }

  // 8 cột × 3 hàng, gạch 50 × 10, khoảng cách 10px, lề trái 15px, lề trên 45px
  taoGach() {
    const config = this.layManHienTai();
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

  datLaiBong() {
    this.ball.x = this.paddle.x + this.paddle.width / 2;
    this.ball.y = this.paddle.y - this.ball.radius - 1;
    this.ball.vx = 0;
    this.ball.vy = 0;
  }

  thaBong() {
    const speed = this.layManHienTai().speed;
    this.ball.vx = speed * 0.35;
    this.ball.vy = -Math.sqrt(speed ** 2 - this.ball.vx ** 2);
    this.status = "playing";
    this.accumulator = 0;
  }

  sangManTiepTheo() {
    if (!this.coManTiepTheo()) return false;
    this.taiMan(this.level + 1);
    return true;
  }

  datHuong(direction) {
    this.direction = Math.sign(direction); // -1: trái; 0: dừng; 1: phải
  }

  tamDung() {
    if (this.status !== "playing") return;
    this.status = "paused";
    this.direction = 0;
    this.accumulator = 0;
  }

  tiepTuc() {
    this.status = "playing";
  }

  capNhat(deltaSeconds) {
    if (!["ready", "playing"].includes(this.status)) return;
    this.accumulator += Math.min(deltaSeconds, 0.25);
    while (this.accumulator + 1e-12 >= this.step) {
      this.accumulator = Math.max(0, this.accumulator - this.step);
      this.capNhatBuoc(this.step);
      if (!["ready", "playing"].includes(this.status)) { this.accumulator = 0; break; }
    }
  }

  capNhatBuoc(dt) {
    this.diChuyenThanhDo(dt);
    if (this.status === "ready") { this.datLaiBong(); return; }
    this.time += dt;
    const previous = { x: this.ball.x, y: this.ball.y };
    this.diChuyenBong(dt);
    this.xuLyVaChamTuong();
    if (this.ball.y - this.ball.radius > this.height) { this.matMang(); return; }
    this.xuLyVaChamThanhDo(previous);
    this.xuLyVaChamGach(previous);
    this.kiemTraHoanThanhMan();
  }

  diChuyenThanhDo(dt) {
    this.paddle.x = this.gioiHan(this.paddle.x + this.direction * this.paddle.speed * dt,
      0, this.width - this.paddle.width);
  }

  diChuyenBong(dt) {
    this.ball.x += this.ball.vx * dt;
    this.ball.y += this.ball.vy * dt;
  }

  // ===== Va chạm =====
  xuLyVaChamTuong() {
    const b = this.ball;
    if (b.x < b.radius) { b.x = b.radius; b.vx = Math.abs(b.vx); }
    if (b.x > this.width - b.radius) { b.x = this.width - b.radius; b.vx = -Math.abs(b.vx); }
    if (b.y < b.radius) { b.y = b.radius; b.vy = Math.abs(b.vy); }
  }

  // Vị trí chạm trên thanh đỡ quyết định góc bật (tối đa 60° so với phương thẳng đứng)
  // chạm mép phải thì bật phải, mép trái thì bật sang trái, ở chính giữa thì thẳng đứng
  xuLyVaChamThanhDo(previous) {
    const b = this.ball;
    const p = this.paddle;
    if (b.vy <= 0 || previous.y + b.radius > p.y || !this.kiemTraVaChamTronChuNhat(b, p)) return;
    b.y = p.y - b.radius - 0.1;
    const offset = this.gioiHan((b.x - (p.x + p.width / 2)) / (p.width / 2), -1, 1);
    const speed = this.layManHienTai().speed;
    b.vx = speed * Math.sin(offset * Math.PI / 3);
    if (Math.abs(b.vx) < 20) b.vx = offset < 0 ? -20 : 20;
    b.vy = -Math.sqrt(speed ** 2 - b.vx ** 2);
  }

  // Dựa vào vị trí cũ của bóng để chọn mặt bật, rồi đẩy bóng ra ngoài gạch
  phanXaBong(rect, previous) {
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

  xuLyVaChamGach(previous) {
    for (const brick of this.bricks) {
      if (brick.hp <= 0 || !this.kiemTraVaChamTronChuNhat(this.ball, brick)) continue;
      this.phanXaBong(brick, previous);
      this.danhTrungGach(brick);
      break; // mỗi bước chỉ tính một gạch
    }
  }

  // Phá vỡ gạch: +10 điểm; đánh trúng nhưng gạch còn sống: +2 điểm
  danhTrungGach(brick) {
    brick.hp--;
    this.score += brick.hp === 0 ? 10 : 2;
  }
  // tính mạng và kq
  matMang() {
    this.lives--;
    this.direction = 0;
    this.datLaiBong();
    this.status = this.lives === 0 ? "gameover" : "ready";
  }

  kiemTraHoanThanhMan() {
    if (this.demGachConLai() === 0) this.hoanThanhMan();
  }

  // Qua màn: thưởng 100 điểm và 1 mạng (tối đa 5), rồi chờ lệnh chuyển màn
  hoanThanhMan() {
    this.score += 100;
    this.lives = Math.min(5, this.lives + 1);
    this.direction = 0;
    this.status = "levelClear";
  }

  layTrangThai() {
    return {
      status: this.status, level: this.level, levelName: this.layManHienTai().name,
      score: this.score, lives: this.lives, time: this.time,
      width: this.width, height: this.height,
      remainingBricks: this.demGachConLai(),
      hasNextLevel: this.coManTiepTheo(),
      paddle: { ...this.paddle }, ball: { ...this.ball },
      bricks: this.bricks.map(brick => ({ ...brick }))
    };
  }
}

const game = new BrickBreakerGame();

const scoreEl = document.querySelector(".score");
const livesEl = document.querySelector(".lives");
const messageEl = document.querySelector(".message");
const ballEl = document.querySelector(".ball");
const paddleEl = document.querySelector(".paddle");
const brickEls = Array.from(document.querySelectorAll(".brick")); // thứ tự = id gạch (hàng trước, cột sau)

const keys = { left: false, right: false };

function dongBoHuong() {
  game.datHuong((keys.right ? 1 : 0) - (keys.left ? 1 : 0));
}

function layThongBao(state) {
  switch (state.status) {
    case "ready":
      return `Màn ${state.level}: ${state.levelName}<br><small>Nhấn Space để thả bóng</small>`;
    case "paused":
      return "Tạm dừng<br><small>Nhấn P để tiếp tục</small>";
    case "levelClear":
      return `Hoàn thành màn ${state.level}! +100 điểm<br><small>Nhấn ${state.hasNextLevel ? "Space để sang màn tiếp theo" : "R để chơi lại"}</small>`;
    case "gameover":
      return "Game Over<br><small>Nhấn R để chơi lại</small>";
    default:
      return "";
  }
}

function hienThi() {
  const s = game.layTrangThai();
  scoreEl.textContent = s.score;
  livesEl.textContent = "♥ " + s.lives;

  paddleEl.style.left = s.paddle.x + "px";
  ballEl.style.left = (s.ball.x - s.ball.radius) + "px";
  ballEl.style.top = (s.ball.y - s.ball.radius) + "px";

  s.bricks.forEach((brick, i) => {
    brickEls[i].style.visibility = brick.hp > 0 ? "visible" : "hidden";
  });

  const message = layThongBao(s);
  messageEl.innerHTML = message;
  messageEl.style.display = message ? "block" : "none";
}

function xuLyHanhDongChinh() {
  if (game.status === "ready") game.thaBong();
  else if (game.status === "levelClear") {
    if (!game.sangManTiepTheo()) game.choiLai();
  } else if (game.status === "gameover") game.choiLai();
}

document.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowLeft": case "a": case "A":
      keys.left = true; dongBoHuong(); e.preventDefault(); break;
    case "ArrowRight": case "d": case "D":
      keys.right = true; dongBoHuong(); e.preventDefault(); break;
    case " ":
      xuLyHanhDongChinh(); e.preventDefault(); break;
    case "p": case "P": case "Escape":
      if (game.status === "playing") game.tamDung();
      else if (game.status === "paused") { game.tiepTuc(); dongBoHuong(); }
      break;
    case "r": case "R":
      game.choiLai(); dongBoHuong(); break;
  }
});

document.addEventListener("keyup", (e) => {
  if (["ArrowLeft", "a", "A"].includes(e.key)) keys.left = false;
  if (["ArrowRight", "d", "D"].includes(e.key)) keys.right = false;
  dongBoHuong();
});

// Mất focus cửa sổ thì tự tạm dừng.
window.addEventListener("blur", () => {
  keys.left = keys.right = false;
  dongBoHuong();
  game.tamDung();
});

let lastTime = null;
function khungHinh(now) {
  if (lastTime !== null) game.capNhat((now - lastTime) / 1000);
  lastTime = now;
  hienThi();
  requestAnimationFrame(khungHinh);
}
requestAnimationFrame(khungHinh);
