import Util from '@services/util.js';
import { toHumanTime } from '@services/time-util.js';
import './slider.scss';

export default class Slider {

  constructor(params = {}, callbacks = {}) {
    this.params = Util.extend({
      maxValue: 100
    }, params);

    this.callbacks = Util.extend({
      onSliderStarted: () => {},
      onSliderSeeked: () => {},
      onSliderEnded: () => {},
      onFocus: () => {},
      onBlur: () => {}
    }, callbacks);

    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-animator-slider-container');

    this.slider = document.createElement('input');
    this.slider.classList.add('h5p-animator-slider');
    this.slider.setAttribute('type', 'range');
    this.slider.setAttribute('min', '0');
    this.slider.setAttribute('aria-valuemin', '0');
    this.slider.setAttribute('max', `${this.params.maxValue}`);
    this.slider.setAttribute('aria-valuemax', `${this.params.maxValue}`);
    this.slider.setAttribute('step', '0.025');
    this.slider.setAttribute('aria-label', this.params.ariaLabel);

    ['keydown', 'mousedown', 'touchstart'].forEach((eventType) => {
      this.slider.addEventListener(eventType, (event) => {
        this.handleSliderStarted(event);
      });
    });

    this.slider.addEventListener('input', (event) => {
      this.handleSliderSeeked(parseFloat(this.slider.value));
    });

    ['keyup', 'mouseup', 'touchend'].forEach((eventType) => {
      this.slider.addEventListener(eventType, (event) => {
        this.handleSliderEnded();
      });
    });

    this.slider.addEventListener('focus', () => {
      this.callbacks.onFocus();
    });

    this.slider.addEventListener('blur', () => {
      this.callbacks.onBlur();
    });

    this.dom.append(this.slider);

    this.setValue(0);
  }

  /**
   * Get slider DOM.
   * @returns {HTMLElement} Slider DOM.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Enable slider.
   */
  enable() {
    this.slider.removeAttribute('disabled');
  }

  /**
   * Disable slider.
   */
  disable() {
    this.slider.setAttribute('disabled', '');
  }

  /**
   * Get value.
   * @returns {number} Value.
   */
  getValue() {
    return parseFloat(this.slider.value);
  }

  /**
   * Set slider to position.
   * @param {number} value Position to set slider to.
   */
  setValue(value) {
    if (typeof value !== 'number') {
      return;
    }

    this.slider.value = Math.max(0, Math.min(value, this.params.maxValue));
    this.slider.setAttribute('aria-valuenow', value);
    this.slider.setAttribute(
      'aria-valuetext',
      toHumanTime(value, { timeLabels: this.params.timeLabels })
    );

    // eslint-disable-next-line no-magic-numbers
    const percentage = (value / this.params.maxValue) * 100;

    this.slider.style.background =
      `linear-gradient(to right, var(--color-primary-dark-80) ${percentage}%, var(--color-primary-15) ${percentage}%)`;
  }

  /**
   * Handle keyboard event.
   * @param {KeyboardEvent} event Keyboard event.
   * @returns {boolean} True if key was handled, false otherwise.
   */
  handleKeyboardEvent(event) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.code)) {
      return false;
    }

    // Speed up slightly when holding down keys (only relevant for left/right keys).
    const timeDeltaS = Math.max(1, Math.log(this.keydownTime + 1));

    if (event.code === 'ArrowLeft') {
      this.setValue(this.getValue() - timeDeltaS);
    }
    else if (event.code === 'ArrowRight') {
      this.setValue(this.getValue() + timeDeltaS);
    }
    else if (event.code === 'Home') {
      this.setValue(0);
    }
    else if (event.code === 'End') {
      this.setValue(this.params.maxValue);
    }

    this.keydownTime ++;

    this.handleSliderSeeked(parseFloat(this.slider.value));
    event.preventDefault();

    return true;
  }

  /**
   * Handle slider started.
   * @param {Event} event Event.
   */
  handleSliderStarted(event) {
    if (event instanceof KeyboardEvent) {
      const wasKeyHandled = this.handleKeyboardEvent(event);
      if (wasKeyHandled) {
        this.callbacks.onSliderStarted();
      }
    }
    else {
      this.callbacks.onSliderStarted();
    }
  }

  /**
   * Handle slider seeked.
   * @param {number} time Time.
   */
  handleSliderSeeked(time) {
    const currentTime = time;
    this.callbacks.onSliderSeeked(currentTime);
    this.setValue(currentTime);
  }

  /**
   * Handle slider ended.
   */
  handleSliderEnded() {
    this.keydownTime = 0;
    this.callbacks.onSliderEnded();
  }
}
