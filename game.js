"use strict";

class BrickBreakerGame {
  constructor() {
    this.width = 500;
    this.height = 500;
    this.levels = [
      { name: "Khởi động", type: "normal", rows: 4, speed: 250 },
      { name: "Gạch có giáp", type: "armored", rows: 4, speed: 250 },
      { name: "Gạch di chuyển", type: "moving", rows: 4, speed: 250, moveAmplitude: 15, movePeriod: 4 },
      { name: "Gạch không thể phá", type: "maze", rows: 4, speed: 250, moveAmplitude: 15, movePeriod: 4 },
      { name: "Cổng dịch chuyển", type: "portal", rows: 4, speed: 250, moveAmplitude: 15, movePeriod: 4 }
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
    return (circle.x - x) ** 2 + (circle.y - y) ** 2 < circle.radius ** 2;
  }

  layManHienTai() {
    return this.levels[this.level - 1];
  }

  demGachConLai() {
    return this.bricks.filter(brick => brick.hp > 0 && brick.hp !== Infinity).length;
  }

  coManTiepTheo() {
    return this.level < this.levels.length;
  }

  choiLai() {
    this.chonMan(1);
  }

  chonMan(levelNumber) {
    this.score = 0;
    this.lives = 3;
    this.taiMan(levelNumber);
  }

  taiMan(levelNumber) {
    this.level = levelNumber;
    this.status = "ready";
    this.time = 0;
    this.direction = 0;
    this.bricks = this.taoGach();
    this.portals = this.taoCongKhongGian();
    this.paddle.x = (this.width - this.paddle.width) / 2;
    this.datLaiBong();
  }

  taoGach() {
    const config = this.layManHienTai();
    const columns = 8, width = 50, height = 10, gap = 10;
    const startX = 15, startY = 45;
    const result = [];
    for (let row = 0; row < config.rows; row++) {
      for (let column = 0; column < columns; column++) {
        const hp = config.type === "normal" ? 1 : 1 + (row + column) % 3;
        const x = startX + column * (width + gap);
        result.push({
          row,
          x, baseX: x,
          y: startY + row * (height + gap),
          width, height, hp
        });
      }
    }
    if (["maze", "portal"].includes(config.type)) result.push(...this.taoGachThep());
    return result;
  }

  taoGachThep() {
    return [0, 50, 125, 175, 225, 275, 325, 400, 450].map(x => ({
      x, y: 170, width: 50, height: 10, hp: Infinity
    }));
  }

  taoCongKhongGian() {
    if (this.layManHienTai().type !== "portal") return [];
    return [
      { id: "A", targetId: "B", x: 320, y: 300, radius: 18 },
      { id: "B", targetId: "A", x: 250, y: 140, radius: 18 }
    ];
  }

  datLaiBong() {
    this.ball.x = this.paddle.x + this.paddle.width / 2;
    this.ball.y = this.paddle.y - this.ball.radius - 1;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.portalLocked = false;
  }

  thaBong() {
    const speed = this.layManHienTai().speed;
    this.ball.vx = speed * 0.35;
    this.ball.vy = -Math.sqrt(speed ** 2 - this.ball.vx ** 2);
    this.status = "playing";
  }

  sangManTiepTheo() {
    if (!this.coManTiepTheo()) return false;
    this.taiMan(this.level + 1);
    return true;
  }

  datHuong(direction) {
    this.direction = Math.sign(direction);
  }

  capNhat(dt) {
    if (!["ready", "playing"].includes(this.status)) return;
    this.diChuyenThanhDo(dt);
    if (this.status === "ready") { this.datLaiBong(); return; }
    this.time += dt;
    this.diChuyenGach();
    this.diChuyenBong(dt);
    this.xuLyCongKhongGian();
    this.xuLyVaChamTuong();
    if (this.ball.y - this.ball.radius > this.height) { this.matMang(); return; }
    this.xuLyVaChamThanhDo();
    this.xuLyVaChamGach();
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

  xuLyCongKhongGian() {
    const b = this.ball;
    let portal = null;
    for (let i = 0; i < this.portals.length; i++) {
      const p = this.portals[i];
      const dx = b.x - p.x;
      const dy = b.y - p.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= p.radius + b.radius) {
        portal = p;
        break;
      }
    }
    if (this.portalLocked) {
      if (!portal) this.portalLocked = false;
      return;
    }
    if (!portal) return;
    for (let i = 0; i < this.portals.length; i++) {
      const destination = this.portals[i];
      if (destination.id === portal.targetId) {
        b.x = destination.x;
        b.y = destination.y;
        this.portalLocked = true;
        break;
      }
    }
  }

  diChuyenGach() {
    const config = this.layManHienTai();
    if (!["moving", "maze", "portal"].includes(config.type)) return;
    const offset = config.moveAmplitude * Math.sin(2 * Math.PI * this.time / config.movePeriod);
    for (const brick of this.bricks) {
      if (brick.hp === Infinity) continue;
      brick.x = brick.baseX + (brick.row % 2 === 0 ? offset : -offset);
    }
  }

  xuLyVaChamTuong() {
    const b = this.ball;
    if (b.x < b.radius) { b.x = b.radius; b.vx = Math.abs(b.vx); }
    if (b.x > this.width - b.radius) { b.x = this.width - b.radius; b.vx = -Math.abs(b.vx); }
    if (b.y < b.radius) { b.y = b.radius; b.vy = Math.abs(b.vy); }
  }

  xuLyVaChamThanhDo() {
    const b = this.ball;
    const p = this.paddle;
    if (b.vy <= 0 || !this.kiemTraVaChamTronChuNhat(b, p)) return;
    b.y = p.y - b.radius;
    const offset = this.gioiHan((b.x - (p.x + p.width / 2)) / (p.width / 2), -1, 1);
    const speed = this.layManHienTai().speed;
    b.vx = speed * Math.sin(offset * Math.PI / 3);
    b.vy = -Math.sqrt(speed ** 2 - b.vx ** 2);
  }

  phanXaBong(rect) {
    const b = this.ball;
    const overlapX = Math.min(b.x + b.radius - rect.x, rect.x + rect.width - b.x + b.radius);
    const overlapY = Math.min(b.y + b.radius - rect.y, rect.y + rect.height - b.y + b.radius);
    if (overlapX < overlapY) {
      if (b.x < rect.x + rect.width / 2) {
        b.x = rect.x - b.radius;
        b.vx = -Math.abs(b.vx);
      } else {
        b.x = rect.x + rect.width + b.radius;
        b.vx = Math.abs(b.vx);
      }
    } else {
      if (b.y < rect.y + rect.height / 2) {
        b.y = rect.y - b.radius;
        b.vy = -Math.abs(b.vy);
      } else {
        b.y = rect.y + rect.height + b.radius;
        b.vy = Math.abs(b.vy);
      }
    }
  }

  xuLyVaChamGach() {
    for (const brick of this.bricks) {
      if (brick.hp <= 0 || !this.kiemTraVaChamTronChuNhat(this.ball, brick)) continue;
      this.phanXaBong(brick);
      this.danhTrungGach(brick);
      break;
    }
  }

  danhTrungGach(brick) {
    if (brick.hp === Infinity) return;
    brick.hp--;
    this.score += brick.hp === 0 ? 10 : 2;
  }

  matMang() {
    this.lives--;
    this.direction = 0;
    this.datLaiBong();
    this.status = this.lives === 0 ? "gameover" : "ready";
  }

  kiemTraHoanThanhMan() {
    if (this.demGachConLai() === 0) this.hoanThanhMan();
  }

  hoanThanhMan() {
    this.score += 100;
    this.lives = Math.min(5, this.lives + 1);
    this.direction = 0;
    this.status = "levelClear";
  }

}

const game = new BrickBreakerGame();

const scoreEl = document.querySelector(".score");
const livesEl = document.querySelector(".lives");
const messageEl = document.querySelector(".message");
const ballEl = document.querySelector(".ball");
const paddleEl = document.querySelector(".paddle");
const brickContainerEl = document.querySelector(".brick-container");
const portalContainerEl = document.querySelector(".portal-container");
const levelSelectorEl = document.querySelector(".level-selector");
let brickEls = [];
let manDangHienThi = 0;
let nutChonManEls = [];

const keys = { left: false, right: false };

function dongBoHuong() {
  game.datHuong((keys.right ? 1 : 0) - (keys.left ? 1 : 0));
}

function taoNutChonMan() {
  levelSelectorEl.innerHTML = "";
  nutChonManEls = [];
  for (let i = 0; i < game.levels.length; i++) {
    const level = game.levels[i];
    const levelNumber = i + 1;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "level-button";
    button.dataset.level = levelNumber;
    button.textContent = `Màn ${levelNumber}: ${level.name}`;
    button.addEventListener("click", () => {
      keys.left = keys.right = false;
      game.chonMan(levelNumber);
      hienThi();
      button.blur();
    });
    nutChonManEls.push(button);
    levelSelectorEl.appendChild(button);
  }
}

function taoGiaoDienGach(bricks) {
  brickContainerEl.innerHTML = "";
  brickEls = [];
  for (let i = 0; i < bricks.length; i++) {
    const brick = bricks[i];
    const element = document.createElement("div");
    element.className = "brick";
    element.style.left = brick.x + "px";
    element.style.top = brick.y + "px";
    element.style.width = brick.width + "px";
    element.style.height = brick.height + "px";
    brickEls.push(element);
    brickContainerEl.appendChild(element);
  }
}

function taoGiaoDienCong(portals) {
  portalContainerEl.innerHTML = "";
  for (let i = 0; i < portals.length; i++) {
    const portal = portals[i];
    const element = document.createElement("div");
    element.className = "portal";
    element.dataset.portal = portal.id;
    element.style.left = (portal.x - portal.radius) + "px";
    element.style.top = (portal.y - portal.radius) + "px";
    element.style.width = element.style.height = (portal.radius * 2) + "px";
    portalContainerEl.appendChild(element);
  }
}

function layThongBao() {
  switch (game.status) {
    case "ready":
      return `Màn ${game.level}: ${game.layManHienTai().name}<br><small>Nhấn Space để thả bóng</small>`;
    case "levelClear":
      return `Hoàn thành màn ${game.level}! +100 điểm<br><small>Nhấn ${game.coManTiepTheo() ? "Space để sang màn tiếp theo" : "R để chơi lại"}</small>`;
    case "gameover":
      return "Game Over<br><small>Nhấn R để chơi lại</small>";
    default:
      return "";
  }
}

function hienThi() {
  if (manDangHienThi !== game.level) {
    taoGiaoDienGach(game.bricks);
    taoGiaoDienCong(game.portals);
    manDangHienThi = game.level;
  }
  scoreEl.textContent = game.score;
  livesEl.textContent = "♥ " + game.lives;
  nutChonManEls.forEach(button => {
    button.classList.toggle("active", Number(button.dataset.level) === game.level);
  });

  paddleEl.style.left = game.paddle.x + "px";
  paddleEl.style.width = game.paddle.width + "px";
  ballEl.style.left = (game.ball.x - game.ball.radius) + "px";
  ballEl.style.top = (game.ball.y - game.ball.radius) + "px";

  game.bricks.forEach((brick, i) => {
    const element = brickEls[i];
    element.style.left = brick.x + "px";
    element.style.top = brick.y + "px";
    element.style.visibility = brick.hp > 0 ? "visible" : "hidden";
    element.dataset.hp = brick.hp;
    element.dataset.steel = String(brick.hp === Infinity);
  });

  const message = layThongBao();
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
  if (e.target instanceof HTMLButtonElement && [" ", "Enter"].includes(e.key)) return;
  switch (e.key) {
    case "ArrowLeft": case "a": case "A":
      keys.left = true; dongBoHuong(); e.preventDefault(); break;
    case "ArrowRight": case "d": case "D":
      keys.right = true; dongBoHuong(); e.preventDefault(); break;
    case " ":
      xuLyHanhDongChinh(); e.preventDefault(); break;
    case "r": case "R":
      game.choiLai(); dongBoHuong(); break;
  }
});

document.addEventListener("keyup", (e) => {
  if (["ArrowLeft", "a", "A"].includes(e.key)) keys.left = false;
  if (["ArrowRight", "d", "D"].includes(e.key)) keys.right = false;
  dongBoHuong();
});

let lastTime = performance.now();
function khungHinh(now) {
  const dt = Math.min((now - lastTime) / 1000, 1 / 30);
  game.capNhat(dt);
  lastTime = now;
  hienThi();
  requestAnimationFrame(khungHinh);
}
taoNutChonMan();
hienThi();
requestAnimationFrame(khungHinh);