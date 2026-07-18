class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.tankSelectScreen = document.getElementById('tank-select-screen');
        this.mapSelectScreen = document.getElementById('map-select-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.gameOverScreen = document.getElementById('game-over');
        this.gameResult = document.getElementById('game-result');
        this.redScoreEl = document.getElementById('red-score');
        this.blueScoreEl = document.getElementById('blue-score');
        this.healthFill = document.getElementById('health-fill');
        
        this.selectedTankType = null;
        this.selectedMapType = null;
        this.gameMap = null;
        this.tanks = [];
        this.bullets = [];
        this.aiControllers = [];
        this.playerTank = null;
        
        this.keys = {};
        this.lastTime = 0;
        this.gameRunning = false;
        this.gameOver = false;
        this.mouseX = 0;
        this.mouseY = 0;
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.renderTankSelection();
        this.renderMapSelection();
    }
    
    setupCanvas() {
        const resizeCanvas = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0 && this.playerTank && !this.playerTank.isDead()) {
                const bullets = this.playerTank.fire(Date.now());
                if (bullets) {
                    this.bullets.push(...bullets);
                }
            }
        });
        
        document.getElementById('next-btn').addEventListener('click', () => {
            this.showMapSelection();
        });
        
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.resetGame();
        });
    }
    
    renderTankSelection() {
        const tankList = document.getElementById('tank-list');
        tankList.innerHTML = '';
        
        for (const [type, data] of Object.entries(TANK_TYPES)) {
            const card = document.createElement('div');
            card.className = 'selection-card';
            card.innerHTML = `
                <div class="tank-icon">${data.icon}</div>
                <h3>${data.name}</h3>
                <p>${data.description}</p>
            `;
            
            card.addEventListener('click', () => {
                document.querySelectorAll('#tank-list .selection-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedTankType = type;
                document.getElementById('next-btn').disabled = false;
            });
            
            tankList.appendChild(card);
        }
    }
    
    renderMapSelection() {
        const mapList = document.getElementById('map-list');
        mapList.innerHTML = '';
        
        for (const [type, data] of Object.entries(MAP_TYPES)) {
            const card = document.createElement('div');
            card.className = 'selection-card';
            card.innerHTML = `
                <div class="map-preview">${data.icon}</div>
                <h3>${data.name}</h3>
                <p>${data.description}</p>
            `;
            
            card.addEventListener('click', () => {
                document.querySelectorAll('#map-list .selection-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedMapType = type;
                document.getElementById('start-btn').disabled = false;
            });
            
            mapList.appendChild(card);
        }
    }
    
    showMapSelection() {
        this.tankSelectScreen.classList.remove('active');
        this.mapSelectScreen.classList.add('active');
    }
    
    startGame() {
        this.mapSelectScreen.classList.remove('active');
        this.gameScreen.classList.add('active');
        
        this.gameMap = new GameMap(this.selectedMapType, this.canvas.width, this.canvas.height);
        const spawnPoints = this.gameMap.getSpawnPoints();
        
        this.tanks = [];
        this.aiControllers = [];
        this.bullets = [];
        
        const tankTypes = Object.keys(TANK_TYPES);
        
        this.playerTank = new Tank(
            this.selectedTankType,
            spawnPoints.red[0].x,
            spawnPoints.red[0].y,
            'red',
            true
        );
        this.tanks.push(this.playerTank);
        
        for (let i = 1; i < 3; i++) {
            const randomType = tankTypes[Math.floor(Math.random() * tankTypes.length)];
            const aiTank = new Tank(
                randomType,
                spawnPoints.red[i].x,
                spawnPoints.red[i].y,
                'red'
            );
            this.tanks.push(aiTank);
            this.aiControllers.push(new AITankController(aiTank));
        }
        
        for (let i = 0; i < 3; i++) {
            const randomType = tankTypes[Math.floor(Math.random() * tankTypes.length)];
            const aiTank = new Tank(
                randomType,
                spawnPoints.blue[i].x,
                spawnPoints.blue[i].y,
                'blue'
            );
            this.tanks.push(aiTank);
            this.aiControllers.push(new AITankController(aiTank));
        }
        
        this.gameRunning = true;
        this.gameOver = false;
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    gameLoop(currentTime = performance.now()) {
        if (!this.gameRunning) return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        if (!this.gameOver) {
            requestAnimationFrame((time) => this.gameLoop(time));
        }
    }
    
    update(deltaTime) {
        const currentTime = Date.now();
        
        if (this.playerTank && !this.playerTank.isDead()) {
            this.updatePlayer(deltaTime, currentTime);
        }
        
        for (const controller of this.aiControllers) {
            const bullets = controller.update(
                deltaTime,
                currentTime,
                this.tanks,
                this.gameMap.obstacles,
                this.canvas.width,
                this.canvas.height
            );
            if (bullets) {
                this.bullets.push(...bullets);
            }
        }
        
        for (const tank of this.tanks) {
            if (!tank.isDead()) {
                tank.update(deltaTime);
                Physics.keepTankInBounds(tank, this.canvas.width, this.canvas.height);
            }
        }
        
        for (const bullet of this.bullets) {
            bullet.update(deltaTime, this.tanks);
        }
        
        Physics.resolveCollisions(
            this.bullets,
            this.tanks,
            this.gameMap.obstacles,
            this.canvas.width,
            this.canvas.height
        );
        
        this.checkGameOver();
        this.updateUI();
    }
    
    updatePlayer(deltaTime, currentTime) {
        let dx = 0;
        let dy = 0;
        
        if (this.keys['w'] || this.keys['arrowup']) dy -= this.playerTank.speed;
        if (this.keys['s'] || this.keys['arrowdown']) dy += this.playerTank.speed;
        if (this.keys['a'] || this.keys['arrowleft']) dx -= this.playerTank.speed;
        if (this.keys['d'] || this.keys['arrowright']) dx += this.playerTank.speed;
        
        if (dx !== 0 || dy !== 0) {
            this.playerTank.angle = Math.atan2(dy, dx);
        }
        
        this.playerTank.move(dx, dy, this.gameMap.obstacles);
        
        this.playerTank.turretAngle = Math.atan2(
            this.mouseY - this.playerTank.y,
            this.mouseX - this.playerTank.x
        );
        
        if (this.keys[' ']) {
            this.playerTank.activateShield();
        }
    }
    
    checkGameOver() {
        const redAlive = this.tanks.filter(t => t.team === 'red' && !t.isDead()).length;
        const blueAlive = this.tanks.filter(t => t.team === 'blue' && !t.isDead()).length;
        
        if (redAlive === 0 || blueAlive === 0) {
            this.gameOver = true;
            this.gameRunning = false;
            
            if (redAlive > 0) {
                this.gameResult.textContent = '레드팀 승리!';
            } else {
                this.gameResult.textContent = '블루팀 승리!';
            }
            
            this.gameOverScreen.classList.remove('hidden');
        }
    }
    
    updateUI() {
        const redScore = this.tanks.filter(t => t.team === 'blue' && t.isDead()).length;
        const blueScore = this.tanks.filter(t => t.team === 'red' && t.isDead()).length;
        
        this.redScoreEl.textContent = redScore;
        this.blueScoreEl.textContent = blueScore;
        
        if (this.playerTank && !this.playerTank.isDead()) {
            const healthPercent = (this.playerTank.health / this.playerTank.maxHealth) * 100;
            this.healthFill.style.width = `${healthPercent}%`;
        }
    }
    
    render() {
        this.gameMap.draw(this.ctx);
        
        for (const tank of this.tanks) {
            if (!tank.isDead()) {
                tank.draw(this.ctx);
            }
        }
        
        for (const bullet of this.bullets) {
            bullet.draw(this.ctx);
        }
    }
    
    resetGame() {
        this.gameOverScreen.classList.add('hidden');
        this.gameScreen.classList.remove('active');
        this.tankSelectScreen.classList.add('active');
        
        this.selectedTankType = null;
        this.selectedMapType = null;
        document.getElementById('next-btn').disabled = true;
        document.getElementById('start-btn').disabled = true;
        document.querySelectorAll('.selection-card').forEach(c => c.classList.remove('selected'));
    }
}

const game = new Game();
