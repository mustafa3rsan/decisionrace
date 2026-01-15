const canvas = document.getElementById('raceCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const resultDiv = document.getElementById('result');
const winnerName = document.getElementById('winnerName');
const option1Input = document.getElementById('option1');
const option2Input = document.getElementById('option2');

// Canvas setup
function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
}
resizeCanvas();
window.addEventListener('resize', () => {
    resizeCanvas();
    if (!isRacing) initialDraw();
});

// Physics constants
const GRAVITY = 0.35;
const BOUNCE = 0.65;
const FRICTION = 0.98;

// Game state
let balls = [];
let pegs = [];
let isRacing = false;
let winner = null;
let animationId = null;

// Ball class
class Ball {
    constructor(x, y, label, isBlack) {
        this.x = x;
        this.y = y;
        this.radius = 12;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = 0;
        this.label = label;
        this.isBlack = isBlack;
    }

    update(laneLeft, laneRight) {
        // Gravity
        this.vy += GRAVITY;

        // Friction
        this.vx *= FRICTION;

        // Update position
        this.x += this.vx;
        this.y += this.vy;

        // Lane boundaries
        if (this.x - this.radius < laneLeft) {
            this.x = laneLeft + this.radius;
            this.vx = Math.abs(this.vx) * BOUNCE;
        }
        if (this.x + this.radius > laneRight) {
            this.x = laneRight - this.radius;
            this.vx = -Math.abs(this.vx) * BOUNCE;
        }
    }

    draw() {
        // Ball
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.isBlack ? '#000' : '#fff';
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    collideWithPeg(peg) {
        const dx = this.x - peg.x;
        const dy = this.y - peg.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = this.radius + peg.radius;

        if (dist < minDist) {
            // Collision normal
            const nx = dx / dist;
            const ny = dy / dist;

            // Separate balls
            const overlap = minDist - dist;
            this.x += nx * overlap;
            this.y += ny * overlap;

            // Reflect velocity
            const dotProduct = this.vx * nx + this.vy * ny;
            this.vx = (this.vx - 2 * dotProduct * nx) * BOUNCE;
            this.vy = (this.vy - 2 * dotProduct * ny) * BOUNCE;

            // Add randomness
            this.vx += (Math.random() - 0.5) * 1.5;

            return true;
        }
        return false;
    }
}

// Peg class
class Peg {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 6;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
    }
}

// Create pegs in a Plinko-style pattern
function createPegs(laneLeft, laneRight, startY, endY) {
    const pegs = [];
    const rows = 8;
    const rowSpacing = (endY - startY) / rows;
    const laneWidth = laneRight - laneLeft;

    for (let row = 0; row < rows; row++) {
        const y = startY + row * rowSpacing;
        const cols = row % 2 === 0 ? 3 : 2;
        const offset = row % 2 === 0 ? 0 : laneWidth / 6;

        for (let col = 0; col < cols; col++) {
            const x = laneLeft + offset + (col + 0.5) * (laneWidth / cols);
            pegs.push(new Peg(x, y));
        }
    }

    return pegs;
}

// Start race
function startRace() {
    const name1 = option1Input.value.trim() || 'Option A';
    const name2 = option2Input.value.trim() || 'Option B';

    const w = canvas.width / 2;
    const h = canvas.height / 2;
    const laneWidth = (w - 40) / 2;
    const lane1Left = 15;
    const lane1Right = lane1Left + laneWidth;
    const lane2Left = w / 2 + 5;
    const lane2Right = lane2Left + laneWidth;

    // Create balls
    balls = [
        new Ball(lane1Left + laneWidth / 2, 35, name1, true),
        new Ball(lane2Left + laneWidth / 2, 35, name2, false)
    ];

    // Create pegs
    pegs = [
        ...createPegs(lane1Left, lane1Right, 70, h - 80),
        ...createPegs(lane2Left, lane2Right, 70, h - 80)
    ];

    // Reset state
    isRacing = true;
    winner = null;
    resultDiv.classList.add('hidden');
    startBtn.disabled = true;
    startBtn.textContent = 'RACING...';

    if (animationId) cancelAnimationFrame(animationId);
    gameLoop();
}

// Draw
function draw() {
    const w = canvas.width / 2;
    const h = canvas.height / 2;
    const laneWidth = (w - 40) / 2;
    const lane1Left = 15;
    const lane1Right = lane1Left + laneWidth;
    const lane2Left = w / 2 + 5;
    const lane2Right = lane2Left + laneWidth;
    const finishY = h - 50;

    // Background
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, w, h);

    // Lanes
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;

    // Lane 1
    ctx.beginPath();
    ctx.moveTo(lane1Left, 0);
    ctx.lineTo(lane1Left, h);
    ctx.moveTo(lane1Right, 0);
    ctx.lineTo(lane1Right, h);
    ctx.stroke();

    // Lane 2
    ctx.beginPath();
    ctx.moveTo(lane2Left, 0);
    ctx.lineTo(lane2Left, h);
    ctx.moveTo(lane2Right, 0);
    ctx.lineTo(lane2Right, h);
    ctx.stroke();

    // Finish line
    ctx.setLineDash([8, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lane1Left, finishY);
    ctx.lineTo(lane1Right, finishY);
    ctx.moveTo(lane2Left, finishY);
    ctx.lineTo(lane2Right, finishY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Labels
    ctx.font = 'bold 11px Space Mono, monospace';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.fillText('FINISH', lane1Left + laneWidth / 2, finishY + 15);
    ctx.fillText('FINISH', lane2Left + laneWidth / 2, finishY + 15);

    // Ball labels at top
    ctx.font = 'bold 12px Space Mono, monospace';
    if (balls[0]) ctx.fillText(balls[0].label, lane1Left + laneWidth / 2, 18);
    if (balls[1]) ctx.fillText(balls[1].label, lane2Left + laneWidth / 2, 18);

    // Draw pegs
    pegs.forEach(peg => peg.draw());

    // Draw balls
    balls.forEach(ball => ball.draw());
}

// Game loop
function gameLoop() {
    const w = canvas.width / 2;
    const h = canvas.height / 2;
    const laneWidth = (w - 40) / 2;
    const lane1Left = 15;
    const lane1Right = lane1Left + laneWidth;
    const lane2Left = w / 2 + 5;
    const lane2Right = lane2Left + laneWidth;
    const finishY = h - 50;

    // Update balls
    balls[0].update(lane1Left, lane1Right);
    balls[1].update(lane2Left, lane2Right);

    // Check peg collisions
    pegs.forEach(peg => {
        balls.forEach(ball => ball.collideWithPeg(peg));
    });

    // Check winner
    if (!winner) {
        for (const ball of balls) {
            if (ball.y >= finishY) {
                winner = ball;
                break;
            }
        }
    }

    // Draw
    draw();

    // End game
    if (winner) {
        setTimeout(() => {
            isRacing = false;
            winnerName.textContent = winner.label;
            resultDiv.classList.remove('hidden');
            startBtn.disabled = false;
            startBtn.textContent = 'RACE AGAIN';
        }, 300);
    } else {
        animationId = requestAnimationFrame(gameLoop);
    }
}

// Initial draw
function initialDraw() {
    const w = canvas.width / 2;
    const h = canvas.height / 2;

    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, w, h);

    ctx.font = '14px Space Mono, monospace';
    ctx.fillStyle = '#999';
    ctx.textAlign = 'center';
    ctx.fillText('Press START to begin', w / 2, h / 2);
}

initialDraw();
startBtn.addEventListener('click', startRace);
