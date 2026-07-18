const TANK_TYPES = {
    basic: {
        name: '기본 탱크',
        description: '균형 잡힌 성능',
        icon: '🎯',
        color: '#4361ee',
        health: 100,
        maxHealth: 100,
        speed: 3,
        damage: 20,
        fireRate: 1000,
        bulletSpeed: 8,
        bulletSize: 8
    },
    heavy: {
        name: '중전차',
        description: '높은 체력, 느린 속도',
        icon: '🛡️',
        color: '#2d3436',
        health: 180,
        maxHealth: 180,
        speed: 1.5,
        damage: 30,
        fireRate: 1500,
        bulletSpeed: 6,
        bulletSize: 12
    },
    light: {
        name: '경전차',
        description: '빠른 속도, 낮은 체력',
        icon: '⚡',
        color: '#00d2d3',
        health: 60,
        maxHealth: 60,
        speed: 5,
        damage: 15,
        fireRate: 600,
        bulletSpeed: 10,
        bulletSize: 5
    },
    artillery: {
        name: '포병 탱크',
        description: '높은 공격력, 느린 포탄',
        icon: '💥',
        color: '#e17055',
        health: 80,
        maxHealth: 80,
        speed: 2,
        damage: 50,
        fireRate: 2000,
        bulletSpeed: 5,
        bulletSize: 15
    },
    sniper: {
        name: '스나이퍼 탱크',
        description: '매우 높은 공격력, 매우 느린 연사',
        icon: '🎯',
        color: '#6c5ce7',
        health: 70,
        maxHealth: 70,
        speed: 2.5,
        damage: 80,
        fireRate: 3000,
        bulletSpeed: 15,
        bulletSize: 6
    },
    shotgun: {
        name: '샷건 탱크',
        description: '근거리 강함, 넓은 범위',
        icon: '🔥',
        color: '#fdcb6e',
        health: 90,
        maxHealth: 90,
        speed: 2.8,
        damage: 12,
        fireRate: 1200,
        bulletSpeed: 7,
        bulletSize: 6,
        shotgunPellets: 5
    },
    missile: {
        name: '미사일 탱크',
        description: '유도 미사일 발사',
        icon: '🚀',
        color: '#e84393',
        health: 85,
        maxHealth: 85,
        speed: 2.2,
        damage: 35,
        fireRate: 2500,
        bulletSpeed: 4,
        bulletSize: 10,
        homing: true
    },
    shield: {
        name: '실드 탱크',
        description: '방어막 생성',
        icon: '🛡️',
        color: '#00cec9',
        health: 120,
        maxHealth: 120,
        speed: 2.5,
        damage: 18,
        fireRate: 1100,
        bulletSpeed: 7,
        bulletSize: 7,
        hasShield: true,
        shieldDuration: 3000,
        shieldCooldown: 8000
    },
    railgun: {
        name: '레일건 탱크',
        description: '관통하는 레이저',
        icon: '⚡',
        color: '#a29bfe',
        health: 75,
        maxHealth: 75,
        speed: 2.3,
        damage: 60,
        fireRate: 2800,
        bulletSpeed: 20,
        bulletSize: 4,
        piercing: true
    },
    flame: {
        name: '플레임 탱크',
        description: '지속 화염 공격',
        icon: '🔥',
        color: '#ff7675',
        health: 95,
        maxHealth: 95,
        speed: 2.7,
        damage: 5,
        fireRate: 100,
        bulletSpeed: 6,
        bulletSize: 10,
        flame: true
    }
};

class Tank {
    constructor(type, x, y, team, isPlayer = false) {
        const tankData = TANK_TYPES[type];
        this.type = type;
        this.x = x;
        this.y = y;
        this.team = team;
        this.isPlayer = isPlayer;
        this.angle = team === 'red' ? 0 : Math.PI;
        this.turretAngle = this.angle;
        
        this.health = tankData.health;
        this.maxHealth = tankData.maxHealth;
        this.speed = tankData.speed;
        this.damage = tankData.damage;
        this.fireRate = tankData.fireRate;
        this.bulletSpeed = tankData.bulletSpeed;
        this.bulletSize = tankData.bulletSize;
        this.color = tankData.color;
        this.name = tankData.name;
        
        this.shotgunPellets = tankData.shotgunPellets || 1;
        this.homing = tankData.homing || false;
        this.hasShield = tankData.hasShield || false;
        this.shieldActive = false;
        this.shieldCooldownTimer = 0;
        this.shieldDurationTimer = 0;
        this.piercing = tankData.piercing || false;
        this.flame = tankData.flame || false;
        
        this.lastFireTime = 0;
        this.width = 40;
        this.height = 30;
        
        this.shieldActive = false;
        this.shieldCooldownTimer = 0;
        this.shieldDurationTimer = 0;
    }
    
    update(deltaTime, target = null) {
        if (this.hasShield) {
            if (this.shieldCooldownTimer > 0) {
                this.shieldCooldownTimer -= deltaTime;
            }
            if (this.shieldActive) {
                this.shieldDurationTimer -= deltaTime;
                if (this.shieldDurationTimer <= 0) {
                    this.shieldActive = false;
                    this.shieldCooldownTimer = TANK_TYPES[this.type].shieldCooldown;
                }
            }
        }
        
        if (this.homing && target) {
            this.turretAngle = Math.atan2(target.y - this.y, target.x - this.x);
        }
    }
    
    move(dx, dy, obstacles) {
        const newX = this.x + dx;
        const newY = this.y + dy;
        
        let canMove = true;
        for (const obstacle of obstacles) {
            if (this.checkCollision(newX, newY, obstacle)) {
                canMove = false;
                break;
            }
        }
        
        if (canMove) {
            this.x = newX;
            this.y = newY;
        }
    }
    
    checkCollision(x, y, obstacle) {
        return x + this.width / 2 > obstacle.x &&
               x - this.width / 2 < obstacle.x + obstacle.width &&
               y + this.height / 2 > obstacle.y &&
               y - this.height / 2 < obstacle.y + obstacle.height;
    }
    
    fire(currentTime) {
        if (currentTime - this.lastFireTime < this.fireRate) {
            return null;
        }
        this.lastFireTime = currentTime;
        
        const bullets = [];
        if (this.shotgunPellets > 1) {
            for (let i = 0; i < this.shotgunPellets; i++) {
                const spread = (i - (this.shotgunPellets - 1) / 2) * 0.15;
                bullets.push(new Bullet(
                    this.x + Math.cos(this.turretAngle) * 25,
                    this.y + Math.sin(this.turretAngle) * 25,
                    this.turretAngle + spread,
                    this
                ));
            }
        } else {
            bullets.push(new Bullet(
                this.x + Math.cos(this.turretAngle) * 25,
                this.y + Math.sin(this.turretAngle) * 25,
                this.turretAngle,
                this
            ));
        }
        
        return bullets;
    }
    
    activateShield() {
        if (this.hasShield && !this.shieldActive && this.shieldCooldownTimer <= 0) {
            this.shieldActive = true;
            this.shieldDurationTimer = TANK_TYPES[this.type].shieldDuration;
        }
    }
    
    takeDamage(amount) {
        if (this.shieldActive) {
            return;
        }
        this.health -= amount;
    }
    
    isDead() {
        return this.health <= 0;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        if (this.shieldActive) {
            ctx.beginPath();
            ctx.arc(0, 0, 35, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 206, 201, 0.8)';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.fillStyle = 'rgba(0, 206, 201, 0.2)';
            ctx.fill();
        }
        
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        ctx.fillStyle = this.team === 'red' ? '#ff6b6b' : '#4cc9f0';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.turretAngle);
        ctx.fillStyle = this.color;
        ctx.fillRect(0, -4, 25, 8);
        ctx.restore();
        
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - 25, this.y - 30, 50, 6);
        ctx.fillStyle = healthPercent > 0.5 ? '#00d2d3' : healthPercent > 0.25 ? '#fdcb6e' : '#ff6b6b';
        ctx.fillRect(this.x - 25, this.y - 30, 50 * healthPercent, 6);
    }
}

class Bullet {
    constructor(x, y, angle, tank) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.tank = tank;
        this.speed = tank.bulletSpeed;
        this.damage = tank.damage;
        this.size = tank.bulletSize;
        this.homing = tank.homing;
        this.piercing = tank.piercing;
        this.flame = tank.flame;
        this.life = 3000;
        this.hitTanks = [];
    }
    
    update(deltaTime, tanks) {
        if (this.homing) {
            let closestEnemy = null;
            let closestDist = Infinity;
            for (const tank of tanks) {
                if (tank.team !== this.tank.team && !tank.isDead()) {
                    const dist = Math.hypot(tank.x - this.x, tank.y - this.y);
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestEnemy = tank;
                    }
                }
            }
            if (closestEnemy) {
                const targetAngle = Math.atan2(closestEnemy.y - this.y, closestEnemy.x - this.x);
                const angleDiff = targetAngle - this.angle;
                this.angle += angleDiff * 0.05;
            }
        }
        
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.life -= deltaTime;
    }
    
    isExpired() {
        return this.life <= 0;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        if (this.flame) {
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
            gradient.addColorStop(0, 'rgba(255, 200, 0, 0.9)');
            gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.7)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = this.tank.team === 'red' ? '#ff6b6b' : '#4cc9f0';
            ctx.beginPath();
            ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}
