class Events {

  constructor(defaultBindTarget) {
    this.defaultBindTarget = defaultBindTarget || document.body;
    this.events = {};
    this.availableHandles = [];

    return this;
  }

  _addListener(type, selector) {
    const bindTarget = typeof(selector) === 'string' ? this.defaultBindTarget : selector;
    bindTarget.addEventListener(type, this._handleEvent.bind(this, type));
  }

  _handleEvent(type, event) {
    const eventTarget = event.target;

    this.events[type].forEach(ev => {
      const target = typeof(ev.selector) === 'string' ? eventTarget.closest(ev.selector) : ev.selector;

      if (target) {
        ev.func(event, target);
      }
    });
  }

  /**
   * Add an event listener
   *
   * @param {String} type The event type (click, change, keyup etc.)
   * @param {String|Element} selector CSS Selector or element to trigger the event
   * @param {Function} func The function to trigger
   */
  addEvent(type, selector, func) {
    if (!this.events[type]) {
      this.events[type] = [];
    }

    this.events[type].push({
      selector: selector,
      func: func
    });

    if (!this.availableHandles.includes(type)) {
      this._addListener(type, selector);
      this.availableHandles.push(type);
    }
  }

  addEvents(eventTypes) {
    /**
     * Add events by type
     *
     * @param {{eventType: {selector: Function}}} eventTypes
     */
    Object.keys(eventTypes).forEach(type => {
      Object.keys(eventTypes[type]).forEach(selector => {
        this.addEvent(type, selector, eventTypes[type][selector]);
      });
    });
  }
}

export default Events;