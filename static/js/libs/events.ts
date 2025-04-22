interface EventHandler {
  (event: Event, target: HTMLElement): void;
}

interface SelectChangeHandler {
  (event: Event, target: HTMLSelectElement): void;
}

type ValidEventTypes = "change" | "click" | "keyup" | "resize";

type EventHandlerMap = {
  change: SelectChangeHandler;
  click: EventHandler;
  keyup: EventHandler;
  resize: EventHandler;
};

interface EventRegistration<T extends ValidEventTypes> {
  selector: HTMLElement | string;
  func: EventHandlerMap[T];
}

class Events {
  events: Partial<{
    [T in ValidEventTypes]: EventRegistration<T>[];
  }> = {};
  availableHandles: ValidEventTypes[];
  defaultBindTarget: ParentNode;

  constructor(defaultBindTarget: ParentNode | null | undefined) {
    this.defaultBindTarget = defaultBindTarget || document.body;
    this.events = {};
    this.availableHandles = [];
    return this;
  }

  _addListener(
    type: ValidEventTypes,
    selector: HTMLElement | HTMLSelectElement | string | Window,
  ): void {
    const bindTarget =
      typeof selector === "string" ? this.defaultBindTarget : selector;
    bindTarget.addEventListener(type, (e) => {
      this._handleEvent(type, e);
    });
  }

  _handleEvent(type: ValidEventTypes, event: Event): void {
    const eventTarget = event.target as HTMLElement | HTMLSelectElement;
    const eventRegistrations = this.events[type];

    if (!eventRegistrations) return;

    eventRegistrations.forEach((ev) => {
      const target =
        typeof ev.selector === "string"
          ? eventTarget.closest(ev.selector)
          : ev.selector;

      if (target) {
        if (type === "change" && target instanceof HTMLSelectElement) {
          (ev.func as SelectChangeHandler)(event, target);
        } else if (target instanceof HTMLElement) {
          (ev.func as EventHandler)(event, target);
        }
      }
    });
  }

  addEvent<T extends ValidEventTypes>(
    type: T,
    selector: HTMLElement | HTMLSelectElement | string,
    func: EventHandlerMap[T],
  ): void {
    if (!this.events[type]) {
      this.events[type] = [];
    }

    const eventArray = this.events[type];
    if (eventArray) {
      eventArray.push({
        selector: selector as HTMLElement | string,
        func,
      });
    }

    if (!this.availableHandles.includes(type)) {
      this._addListener(type, selector);
      this.availableHandles.push(type);
    }
  }

  addWindowEvent(type: ValidEventTypes, func: EventHandler): void {
    window.addEventListener(type, (event) => {
      func(event, window as unknown as HTMLElement);
    });
  }

  addEvents(
    eventTypes: Partial<{
      [T in ValidEventTypes]: Record<string, EventHandlerMap[T]>;
    }>,
  ): void {
    (Object.keys(eventTypes) as ValidEventTypes[]).forEach((type) => {
      const handlers = eventTypes[type];

      if (handlers) {
        Object.keys(handlers).forEach((selector) => {
          const handler = handlers[selector];
          this.addEvent(type, selector, handler);
        });
      }
    });
  }
}

export default Events;
