class Mouse {
  position: { x: number; y: number };
  constructor() {
    this.position = { x: 0, y: 0 };

    window.addEventListener("mousemove", this.updatePosition.bind(this));
  }

  updatePosition(e: { x: any; y: any }) {
    this.position = {
      x: e.x,
      y: e.y,
    };
  }
}

const mouse = new Mouse();

export default mouse;
