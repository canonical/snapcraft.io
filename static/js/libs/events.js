const Events = {
  constructor: function() {
    this.events = {};
    this.availableHandles = [];

    return this;
  },

  _addListener: function(type, bindWindow) {
    const bindTarget = bindWindow ? window : document.body;
    bindTarget.addEventListener(type, this._handleEvent.bind(this, type));
  },

  _handleEvent: function(type, event) {
    const eventTarget = event.target;

    this.events[type].forEach(ev => {
      // A bit hacky but this allows using the same api to bind to window for key, resize and scroll events
      const target = ev.selector === 'window' ? window : eventTarget.closest(ev.selector);

      if (target) {
        ev.func(target, event);
      }
    });
  },

  /**
   * Add an event listener
   *
   * @param {String} type The event type (click, change, keyup etc.)
   * @param {String} selector CSS Selector to trigger the event
   * @param {Function} func The function to trigger
   */
  addEvent: function(type, selector, func) {
    if (!this.events[type]) {
      this.events[type] = [];
    }

    this.events[type].push({
      selector: selector,
      func: func
    });

    if (!this.availableHandles.includes(type)) {
      this._addListener(type, selector === 'window');
      this.availableHandles.push(type);
    }
  },

  /**
   * Add events by type
   *
   * @param {Array.<{eventType: {selector: Function}}>} types
   */
  addEvents: function(types) {
    Object.keys(types).forEach(type => {
      Object.keys(types[type]).forEach(selector => {
        this.addEvent(type, selector, types[type][selector]);
      });
    });
  }
};

export default Events.constructor();