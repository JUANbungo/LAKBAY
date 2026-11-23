// Town Background Manager - All 12 Bataan Towns
export const BATAAN_TOWNS = [
  { id: "dinalupihan", name: "Dinalupihan", bg: "assets/backgrounds/01_dinalupihan.png", checkpoint: "Welcome to Dinalupihan" },
  { id: "hermosa",     name: "Hermosa",     bg: "assets/backgrounds/02_hermosa.png",     checkpoint: "Welcome to Hermosa" },
  { id: "orani",       name: "Orani",       bg: "assets/backgrounds/03_orani.png",       checkpoint: "Welcome to Orani" },
  { id: "samal",       name: "Samal",       bg: "assets/backgrounds/04_samal.png",       checkpoint: "Welcome to Samal" },
  { id: "abucay",      name: "Abucay",      bg: "assets/backgrounds/05_abucay.png",      checkpoint: "Welcome to Abucay" },
  { id: "balanga",     name: "Balanga City",bg: "assets/backgrounds/06_balanga_city.png",checkpoint: "Welcome to Balanga City" },
  { id: "pilar",       name: "Pilar",       bg: "assets/backgrounds/07_pilar.png",       checkpoint: "Welcome to Pilar (Mt. Samat)" },
  { id: "orion",       name: "Orion",       bg: "assets/backgrounds/08_orion.png",       checkpoint: "Welcome to Orion" },
  { id: "limay",       name: "Limay",       bg: "assets/backgrounds/09_limay.png",       checkpoint: "Welcome to Limay" },
  { id: "mariveles",   name: "Mariveles",   bg: "assets/backgrounds/10_mariveles.png",   checkpoint: "Welcome to Mariveles" },
  { id: "bagac",       name: "Bagac",       bg: "assets/backgrounds/11_bagac.png",       checkpoint: "Welcome to Bagac" },
  { id: "morong",      name: "Morong",      bg: "assets/backgrounds/12_morong.png",      checkpoint: "Welcome to Morong" }
];

export class TownBackgroundManager {
  constructor() {
    this.currentIndex = 0;
    this.images = {};
    this.fadeAlpha = 0;
    this.isTransitioning = false;
    this.nextIndex = 0;
    this.bannerTimer = 0;

    // Preload all 12 town backgrounds
    BATAAN_TOWNS.forEach(town => {
      const img = new Image();
      img.src = town.bg;
      this.images[town.id] = img;
    });
  }

  get currentTown() {
    return BATAAN_TOWNS[this.currentIndex];
  }

  switchTown(index) {
    if (index < 0 || index >= BATAAN_TOWNS.length || index === this.currentIndex) return;
    this.nextIndex = index;
    this.isTransitioning = true;
    this.fadeAlpha = 0;
  }

  nextTown() {
    const next = (this.currentIndex + 1) % BATAAN_TOWNS.length;
    this.switchTown(next);
  }

  prevTown() {
    const prev = (this.currentIndex - 1 + BATAAN_TOWNS.length) % BATAAN_TOWNS.length;
    this.switchTown(prev);
  }

  update(dt) {
    if (this.bannerTimer > 0) this.bannerTimer -= dt;

    if (this.isTransitioning) {
      this.fadeAlpha += dt * 2.5;
      if (this.fadeAlpha >= 1) {
        this.currentIndex = this.nextIndex;
        this.isTransitioning = false;
        this.bannerTimer = 2.5; // Show checkpoint banner
      }
    } else if (this.fadeAlpha > 0) {
      this.fadeAlpha = Math.max(0, this.fadeAlpha - dt * 2.5);
    }
  }

  draw(ctx, canvasWidth, canvasHeight) {
    const town = this.currentTown;
    const img = this.images[town.id];

    if (img && img.complete) {
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
    } else {
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // Smooth fade transition overlay
    if (this.fadeAlpha > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${this.fadeAlpha})`;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // Checkpoint Banner
    if (this.bannerTimer > 0) {
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(canvasWidth / 2 - 200, 20, 400, 44);
      ctx.fillStyle = "#ffd700";
      ctx.font = "bold 20px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(town.checkpoint, canvasWidth / 2, 48);
      ctx.restore();
    }
  }
}
