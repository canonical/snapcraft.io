class Mouse {
  position: { x: number; y: number };
  constructor() {
    this.position = { x: 0, y: 0 };

    window.addEventListener("mousemove", this.updatePosition.bind(this));
  }

  updatePosition(e: MouseEvent) {
    this.position = {
      x: e.clientX,
      y: e.clientY,
    };
  }
}

const mouse = new Mouse();

export default mouse;
