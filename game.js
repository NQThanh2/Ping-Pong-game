var rong = 500;
var cao = 500;
var cacMan = [
  {name: "Khởi động", type: "normal", rows: 4, speed: 250},
  {name: "Gạch có giáp", type: "armored", rows: 4, speed: 250},
  {name: "Gạch di chuyển", type: "moving", rows: 4, speed: 250, moveAmplitude: 15, movePeriod: 4},
  {name: "Gạch không thể phá", type: "maze", rows: 4, speed: 250, moveAmplitude: 15, movePeriod: 4},
  {name: "Cổng dịch chuyển", type: "portal", rows: 4, speed: 250, moveAmplitude: 15, movePeriod: 4}
];
var thanhDo = {x: 0, y: 485, width: 80, height: 10, speed: 350};
var bong = {x: 0, y: 0, radius: 5, vx: 0, vy: 0};
var manHienTai = 1;
var diem = 0;
var soMang = 3;
var trangThai = "ready";
var thoiGian = 0;
var huongDiChuyen = 0;
var danhSachGach = [];
var danhSachCong = [];
var khoaCong = false;

function gioiHan(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function kiemTraVaCham(tron, hop) {
  return tron.x + tron.radius > hop.x &&
    tron.x - tron.radius < hop.x + hop.width &&
    tron.y + tron.radius > hop.y &&
    tron.y - tron.radius < hop.y + hop.height;
}

function layManHienTai() {
  return cacMan[manHienTai - 1];
}

function demGachConLai() {
  var soGach = 0;
  for (var i = 0; i < danhSachGach.length; i++) {
    if (danhSachGach[i].hp > 0 && danhSachGach[i].hp !== Infinity) {
      soGach++;
    }
  }
  return soGach;
}

function coManTiepTheo() {
  return manHienTai < cacMan.length;
}

function choiLai() {
  chonMan(1);
}

function chonMan(levelNumber) {
  diem = 0;
  soMang = 3;
  taiMan(levelNumber);
}

function taiMan(levelNumber) {
  manHienTai = levelNumber;
  trangThai = "ready";
  thoiGian = 0;
  huongDiChuyen = 0;
  danhSachGach = taoGach();
  danhSachCong = taoCongKhongGian();
  thanhDo.x = (rong - thanhDo.width) / 2;
  datLaiBong();
}

function taoGach() {
  var config = layManHienTai();
  var columns = 8;
  var width = 50;
  var height = 10;
  var gap = 10;
  var startX = 15;
  var startY = 45;
  var result = [];
  for (var row = 0; row < config.rows; row++) {
    for (var column = 0; column < columns; column++) {
      var hp = 1;
      if (config.type !== "normal") {
        hp = 1 + (row + column) % 3;
      }
      var x = startX + column * (width + gap);
      result.push({
        row: row,
        x: x,
        baseX: x,
        y: startY + row * (height + gap),
        width: width,
        height: height,
        hp: hp
      });
    }
  }
  if (config.type === "maze" || config.type === "portal") {
    var gachThep = taoGachThep();
    for (var i = 0; i < gachThep.length; i++) {
      result.push(gachThep[i]);
    }
  }
  return result;
}

function taoGachThep() {
  var viTri = [0, 50, 125, 175, 225, 275, 325, 400, 450];
  if (layManHienTai().type === "portal") {
    viTri = [0, 50, 100, 150, 200, 300, 350, 400, 450];
  }
  var result = [];
  for (var i = 0; i < viTri.length; i++) {
    result.push({x: viTri[i], y: 170, width: 50, height: 10, hp: Infinity});
  }
  return result;
}

function taoCongKhongGian() {
  if (layManHienTai().type !== "portal") return [];
  return [
    { id: "A", targetId: "B", x: 320, y: 300, radius: 18 },
    { id: "B", targetId: "A", x: 250, y: 140, radius: 18 }
  ];
}

function datLaiBong() {
  bong.x = thanhDo.x + thanhDo.width / 2;
  bong.y = thanhDo.y - bong.radius - 1;
  bong.vx = 0;
  bong.vy = 0;
  khoaCong = false;
}

function thaBong() {
  var speed = layManHienTai().speed;
  bong.vx = speed * 0.35;
  bong.vy = -speed * 0.9;
  trangThai = "playing";
}

function sangManTiepTheo() {
  if (!coManTiepTheo()) return false;
  taiMan(manHienTai + 1);
  return true;
}

function datHuong(direction) {
  if (direction > 0) {
    huongDiChuyen = 1;
  } else if (direction < 0) {
    huongDiChuyen = -1;
  } else {
    huongDiChuyen = 0;
  }
}

function capNhat(dt) {
  if (trangThai !== "ready" && trangThai !== "playing") return;
  diChuyenThanhDo(dt);
  if (trangThai === "ready") {
    datLaiBong();
    return;
  }
  thoiGian += dt;
  diChuyenGach();
  diChuyenBong(dt);
  xuLyCongKhongGian();
  xuLyVaChamTuong();
  if (bong.y - bong.radius > cao) {
    matMang();
    return;
  }
  xuLyVaChamThanhDo();
  xuLyVaChamGach();
  kiemTraHoanThanhMan();
}

function diChuyenThanhDo(dt) {
  thanhDo.x = gioiHan(thanhDo.x + huongDiChuyen * thanhDo.speed * dt,
    0, rong - thanhDo.width);
}

function diChuyenBong(dt) {
  bong.x += bong.vx * dt;
  bong.y += bong.vy * dt;
}

function xuLyCongKhongGian() {
  var b = bong;
  var portal = null;
  for (var i = 0; i < danhSachCong.length; i++) {
    var p = danhSachCong[i];
    var dx = b.x - p.x;
    var dy = b.y - p.y;
    var distance = Math.sqrt(dx * dx + dy * dy);
    if (distance <= p.radius + b.radius) {
      portal = p;
      break;
    }
  }
  if (khoaCong) {
    if (!portal) khoaCong = false;
    return;
  }
  if (!portal) return;
  for (var i = 0; i < danhSachCong.length; i++) {
    var destination = danhSachCong[i];
    if (destination.id === portal.targetId) {
      b.x = destination.x;
      b.y = destination.y;
      khoaCong = true;
      break;
    }
  }
}

function diChuyenGach() {
  var config = layManHienTai();
  if (config.type !== "moving" && config.type !== "maze" && config.type !== "portal") {
    return;
  }
  var offset = config.moveAmplitude * Math.sin(2 * Math.PI * thoiGian / config.movePeriod);
  for (var i = 0; i < danhSachGach.length; i++) {
    var brick = danhSachGach[i];
    if (brick.hp === Infinity) {
      continue;
    }
    if (brick.row % 2 === 0) {
      brick.x = brick.baseX + offset;
    } else {
      brick.x = brick.baseX - offset;
    }
  }
}

function xuLyVaChamTuong() {
  var b = bong;
  if (b.x < b.radius) {
    b.x = b.radius; b.vx = Math.abs(b.vx);
  }
  if (b.x > rong - b.radius) {
    b.x = rong - b.radius; b.vx = -Math.abs(b.vx);
   }
  if (b.y < b.radius) {
    b.y = b.radius; b.vy = Math.abs(b.vy);
  }
}

function xuLyVaChamThanhDo() {
  var b = bong;
  var p = thanhDo;
  if (b.vy <= 0 || !kiemTraVaCham(b, p)) return;
  b.y = p.y - b.radius;
  var speed = layManHienTai().speed;
  if (b.x < p.x + p.width / 3) {
    b.vx = -speed * 0.6;
  } else if (b.x > p.x + p.width * 2 / 3) {
    b.vx = speed * 0.6;
  } else {
    b.vx = 0;
  }
  b.vy = -speed * 0.9;
}

function phanXaBong(rect) {
  var b = bong;
  var overlapX = Math.min(b.x + b.radius - rect.x, rect.x + rect.width - b.x + b.radius);
  var overlapY = Math.min(b.y + b.radius - rect.y, rect.y + rect.height - b.y + b.radius);
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

function xuLyVaChamGach() {
  for (var i = 0; i < danhSachGach.length; i++) {
    var brick = danhSachGach[i];
    if (brick.hp <= 0 || !kiemTraVaCham(bong, brick)) {
      continue;
    }
    phanXaBong(brick);
    danhTrungGach(brick);
    break;
  }
}

function danhTrungGach(brick) {
  if (brick.hp === Infinity) return;
  brick.hp--;
  diem += brick.hp === 0 ? 10 : 2;
}

function matMang() {
  soMang--;
  huongDiChuyen = 0;
  datLaiBong();
  trangThai = soMang === 0 ? "gameover" : "ready";
}

function kiemTraHoanThanhMan() {
  if (demGachConLai() === 0) hoanThanhMan();
}

function hoanThanhMan() {
  diem += 100;
  soMang = Math.min(5, soMang + 1);
  huongDiChuyen = 0;
  trangThai = "levelClear";
}

var scoreEl = document.querySelector(".score");
var livesEl = document.querySelector(".lives");
var messageEl = document.querySelector(".message");
var ballEl = document.querySelector(".ball");
var paddleEl = document.querySelector(".paddle");
var brickContainerEl = document.querySelector(".brick-container");
var portalContainerEl = document.querySelector(".portal-container");
var levelSelectorEl = document.querySelector(".level-selector");
var brickEls = [];
var manDangHienThi = 0;
var nutChonManEls = [];
var keys = { left: false, right: false };

function dongBoHuong() {
  datHuong((keys.right ? 1 : 0) - (keys.left ? 1 : 0));
}

function chonManTuNut(event) {
  keys.left = keys.right = false;
  chonMan(Number(event.currentTarget.dataset.level));
  hienThi();
  event.currentTarget.blur();
}

function taoNutChonMan() {
  levelSelectorEl.innerHTML = "";
  nutChonManEls = [];
  for (var i = 0; i < cacMan.length; i++) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "level-button";
    button.dataset.level = i + 1;
    button.textContent = "Màn " + (i + 1) + ": " + cacMan[i].name;
    button.addEventListener("click", chonManTuNut);
    nutChonManEls.push(button);
    levelSelectorEl.appendChild(button);
  }
}

function taoGiaoDienGach(bricks) {
  brickContainerEl.innerHTML = "";
  brickEls = [];
  for (var i = 0; i < bricks.length; i++) {
    var brick = bricks[i];
    var element = document.createElement("div");
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
  for (var i = 0; i < portals.length; i++) {
    var portal = portals[i];
    var element = document.createElement("div");
    element.className = "portal";
    element.dataset.portal = portal.id;
    element.style.left = (portal.x - portal.radius) + "px";
    element.style.top = (portal.y - portal.radius) + "px";
    element.style.width = element.style.height = (portal.radius * 2) + "px";
    portalContainerEl.appendChild(element);
  }
}

function layThongBao() {
  switch (trangThai) {
    case "ready":
      return "Màn " + manHienTai + ": " + layManHienTai().name + "<br><small>Nhấn Space để thả bóng</small>";
    case "levelClear":
      return "Hoàn thành màn " + manHienTai + "! +100 điểm<br><small>Nhấn " +
        (coManTiepTheo() ? "Space để sang màn tiếp theo" : "R để chơi lại") + "</small>";
    case "gameover":
      return "Game Over<br><small>Nhấn R để chơi lại</small>";
    default:
      return "";
  }
}

function hienThi() {
  if (manDangHienThi !== manHienTai) {
    taoGiaoDienGach(danhSachGach);
    taoGiaoDienCong(danhSachCong);
    manDangHienThi = manHienTai;
  }
  scoreEl.textContent = diem;
  livesEl.textContent = "♥ " + soMang;
  for (var i = 0; i < nutChonManEls.length; i++) {
    var button = nutChonManEls[i];
    button.className = Number(button.dataset.level) === manHienTai ? "level-button active" : "level-button";
  }

  paddleEl.style.left = thanhDo.x + "px";
  paddleEl.style.width = thanhDo.width + "px";
  ballEl.style.left = (bong.x - bong.radius) + "px";
  ballEl.style.top = (bong.y - bong.radius) + "px";

  for (var j = 0; j < danhSachGach.length; j++) {
    var brick = danhSachGach[j];
    var element = brickEls[j];
    element.style.left = brick.x + "px";
    element.style.top = brick.y + "px";
    element.style.visibility = brick.hp > 0 ? "visible" : "hidden";
    element.dataset.hp = brick.hp;
    element.dataset.steel = String(brick.hp === Infinity);
  }

  var message = layThongBao();
  messageEl.innerHTML = message;
  messageEl.style.display = message ? "block" : "none";
}

function xuLyHanhDongChinh() {
  if (trangThai === "ready") {
    thaBong();
  } else if (trangThai === "levelClear") {
    if (!sangManTiepTheo()) choiLai();
  } else if (trangThai === "gameover") {
    choiLai();
  }
}

function xuLyNhanPhim(event) {
  if (event.target.tagName === "BUTTON" && (event.key === " " || event.key === "Enter")) return;
  switch (event.key) {
    case "ArrowLeft": case "a": case "A":
      keys.left = true;
      dongBoHuong();
      event.preventDefault();
      break;
    case "ArrowRight": case "d": case "D":
      keys.right = true;
      dongBoHuong();
      event.preventDefault();
      break;
    case " ":
      xuLyHanhDongChinh();
      event.preventDefault();
      break;
    case "r": case "R":
      choiLai();
      dongBoHuong();
      break;
  }
}

function xuLyThaPhim(event) {
  if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") keys.left = false;
  if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") keys.right = false;
  dongBoHuong();
}

document.addEventListener("keydown", xuLyNhanPhim);
document.addEventListener("keyup", xuLyThaPhim);

function khungHinh() {
  capNhat(0.016);
  hienThi();
}

choiLai();
taoNutChonMan();
hienThi();
setInterval(khungHinh, 16);