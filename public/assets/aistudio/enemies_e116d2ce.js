// Enemy AI & Telegraphing Attack System
export class BaseEnemy {
  constructor(x, y, config = {}) {
    this.x = x;
    this.y = y;
    this.width = config.width || 48;
    this.height = config.height || 64;
    this.hp = config.hp || 100;
    this.maxHp = this.hp;
    this.speed = config.speed || 2;
    this.facing = -1;

    this.state = "patrol"; // patrol | chase | telegraph | attack | recover | stunned
    this.stateTimer = 0;
    this.detectRange = config.detectRange || 300;
    this.attackRange = config.attackRange || 70;

    this.stunTimer = 0;
    this.burnTimer = 0;
    this.hitFlashTimer = 0;
  }

  takeDamage(amount, ammoEffect = "none") {
    this.hp -= amount;
    this.hitFlashTimer = 0.15;
    if (ammoEffect === "stun") {
      this.state = "stunned";
      this.stunTimer = 1.5;
    } else if (ammoEffect === "burn_aoe") {
      this.burnTimer = 3.0;
    }
  }

  updateStatus(dt) {
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
    if (this.burnTimer > 0) {
      this.burnTimer -= dt;
      this.hp -= 8 * dt;
    }
    if (this.state === "stunned") {
      this.stunTimer -= dt;
      if (this.stunTimer <= 0) this.state = "chase";
      return true;
    }
    return false;
  }

  facePlayer(player) {
    this.facing = player.x >= this.x ? 1 : -1;
  }

  getDistanceTo(player) {
    return Math.hypot(player.x - this.x, player.y - this.y);
  }
}

export class BuwayaPolitiko extends BaseEnemy {
  constructor(x, y) {
    super(x, y, { hp: 160, speed: 1.8, detectRange: 320, attackRange: 85 });
    this.anim = "buwaya_walk";
    this.attackHitbox = null;
  }

  update(dt, player, vfxManager) {
    if (this.hp <= 0 || this.updateStatus(dt)) return;
    const dist = this.getDistanceTo(player);

    switch (this.state) {
      case "patrol":
        this.anim = "buwaya_walk";
        this.x += this.facing * (this.speed * 0.5);
        if (dist < this.detectRange) this.state = "chase";
        break;
      case "chase":
        this.facePlayer(player);
        this.x += this.facing * this.speed;
        if (dist <= this.attackRange) {
          this.state = "telegraph";
          this.stateTimer = 0.7;
          this.anim = "buwaya_windup_sack";
        }
        break;
      case "telegraph":
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          this.state = "attack";
          this.stateTimer = 0.25;
          this.anim = "buwaya_swing_sack";
          this.executeSwing(player, vfxManager);
        }
        break;
      case "attack":
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          this.attackHitbox = null;
          this.state = "recover";
          this.stateTimer = 0.8;
        }
        break;
      case "recover":
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) this.state = "chase";
        break;
    }
  }

  executeSwing(player, vfxManager) {
    const hitX = this.facing === 1 ? this.x + 20 : this.x - 90;
    this.attackHitbox = { x: hitX, y: this.y - 20, w: 70, h: 60 };
    if (vfxManager) vfxManager.spawn("flying_coins", hitX + 35, this.y);
    if (player.x > this.attackHitbox.x && player.x < this.attackHitbox.x + this.attackHitbox.w) {
      player.takeDamage(25);
      player.vx = this.facing * 12;
    }
  }
}

export class AsinWraith extends BaseEnemy {
  constructor(x, y) {
    super(x, y, { hp: 90, speed: 2.5, detectRange: 380, attackRange: 220 });
    this.baseY = y;
    this.floatTime = 0;
    this.saltProjectiles = [];
  }

  update(dt, player, vfxManager) {
    if (this.hp <= 0 || this.updateStatus(dt)) return;
    this.floatTime += dt * 3;
    this.y = this.baseY + Math.sin(this.floatTime) * 10;
    const dist = this.getDistanceTo(player);

    switch (this.state) {
      case "patrol":
        if (dist < this.detectRange) this.state = "chase";
        break;
      case "chase":
        this.facePlayer(player);
        if (dist > this.attackRange) this.x += this.facing * this.speed;
        else if (dist < 100) this.x -= this.facing * (this.speed * 0.7);
        else {
          this.state = "telegraph";
          this.stateTimer = 0.6;
          if (vfxManager) vfxManager.spawn("salt_shimmer", this.x, this.y);
        }
        break;
      case "telegraph":
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          this.state = "attack";
          this.stateTimer = 0.3;
          this.throwBlindingSalt(player);
        }
        break;
      case "attack":
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          this.state = "recover";
          this.stateTimer = 1.2;
        }
        break;
      case "recover":
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) this.state = "chase";
        break;
    }
    this.updateSaltProjectiles(dt, player);
  }

  throwBlindingSalt(player) {
    const angle = Math.atan2(player.y - this.y, player.x - this.x);
    [-0.15, 0, 0.15].forEach(offset => {
      this.saltProjectiles.push({
        x: this.x, y: this.y,
        vx: Math.cos(angle + offset) * 6,
        vy: Math.sin(angle + offset) * 6,
        life: 1.5
      });
    });
  }

  updateSaltProjectiles(dt, player) {
    this.saltProjectiles = this.saltProjectiles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if (Math.hypot(p.x - player.x, p.y - player.y) < 28) {
        player.takeDamage(10);
        player.applyBlindEffect(2.5);
        return false;
      }
      return p.life > 0;
    });
  }
}

export class PossessedTrafficEnforcer extends BaseEnemy {
  constructor(x, y) {
    super(x, y, { hp: 110, speed: 2.2, detectRange: 300, attackRange: 130 });
    this.danceBeat = 0;
    this.isBlocking = false;
  }

  update(dt, player, vfxManager) {
    if (this.hp <= 0 || this.updateStatus(dt)) return;
    this.danceBeat += dt * 6;
    const dist = this.getDistanceTo(player);

    switch (this.state) {
      case "patrol":
        this.x += Math.sin(this.danceBeat) * 1.2;
        if (dist < this.detectRange) this.state = "chase";
        break;
      case "chase":
        this.facePlayer(player);
        this.x += this.facing * this.speed;
        if (dist <= this.attackRange) {
          this.state = "telegraph";
          this.stateTimer = 0.5;
          this.isBlocking = true;
          if (vfxManager) vfxManager.spawn("whistle_wave", this.x, this.y - 40);
        }
        break;
      case "telegraph":
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          this.isBlocking = false;
          this.state = "attack";
          this.stateTimer = 0.35;
        }
        break;
      case "attack":
        this.x += this.facing * 7.5;
        this.stateTimer -= dt;
        if (Math.abs(player.x - this.x) < 55 || this.stateTimer <= 0) {
          if (Math.abs(player.x - this.x) < 55) player.takeDamage(18);
          this.state = "recover";
          this.stateTimer = 0.7;
        }
        break;
      case "recover":
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) this.state = "chase";
        break;
    }
  }

  takeDamage(amount, ammoEffect) {
    if (this.isBlocking && ammoEffect === "none") return;
    super.takeDamage(amount, ammoEffect);
  }
}

export function drawEnemyTelegraph(ctx, enemy) {
  if (enemy.state !== "telegraph") return;
  ctx.save();
  ctx.fillStyle = "#ff3b30";
  ctx.font = "bold 24px sans-serif";
  ctx.fillText("!", enemy.x, enemy.y - enemy.height - 12);
  ctx.restore();
}
