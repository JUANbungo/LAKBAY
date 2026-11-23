// Small Pets Companion System
export class SmallPet {
  constructor(type, hero) {
    this.type = type; // "aspin" | "maya" | "tarsier"
    this.hero = hero;
    this.x = hero.x - 40;
    this.y = hero.y;
    this.followDistance = 45;
    this.speed = 4.5;
    this.pickupRadius = 80;
  }

  update(dt, collectibles = []) {
    const targetX = this.hero.x - (this.hero.facing * this.followDistance);
    const targetY = this.type === "maya" ? this.hero.y - 50 : this.hero.y;

    this.x += (targetX - this.x) * this.speed * dt;
    this.y += (targetY - this.y) * this.speed * dt;

    for (const item of collectibles) {
      const dist = Math.hypot(item.x - this.x, item.y - this.y);
      if (!item.collected && dist < this.pickupRadius) {
        item.collected = true;
        if (this.hero.addScore) {
          this.hero.addScore(item.type === "agimat" ? 50 : 10);
        }
      }
    }
  }
}
