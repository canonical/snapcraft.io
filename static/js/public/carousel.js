/* Carousel class */
class Carousel {
  /**
   * Create a carousel instance with a provided 'holder'
   *
   * Required html format:
   * <div class="p-carousel">
   *   <div class="p-carousel__mask">
   *     <div class="p-carousel__scroller">
   *       <div class="p-carousel__item">
   *         ...
   *       </div>
   *       ...
   *     </div>
   *   </div>
   *   <button class="p-carousel__next">Next</button>
   *   <button class="p-carousel__prev">Previous</button>
   * </div>
   *
   * @param {HTMLElement|string} holder HTMLElement or selector string for the 'p-carousel' element
   */
  constructor(holder) {
    if (typeof holder === undefined) {
      throw new Error('Holder not defined');
    }

    if (typeof holder === 'string') {
      this.holder = document.querySelector(holder);
    } else {
      this.holder = holder;
    }

    this.scroller = this.holder.querySelector('.p-carousel__scroller');
    this.items = this.holder.querySelectorAll('.p-carousel__item');
    this.nextButton = this.holder.querySelector('.p-carousel__next');
    this.prevButton = this.holder.querySelector('.p-carousel__prev');

    this.currentIndex = 0;

    const itemWidth = this.getItemWidth();

    this.scrollerWidth = (itemWidth) * this.items.length;

    this.scroller.style.width = `${this.scrollerWidth}px`;

    if (this.nextButton) {
      this.nextButton.addEventListener('click', this.next.bind(this));
    }
    if (this.prevButton) {
      this.prevButton.addEventListener('click', this.previous.bind(this));
    }
  }

  /**
   * Get the width of an item
   *
   * @returns {number}
   */
  getItemWidth() {
    return this.items[0].scrollWidth;
  }

  /**
   * Set the number of visible items
   *
   * @returns {number}
   */
  getNumberOfVisibleItems() {
    return Math.floor(this.holder.scrollWidth / this.getItemWidth());
  }

  /**
   * Move to the previous item, unless at the start
   *
   * @param event
   * @returns {number}
   */
  previous(event) {
    if (event) {
      event.preventDefault();
    }

    const visibleItems = this.getNumberOfVisibleItems();

    if (this.currentIndex - visibleItems >= 0) {
      return this._goto(this.currentIndex - visibleItems);
    }

    return this.currentIndex;
  }

  /**
   * Move to the next item, unless the last one is visible
   *
   * @param event
   * @returns {number}
   */
  next(event) {
    if (event) {
      event.preventDefault();
    }

    const visibleItems = this.getNumberOfVisibleItems();

    if (this.currentIndex <= this.items.length - visibleItems) {
      return this._goto(this.currentIndex + visibleItems);
    }

    return this.currentIndex;
  }

  /**
   * Move to a specific items index. Specifically, to the left hand side
   * of the carousel, using the transform: translateX CSS property.
   *
   * No checks are performed.
   *
   * This method should be considered 'private', use the 'previous' or 'next'
   * methods instead.
   *
   * @param index
   * @returns {number}
   */
  _goto(index) {
    // Do some movement
    this.currentIndex = index;
    this.scroller.style.transform = `translateX(-${this.items[this.currentIndex].offsetLeft}px)`;

    this.updateButtons();
    return this.currentIndex;
  }

  /**
   * Update the state of the previous and next buttons, based on the current
   * index
   */
  updateButtons() {
    const visibleItems = this.getNumberOfVisibleItems();

    if (this.currentIndex >= this.items.length - visibleItems) {
      this.nextButton.setAttribute('disabled', 'disabled');
    } else {
      this.nextButton.removeAttribute('disabled');
    }

    if (this.currentIndex <= 0) {
      this.prevButton.setAttribute('disabled', 'disabled');
    } else {
      this.prevButton.removeAttribute('disabled');
    }
  }
}


export default Carousel;
