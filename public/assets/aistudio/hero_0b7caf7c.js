// Hero Animation Controller, Footwear & VFX
export class Hero {
  constructor(customization = {}) {
    this.x = 120;
    this.y = 420;
    this.vx = 0;
    this.hp = 100;
    this.score = 0;
    this.facing = 1;

    this.hairStyle = customization.hairStyle || "clean_cut";
    this.outfit = customization.outfit || "barong";
    this.footwear = customization.footwear || "tsinelas";

    this.isRidingBike = false;
    this.currentAnim = "idle";
    this.blindTimer = 0;
    this.vfxQueue = [];
  }

  setAnim(name) {
    if (name === "run") {
      this.currentAnim = this.footwear === "tsinelas" ? "run_tsinelas" : "run_sapatos";
    } else {
      this.currentAnim = name;
    }
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
  }

  applyBlindEffect(duration) {
    this.blindTimer = duration;
  }

  addScore(points) {
    this.score += points;
  }

  updateMovement(input, isInWater = false) {
    const prevVx = this.vx;
    const speed = this.isRidingBike ? 9 : (this.footwear === "sapatos" ? 5.5 : 4.5);

    if (input.right) { this.vx = speed; this.facing = 1; this.setAnim(this.isRidingBike ? "bike_ride" : "run"); }
    else if (input.left) { this.vx = -speed; this.facing = -1; this.setAnim(this.isRidingBike ? "bike_ride" : "run"); }
    else { this.vx = 0; this.setAnim("idle"); }

    this.x += this.vx;

    if (Math.abs(this.vx) > 0) {
      if (isInWater) this.spawnVFX("water_splash", this.x, this.y);
      else this.spawnVFX("dust", this.x, this.y);
    }

    if (this.isRidingBike && Math.abs(prevVx) > 6 && this.vx === 0) {
      this.spawnVFX("bike_skid_mark", this.x, this.y);
    }
  }

  spawnVFX(type, x, y) {
    this.vfxQueue.push({ type, x, y, life: 0.4 });
  }
}
