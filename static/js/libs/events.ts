class Events {
  events: any;
  availableHandles: any;
  defaultBindTarget: any;
  constructor(defaultBindTarget: ParentNode | null | undefined) {
    this.defaultBindTarget = defaultBindTarget || document.body;
    this.events = {};
    this.availableHandles = [];

    return this;
  }

  _addListener(type: string, selector: string | HTMLElement | Window) {
    const bindTarget =
      typeof selector === "string" ? this.defaultBindTarget : selector;
    bindTarget.addEventListener(type, this._handleEvent.bind(this, type));
  }

  _handleEvent(type: string, event: Event) {
    const eventTarget = event.target as HTMLElement;

    this.events[type].forEach(
      (ev: {
        selector: string;
        func: (ar1: unknown, arg2: unknown) => void;
      }) => {
        const target =
          typeof ev.selector === "string"
            ? eventTarget.closest(ev.selector)
            : ev.selector;

        if (target) {
          ev.func(event, target);
        }
      },
    );
  }

  addEvent(
    type: string,
    selector: string | HTMLElement | Window,
    func: unknown
  ) {
    if (!this.events[type]) {
      this.events[type] = [];
    }

    this.events[type].push({
      selector: selector,
      func: func,
    });

    if (!this.availableHandles.includes(type)) {
      this._addListener(type, selector);
      this.availableHandles.push(type);
    }
  }

  addEvents(eventTypes: { [key: string]: { [key: string]: unknown } }) {
    Object.keys(eventTypes).forEach((type) => {
      Object.keys(eventTypes[type]).forEach((selector) => {
        this.addEvent(type, selector, eventTypes[type][selector]);
      });
    });
  }
}

export default Events;
