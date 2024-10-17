interface EventHandler {
  (event: Event, target: HTMLElement): void;
}

interface EventRegistration {
  selector: string | HTMLElement;
  func: EventHandler;
}

class Events {
  events: Record<string, EventRegistration[]>;
  availableHandles: string[];
  defaultBindTarget: ParentNode;

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

    if (!this.events[type]) return;

    this.events[type].forEach((ev: EventRegistration) => {
      const target =
        typeof ev.selector === "string"
          ? eventTarget.closest(ev.selector)
          : ev.selector;

      if (target) {
        ev.func(event, target as HTMLElement);
      }
    });
  }

  addEvent(type: string, selector: string | HTMLElement, func: EventHandler) {
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

  addWindowEvent(type: string, func: EventHandler) {
    window.addEventListener(type, (event) => {
      func(event, window as unknown as HTMLElement);
    });
  }

  addEvents(eventTypes: { [key: string]: { [key: string]: EventHandler } }) {
    Object.keys(eventTypes).forEach((type) => {
      Object.keys(eventTypes[type]).forEach((selector) => {
        this.addEvent(type, selector, eventTypes[type][selector]);
      });
    });
  }
}

export default Events;
