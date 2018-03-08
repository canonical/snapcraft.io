class Mouse {
  constructor() {
    this.position = { x: 0, y: 0 };

    window.addEventListener('mousemove', this.updatePosition.bind(this));
  }

  updatePosition(e) {
    this.position = {
      x: e.x,
      y: e.y
    };
  }
}

const mouse = new Mouse();

export default mouse;