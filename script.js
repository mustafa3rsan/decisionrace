const canvas = document.getElementById('raceCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const resultDiv = document.getElementById('result');
const winnerName = document.getElementById('winnerName');
const option1Input = document.getElementById('option1');
const option2Input = document.getElementById('option2');

// Canvas setup
let canvasWidth, canvasHeight;
function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    canvasWidth = rect.width;
    canvasHeight = rect.height;
}
resizeCanvas();
window.addEventListener('resize', () => {
    resizeCanvas();
    if (!isRacing) initialDraw();
});

// Physics constants
const GRAVITY = 0.25;
const BOUNCE = 0.7;
const FRICTION = 0.99;

// Track settings
const TRACK_HEIGHT = 2500; // Uzun pist
const FINISH_Y = TRACK_HEIGHT - 100;

// Game state
let balls = [];
let pegs = [];
let isRacing = false;
let winner = null;
let animationId = null;
let cameraY = 0; // Kamera pozisyonu

// Ball class
class Ball {
    constructor(x, y, label, isBlack) {
        this.x = x;
        this.y = y;
        this.radius = 12;
        this.vx = (Math.random() - 0.5) * 0.5;
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

    draw(offsetY) {
        const screenY = this.y - offsetY;

        // Ball
        ctx.beginPath();
        ctx.arc(this.x * 2, screenY * 2, this.radius * 2, 0, Math.PI * 2);
        ctx.fillStyle = this.isBlack ? '#000' : '#fff';
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    collideWithPeg(peg) {
        const dx = this.x - peg.x;
        const dy = this.y - peg.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = this.radius + peg.radius;

        if (dist < minDist) {
            const nx = dx / dist;
            const ny = dy / dist;

            const overlap = minDist - dist;
            this.x += nx * overlap;
            this.y += ny * overlap;

            const dotProduct = this.vx * nx + this.vy * ny;
            this.vx = (this.vx - 2 * dotProduct * nx) * BOUNCE;
            this.vy = (this.vy - 2 * dotProduct * ny) * BOUNCE;

            this.vx += (Math.random() - 0.5) * 2;

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

    draw(offsetY) {
        const screenY = this.y - offsetY;

        // Sadece ekranda görünenleri çiz
        if (screenY < -20 || screenY > canvasHeight + 20) return;

        ctx.beginPath();
        ctx.arc(this.x * 2, screenY * 2, this.radius * 2, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
    }
}

// Create pegs for entire track
function createPegs(laneLeft, laneRight, startY, endY) {
    const pegs = [];
    const numPegs = 80; // Daha fazla engel
    const laneWidth = laneRight - laneLeft;
    const padding = 15;

    for (let i = 0; i < numPegs; i++) {
        let x, y, valid;
        let attempts = 0;

        do {
            valid = true;
            x = laneLeft + padding + Math.random() * (laneWidth - padding * 2);
            y = startY + Math.random() * (endY - startY);

            for (const peg of pegs) {
                const dx = x - peg.x;
                const dy = y - peg.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 30) {
                    valid = false;
                    break;
                }
            }
            attempts++;
        } while (!valid && attempts < 50);

        if (valid) {
            pegs.push(new Peg(x, y));
        }
    }

    return pegs;
}

// Start race
function startRace() {
    const name1 = option1Input.value.trim() || 'Option A';
    const name2 = option2Input.value.trim() || 'Option B';

    const laneWidth = (canvasWidth - 40) / 2;
    const lane1Left = 15;
    const lane1Right = lane1Left + laneWidth;
    const lane2Left = canvasWidth / 2 + 5;
    const lane2Right = lane2Left + laneWidth;

    // Create balls
    balls = [
        new Ball(lane1Left + laneWidth / 2, 50, name1, true),
        new Ball(lane2Left + laneWidth / 2, 50, name2, false)
    ];

    // Create pegs for long track
    pegs = [
        ...createPegs(lane1Left, lane1Right, 100, FINISH_Y - 50),
        ...createPegs(lane2Left, lane2Right, 100, FINISH_Y - 50)
    ];

    // Reset state
    isRacing = true;
    winner = null;
    cameraY = 0;
    resultDiv.classList.add('hidden');
    startBtn.disabled = true;
    startBtn.textContent = 'RACING...';

    if (animationId) cancelAnimationFrame(animationId);
    gameLoop();
}

// Draw
function draw() {
    const laneWidth = (canvasWidth - 40) / 2;
    const lane1Left = 15;
    const lane1Right = lane1Left + laneWidth;
    const lane2Left = canvasWidth / 2 + 5;
    const lane2Right = lane2Left + laneWidth;

    // Clear
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Lanes
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;

    // Lane 1
    ctx.beginPath();
    ctx.moveTo(lane1Left * 2, 0);
    ctx.lineTo(lane1Left * 2, canvas.height);
    ctx.moveTo(lane1Right * 2, 0);
    ctx.lineTo(lane1Right * 2, canvas.height);
    ctx.stroke();

    // Lane 2
    ctx.beginPath();
    ctx.moveTo(lane2Left * 2, 0);
    ctx.lineTo(lane2Left * 2, canvas.height);
    ctx.moveTo(lane2Right * 2, 0);
    ctx.lineTo(lane2Right * 2, canvas.height);
    ctx.stroke();

    // Finish line (only if visible)
    const finishScreenY = FINISH_Y - cameraY;
    if (finishScreenY > -50 && finishScreenY < canvasHeight + 50) {
        ctx.setLineDash([12, 6]);
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(lane1Left * 2, finishScreenY * 2);
        ctx.lineTo(lane1Right * 2, finishScreenY * 2);
        ctx.moveTo(lane2Left * 2, finishScreenY * 2);
        ctx.lineTo(lane2Right * 2, finishScreenY * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // FINISH label
        ctx.font = 'bold 22px Space Mono, monospace';
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.fillText('FINISH', (lane1Left + laneWidth / 2) * 2, (finishScreenY + 25) * 2);
        ctx.fillText('FINISH', (lane2Left + laneWidth / 2) * 2, (finishScreenY + 25) * 2);
    }

    // Draw pegs
    pegs.forEach(peg => peg.draw(cameraY));

    // Draw balls
    balls.forEach(ball => ball.draw(cameraY));

    // Ball labels (fixed at top)
    ctx.font = 'bold 24px Space Mono, monospace';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.fillText(balls[0]?.label || '', (lane1Left + laneWidth / 2) * 2, 40);
    ctx.fillText(balls[1]?.label || '', (lane2Left + laneWidth / 2) * 2, 40);

    // Progress indicator
    const progress = Math.min(100, Math.floor((cameraY / (FINISH_Y - canvasHeight)) * 100));
    ctx.font = '20px Space Mono, monospace';
    ctx.fillStyle = '#999';
    ctx.textAlign = 'right';
    ctx.fillText(`${progress}%`, canvas.width - 20, 40);
}

// Game loop
function gameLoop() {
    const laneWidth = (canvasWidth - 40) / 2;
    const lane1Left = 15;
    const lane1Right = lane1Left + laneWidth;
    const lane2Left = canvasWidth / 2 + 5;
    const lane2Right = lane2Left + laneWidth;

    // Update balls
    balls[0].update(lane1Left, lane1Right);
    balls[1].update(lane2Left, lane2Right);

    // Check peg collisions
    pegs.forEach(peg => {
        balls.forEach(ball => ball.collideWithPeg(peg));
    });

    // Update camera - follow the leading ball smoothly
    const leadingBallY = Math.max(balls[0].y, balls[1].y);
    const targetCameraY = Math.max(0, leadingBallY - canvasHeight * 0.4);
    cameraY += (targetCameraY - cameraY) * 0.08; // Smooth follow

    // Check winner
    if (!winner) {
        for (const ball of balls) {
            if (ball.y >= FINISH_Y) {
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
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = '28px Space Mono, monospace';
    ctx.fillStyle = '#999';
    ctx.textAlign = 'center';
    ctx.fillText('Press START to begin', canvas.width / 2, canvas.height / 2);
}

initialDraw();
startBtn.addEventListener('click', startRace);
resultDiv.addEventListener('click', () => {
    resultDiv.classList.add('hidden');
    startBtn.disabled = false;
    startBtn.textContent = 'START RACE';
    initialDraw();
});
