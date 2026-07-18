class AITankController {
    constructor(tank) {
        this.tank = tank;
        this.target = null;
        this.state = 'patrol';
        this.patrolTarget = null;
        this.lastDecisionTime = 0;
        this.decisionInterval = 500;
    }
    
    update(deltaTime, currentTime, tanks, obstacles, mapWidth, mapHeight) {
        if (this.tank.isDead()) {
            return;
        }
        
        if (currentTime - this.lastDecisionTime > this.decisionInterval) {
            this.makeDecision(tanks, mapWidth, mapHeight);
            this.lastDecisionTime = currentTime;
        }
        
        this.executeState(deltaTime, tanks, obstacles, mapWidth, mapHeight);
        
        this.tank.update(deltaTime, this.target);
    }
    
    makeDecision(tanks, mapWidth, mapHeight) {
        const enemies = tanks.filter(t => t.team !== this.tank.team && !t.isDead());
        
        if (enemies.length === 0) {
            this.state = 'patrol';
            return;
        }
        
        let closestEnemy = null;
        let closestDist = Infinity;
        
        for (const enemy of enemies) {
            const dist = Math.hypot(enemy.x - this.tank.x, enemy.y - this.tank.y);
            if (dist < closestDist) {
                closestDist = dist;
                closestEnemy = enemy;
            }
        }
        
        this.target = closestEnemy;
        
        if (closestDist < 300) {
            this.state = 'attack';
        } else {
            this.state = 'approach';
        }
    }
    
    executeState(deltaTime, tanks, obstacles, mapWidth, mapHeight) {
        const currentTime = Date.now();
        
        switch (this.state) {
            case 'patrol':
                this.patrol(obstacles, mapWidth, mapHeight);
                break;
                
            case 'approach':
                this.approach(obstacles);
                break;
                
            case 'attack':
                this.attack(currentTime, obstacles);
                break;
        }
    }
    
    patrol(obstacles, mapWidth, mapHeight) {
        if (!this.patrolTarget || 
            Math.hypot(this.patrolTarget.x - this.tank.x, this.patrolTarget.y - this.tank.y) < 50) {
            this.patrolTarget = {
                x: 100 + Math.random() * (mapWidth - 200),
                y: 100 + Math.random() * (mapHeight - 200)
            };
        }
        
        this.moveToward(this.patrolTarget, obstacles);
    }
    
    approach(obstacles) {
        if (this.target) {
            this.moveToward(this.target, obstacles);
        }
    }
    
    attack(currentTime, obstacles) {
        if (this.target) {
            const angle = Math.atan2(this.target.y - this.tank.y, this.target.x - this.tank.x);
            this.tank.turretAngle = angle;
            this.tank.angle = angle;
            
            const dist = Math.hypot(this.target.x - this.tank.x, this.target.y - this.tank.y);
            if (dist > 150) {
                this.moveToward(this.target, obstacles);
            } else if (dist < 100) {
                this.moveAway(this.target, obstacles);
            }
            
            const bullets = this.tank.fire(currentTime);
            if (bullets) {
                return bullets;
            }
        }
        return null;
    }
    
    moveToward(target, obstacles) {
        const angle = Math.atan2(target.y - this.tank.y, target.x - this.tank.x);
        this.tank.angle = angle;
        this.tank.turretAngle = angle;
        
        const dx = Math.cos(angle) * this.tank.speed;
        const dy = Math.sin(angle) * this.tank.speed;
        this.tank.move(dx, dy, obstacles);
    }
    
    moveAway(target, obstacles) {
        const angle = Math.atan2(target.y - this.tank.y, target.x - this.tank.x);
        const oppositeAngle = angle + Math.PI;
        this.tank.angle = oppositeAngle;
        
        const dx = Math.cos(oppositeAngle) * this.tank.speed;
        const dy = Math.sin(oppositeAngle) * this.tank.speed;
        this.tank.move(dx, dy, obstacles);
    }
}
