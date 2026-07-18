const MAP_TYPES = {
    plains: {
        name: '평지 맵',
        description: '넓은 평지, 적은 장애물',
        icon: '🌿',
        backgroundColor: '#2d5016',
        getObstacles: (width, height) => [
            { x: width / 2 - 30, y: height / 2 - 30, width: 60, height: 60, type: 'rock' }
        ]
    },
    hills: {
        name: '언덕 맵',
        description: '언덕과 골짜기, 전략적 위치 중요',
        icon: '⛰️',
        backgroundColor: '#5d4e37',
        getObstacles: (width, height) => [
            { x: width / 4 - 50, y: height / 3 - 50, width: 100, height: 100, type: 'hill' },
            { x: width * 3 / 4 - 50, y: height / 3 - 50, width: 100, height: 100, type: 'hill' },
            { x: width / 2 - 40, y: height * 2 / 3 - 40, width: 80, height: 80, type: 'hill' }
        ]
    },
    city: {
        name: '도시 맵',
        description: '건물과 장애물 많음, 근거리 전투 유리',
        icon: '🏙️',
        backgroundColor: '#34495e',
        getObstacles: (width, height) => [
            { x: width / 5 - 40, y: height / 4 - 60, width: 80, height: 120, type: 'building' },
            { x: width * 2 / 5 - 35, y: height * 3 / 4 - 50, width: 70, height: 100, type: 'building' },
            { x: width * 3 / 5 - 45, y: height / 5 - 70, width: 90, height: 140, type: 'building' },
            { x: width * 4 / 5 - 30, y: height / 2 - 40, width: 60, height: 80, type: 'building' }
        ]
    }
};

class GameMap {
    constructor(type, width, height) {
        const mapData = MAP_TYPES[type];
        this.type = type;
        this.name = mapData.name;
        this.backgroundColor = mapData.backgroundColor;
        this.width = width;
        this.height = height;
        this.obstacles = mapData.getObstacles(width, height);
    }
    
    draw(ctx) {
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, this.width, this.height);
        
        for (const obstacle of this.obstacles) {
            this.drawObstacle(ctx, obstacle);
        }
    }
    
    drawObstacle(ctx, obstacle) {
        ctx.save();
        
        switch (obstacle.type) {
            case 'rock':
                ctx.fillStyle = '#636e72';
                ctx.beginPath();
                ctx.ellipse(
                    obstacle.x + obstacle.width / 2,
                    obstacle.y + obstacle.height / 2,
                    obstacle.width / 2,
                    obstacle.height / 2,
                    0, 0, Math.PI * 2
                );
                ctx.fill();
                ctx.strokeStyle = '#2d3436';
                ctx.lineWidth = 3;
                ctx.stroke();
                break;
                
            case 'hill':
                ctx.fillStyle = '#8b7355';
                ctx.beginPath();
                ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
                ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y);
                ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#5d4e37';
                ctx.lineWidth = 3;
                ctx.stroke();
                break;
                
            case 'building':
                ctx.fillStyle = '#636e72';
                ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                ctx.strokeStyle = '#2d3436';
                ctx.lineWidth = 4;
                ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                
                ctx.fillStyle = '#74b9ff';
                const windowSize = 12;
                const windowGap = 18;
                for (let wy = obstacle.y + 15; wy < obstacle.y + obstacle.height - 15; wy += windowGap) {
                    for (let wx = obstacle.x + 10; wx < obstacle.x + obstacle.width - 10; wx += windowGap) {
                        ctx.fillRect(wx, wy, windowSize, windowSize);
                    }
                }
                break;
        }
        
        ctx.restore();
    }
    
    getSpawnPoints() {
        const redSpawns = [
            { x: 100, y: this.height / 2 - 100 },
            { x: 100, y: this.height / 2 },
            { x: 100, y: this.height / 2 + 100 }
        ];
        
        const blueSpawns = [
            { x: this.width - 100, y: this.height / 2 - 100 },
            { x: this.width - 100, y: this.height / 2 },
            { x: this.width - 100, y: this.height / 2 + 100 }
        ];
        
        return { red: redSpawns, blue: blueSpawns };
    }
}
