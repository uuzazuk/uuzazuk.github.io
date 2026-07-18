class Physics {
    static checkBulletTankCollision(bullet, tank) {
        if (tank.isDead() || tank.team === bullet.tank.team) {
            return false;
        }
        
        const dist = Math.hypot(bullet.x - tank.x, bullet.y - tank.y);
        return dist < (bullet.size / 2 + 20);
    }
    
    static checkBulletObstacleCollision(bullet, obstacle) {
        return bullet.x + bullet.size / 2 > obstacle.x &&
               bullet.x - bullet.size / 2 < obstacle.x + obstacle.width &&
               bullet.y + bullet.size / 2 > obstacle.y &&
               bullet.y - bullet.size / 2 < obstacle.y + obstacle.height;
    }
    
    static checkBulletBoundaryCollision(bullet, width, height) {
        return bullet.x < 0 || bullet.x > width ||
               bullet.y < 0 || bullet.y > height;
    }
    
    static checkTankBoundaryCollision(tank, width, height) {
        const newX = tank.x;
        const newY = tank.y;
        
        return newX - tank.width / 2 < 0 ||
               newX + tank.width / 2 > width ||
               newY - tank.height / 2 < 0 ||
               newY + tank.height / 2 > height;
    }
    
    static resolveCollisions(bullets, tanks, obstacles, width, height) {
        const bulletsToRemove = [];
        
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            let shouldRemove = false;
            
            if (this.checkBulletBoundaryCollision(bullet, width, height)) {
                shouldRemove = true;
            }
            
            for (const obstacle of obstacles) {
                if (this.checkBulletObstacleCollision(bullet, obstacle)) {
                    shouldRemove = true;
                    break;
                }
            }
            
            if (!shouldRemove) {
                for (const tank of tanks) {
                    if (this.checkBulletTankCollision(bullet, tank)) {
                        if (!bullet.hitTanks.includes(tank)) {
                            tank.takeDamage(bullet.damage);
                            bullet.hitTanks.push(tank);
                            
                            if (!bullet.piercing) {
                                shouldRemove = true;
                            }
                        }
                    }
                }
            }
            
            if (shouldRemove || bullet.isExpired()) {
                bulletsToRemove.push(i);
            }
        }
        
        for (let i = bulletsToRemove.length - 1; i >= 0; i--) {
            bullets.splice(bulletsToRemove[i], 1);
        }
    }
    
    static keepTankInBounds(tank, width, height) {
        tank.x = Math.max(tank.width / 2, Math.min(width - tank.width / 2, tank.x));
        tank.y = Math.max(tank.height / 2, Math.min(height - tank.height / 2, tank.y));
    }
}
