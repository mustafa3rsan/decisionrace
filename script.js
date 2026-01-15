const canvas = document.getElementById('raceCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const resultDiv = document.getElementById('result');
const winnerName = document.getElementById('winnerName');
const option1Input = document.getElementById('option1');
const option2Input = document.getElementById('option2');

// Canvas boyutlarını ayarla
function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Fizik sabitleri
const GRAVITY = 0.4;
const FRICTION = 0.99;
const BOUNCE = 0.7;

// Oyun durumu
let balls = [];
let obstacles = [];
let isRacing = false;
let winner = null;
let animationId = null;

// Top sınıfı
class Ball {
    constructor(x, y, color, name, lane) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.color = color;
        this.name = name;
        this.lane = lane;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = 0;
    }

    update(canvasWidth, canvasHeight, laneWidth, laneStart) {
        // Yerçekimi
        this.vy += GRAVITY;

        // Sürtünme
        this.vx *= FRICTION;
        this.vy *= FRICTION;

        // Pozisyon güncelle
        this.x += this.vx;
        this.y += this.vy;

        // Koridor sınırları
        const leftBound = laneStart + this.radius;
        const rightBound = laneStart + laneWidth - this.radius;

        if (this.x < leftBound) {
            this.x = leftBound;
            this.vx = -this.vx * BOUNCE;
        }
        if (this.x > rightBound) {
            this.x = rightBound;
            this.vx = -this.vx * BOUNCE;
        }

        // Üst sınır
        if (this.y < this.radius) {
            this.y = this.radius;
            this.vy = -this.vy * BOUNCE;
        }
    }

    draw() {
        // Gölge
        ctx.beginPath();
        ctx.arc(this.x + 3, this.y + 3, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fill();

        // Top
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Parlama efekti
        ctx.beginPath();
        ctx.arc(this.x - 4, this.y - 4, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();
    }

    checkCollision(obstacle) {
        const dx = this.x - obstacle.x;
        const dy = this.y - obstacle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.radius + obstacle.radius) {
            // Çarpışma açısı
            const angle = Math.atan2(dy, dx);
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);

            // Rastgele sapma ekle
            const randomAngle = angle + (Math.random() - 0.5) * 0.5;

            this.vx = Math.cos(randomAngle) * speed * BOUNCE;
            this.vy = Math.sin(randomAngle) * speed * BOUNCE;

            // Çakışmayı önle
            const overlap = this.radius + obstacle.radius - distance;
            this.x += Math.cos(angle) * overlap;
            this.y += Math.sin(angle) * overlap;

            return true;
        }
        return false;
    }
}

// Engel sınıfı
class Obstacle {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ddd';
        ctx.fill();
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// Engelleri oluştur
function createObstacles(laneStart, laneWidth, canvasHeight) {
    const obstacles = [];
    const rows = 8;
    const startY = 80;
    const endY = canvasHeight - 80;
    const rowHeight = (endY - startY) / rows;

    for (let row = 0; row < rows; row++) {
        const y = startY + row * rowHeight + rowHeight / 2;
        const numObstacles = 2 + Math.floor(Math.random() * 2);

        for (let i = 0; i < numObstacles; i++) {
            const x = laneStart + 30 + Math.random() * (laneWidth - 60);
            const radius = 8 + Math.random() * 6;
            obstacles.push(new Obstacle(x, y, radius));
        }
    }

    return obstacles;
}

// Oyunu başlat
function startRace() {
    const name1 = option1Input.value.trim() || 'Option 1';
    const name2 = option2Input.value.trim() || 'Option 2';

    const canvasWidth = canvas.width / 2;
    const canvasHeight = canvas.height / 2;
    const laneWidth = (canvasWidth - 60) / 2;
    const lane1Start = 20;
    const lane2Start = canvasWidth / 2 + 10;

    // Topları oluştur
    balls = [
        new Ball(lane1Start + laneWidth / 2, 30, '#4a90d9', name1, 1),
        new Ball(lane2Start + laneWidth / 2, 30, '#e74c3c', name2, 2)
    ];

    // Engelleri oluştur (her koridor için ayrı)
    obstacles = [
        ...createObstacles(lane1Start, laneWidth, canvasHeight),
        ...createObstacles(lane2Start, laneWidth, canvasHeight)
    ];

    // Durumu sıfırla
    isRacing = true;
    winner = null;
    resultDiv.classList.add('hidden');
    startBtn.disabled = true;
    startBtn.textContent = 'Race in progress...';

    // Animasyonu başlat
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    gameLoop();
}

// Çizim
function draw() {
    const canvasWidth = canvas.width / 2;
    const canvasHeight = canvas.height / 2;
    const laneWidth = (canvasWidth - 60) / 2;
    const lane1Start = 20;
    const lane2Start = canvasWidth / 2 + 10;

    // Arka plan
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Koridorları çiz
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(lane1Start, 0, laneWidth, canvasHeight);
    ctx.fillRect(lane2Start, 0, laneWidth, canvasHeight);

    // Koridor sınırları
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.strokeRect(lane1Start, 0, laneWidth, canvasHeight);
    ctx.strokeRect(lane2Start, 0, laneWidth, canvasHeight);

    // Bitiş çizgisi
    const finishY = canvasHeight - 40;
    ctx.setLineDash([10, 5]);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lane1Start, finishY);
    ctx.lineTo(lane1Start + laneWidth, finishY);
    ctx.moveTo(lane2Start, finishY);
    ctx.lineTo(lane2Start + laneWidth, finishY);
    ctx.stroke();
    ctx.setLineDash([]);

    // "FINISH" yazısı
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.fillText('FINISH', lane1Start + laneWidth / 2, finishY + 20);
    ctx.fillText('FINISH', lane2Start + laneWidth / 2, finishY + 20);

    // İsimler
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#4a90d9';
    ctx.fillText(balls[0]?.name || '', lane1Start + laneWidth / 2, 15);
    ctx.fillStyle = '#e74c3c';
    ctx.fillText(balls[1]?.name || '', lane2Start + laneWidth / 2, 15);

    // Engeller
    obstacles.forEach(obstacle => obstacle.draw());

    // Toplar
    balls.forEach(ball => ball.draw());
}

// Oyun döngüsü
function gameLoop() {
    const canvasWidth = canvas.width / 2;
    const canvasHeight = canvas.height / 2;
    const laneWidth = (canvasWidth - 60) / 2;
    const lane1Start = 20;
    const lane2Start = canvasWidth / 2 + 10;
    const finishY = canvasHeight - 40;

    // Topları güncelle
    balls[0].update(canvasWidth, canvasHeight, laneWidth, lane1Start);
    balls[1].update(canvasWidth, canvasHeight, laneWidth, lane2Start);

    // Engel çarpışmaları
    obstacles.forEach(obstacle => {
        balls.forEach(ball => ball.checkCollision(obstacle));
    });

    // Kazanan kontrolü
    if (!winner) {
        for (const ball of balls) {
            if (ball.y >= finishY) {
                winner = ball;
                break;
            }
        }
    }

    // Çiz
    draw();

    // Kazanan varsa
    if (winner) {
        setTimeout(() => {
            isRacing = false;
            winnerName.textContent = winner.name;
            resultDiv.classList.remove('hidden');
            startBtn.disabled = false;
            startBtn.textContent = 'Race Again';
        }, 500);
    } else {
        animationId = requestAnimationFrame(gameLoop);
    }
}

// Başlangıç çizimi
function initialDraw() {
    const canvasWidth = canvas.width / 2;
    const canvasHeight = canvas.height / 2;

    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.fillText('Click the button to start the race!', canvasWidth / 2, canvasHeight / 2);
}

initialDraw();

// Event listener
startBtn.addEventListener('click', startRace);
