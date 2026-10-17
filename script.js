"use strict";

const game = new BrickBreakerGame();

const scoreEl = document.querySelector(".score");
const livesEl = document.querySelector(".lives");
const messageEl = document.querySelector(".message");
const ballEl = document.querySelector(".ball");
const paddleEl = document.querySelector(".paddle");
const brickEls = Array.from(document.querySelectorAll(".brick")); // thứ tự = id gạch (hàng trước, cột sau)

const keys = { left: false, right: false };

function syncDirection() {
  game.setDirection((keys.right ? 1 : 0) - (keys.left ? 1 : 0));
}

function getMessage(state) {
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

function render() {
  const s = game.getState();
  scoreEl.textContent = s.score;
  livesEl.textContent = "♥ " + s.lives;

  paddleEl.style.left = s.paddle.x + "px";
  ballEl.style.left = (s.ball.x - s.ball.radius) + "px";
  ballEl.style.top = (s.ball.y - s.ball.radius) + "px";

  s.bricks.forEach((brick, i) => {
    brickEls[i].style.visibility = brick.hp > 0 ? "visible" : "hidden";
  });

  const message = getMessage(s);
  messageEl.innerHTML = message;
  messageEl.style.display = message ? "block" : "none";
}

function primaryAction() {
  if (game.status === "ready") game.launchBall();
  else if (game.status === "levelClear") {
    if (!game.nextLevel()) game.restart();
  } else if (game.status === "gameover") game.restart();
}

document.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowLeft": case "a": case "A":
      keys.left = true; syncDirection(); e.preventDefault(); break;
    case "ArrowRight": case "d": case "D":
      keys.right = true; syncDirection(); e.preventDefault(); break;
    case " ":
      primaryAction(); e.preventDefault(); break;
    case "p": case "P": case "Escape":
      if (game.status === "playing") game.pause();
      else if (game.status === "paused") { game.resume(); syncDirection(); }
      break;
    case "r": case "R":
      game.restart(); syncDirection(); break;
  }
});

document.addEventListener("keyup", (e) => {
  if (["ArrowLeft", "a", "A"].includes(e.key)) keys.left = false;
  if (["ArrowRight", "d", "D"].includes(e.key)) keys.right = false;
  syncDirection();
});

// Mất focus cửa sổ thì tự tạm dừng.
window.addEventListener("blur", () => {
  keys.left = keys.right = false;
  syncDirection();
  game.pause();
});

let lastTime = null;
function frame(now) {
  if (lastTime !== null) game.update((now - lastTime) / 1000);
  lastTime = now;
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
