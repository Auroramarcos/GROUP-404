/* script.js */

const canvas = document.getElementById("starCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let stars = [];
let score = 0;
let starsCaught = 0;
const scoreEl = document.getElementById("score");
const starsCaughtEl = document.getElementById("starsCaught");

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function Star() {
  this.x = random(0, canvas.width);
  this.y = random(-canvas.height, 0); // start above the top
  this.size = random(12, 20); // bigger stars
  this.speed = random(0.2, 0.7); // slower falling
  this.color = `hsl(${random(180, 300)}, 100%, 75%)`;
}

Star.prototype.update = function () {
  this.y += this.speed;
  if (this.y > canvas.height) {
    this.y = random(-20, 0);
    this.x = random(0, canvas.width);
  }
};

Star.prototype.draw = function () {
  ctx.beginPath();
  ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
  ctx.fillStyle = this.color;
  ctx.fill();
};

function initStars(count) {
  stars = [];
  for (let i = 0; i < count; i++) {
    stars.push(new Star());
  }
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  stars.forEach((star) => {
    star.update();
    star.draw();
  });
  requestAnimationFrame(animate);
}

canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  stars.forEach((star) => {
    const dx = star.x - mouseX;
    const dy = star.y - mouseY;
    if (Math.sqrt(dx * dx + dy * dy) < 50) {
      score++;
      starsCaught++;
      scoreEl.textContent = score;
      starsCaughtEl.textContent = starsCaught;
      star.y = random(-20, 0);
      star.x = random(0, canvas.width);
    }
  });
});

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

initStars(40); // fewer stars, bigger, slower
animate();
