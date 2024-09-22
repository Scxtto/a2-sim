class Food {
  constructor(id, x, y, energyContent) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.size = 3;
    this.energyContent = energyContent;
    this.consumed = false;
    this.type = "plant";
    this.duration = 500;
  }

  update() {
    this.duration -= 1;
    if (this.duration <= 0) {
      this.consumed = true;
      this.energyContent = 0;
    }
  }

  getState() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      size: this.size,
      energyContent: this.energyContent,
    };
  }

  // Removed draw method as it's not needed on the server-side
}

module.exports = Food;
