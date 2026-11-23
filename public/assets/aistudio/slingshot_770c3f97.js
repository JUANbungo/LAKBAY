// Tirador (Slingshot) Weapon System
export const AMMO_TYPES = {
  river_pebble: {
    name: "River Pebble",
    damage: 15,
    speed: 12,
    effect: "none",
    vfxColor: "#8c92ac"
  },
  agimat_stone: {
    name: "Agimat Stone",
    damage: 30,
    speed: 14,
    effect: "stun",
    vfxColor: "#ffd700"
  },
  sili_bomb: {
    name: "Sili Bomb",
    damage: 25,
    speed: 10,
    effect: "burn_aoe",
    vfxColor: "#ff3b30"
  }
};

export class Slingshot {
  constructor(hero) {
    this.hero = hero;
    this.currentAmmo = "river_pebble";
    this.state = "idle"; // idle | aiming | firing | recoil
    this.chargePower = 0;
    this.maxCharge = 1.0;
    this.projectiles = [];
  }

  switchAmmo(ammoKey) {
    if (AMMO_TYPES[ammoKey]) this.currentAmmo = ammoKey;
  }

  startAim() {
    this.state = "aiming";
    this.chargePower = 0.2;
    this.hero.setAnim("tirador_aim");
  }

  updateAim(dt) {
    if (this.state === "aiming") {
      this.chargePower = Math.min(this.maxCharge, this.chargePower + dt * 1.2);
    }
  }

  releaseFire(angle) {
    if (this.state !== "aiming") return;
    const ammo = AMMO_TYPES[this.currentAmmo];

    this.state = "firing";
    this.hero.setAnim("tirador_fire");

    this.projectiles.push({
      x: this.hero.x + 20,
      y: this.hero.y - 15,
      vx: Math.cos(angle) * ammo.speed * this.chargePower,
      vy: Math.sin(angle) * ammo.speed * this.chargePower,
      ammo,
      active: true
    });

    setTimeout(() => {
      this.state = "recoil";
      this.hero.setAnim("tirador_recoil");
      setTimeout(() => (this.state = "idle"), 150);
    }, 100);
  }
}
