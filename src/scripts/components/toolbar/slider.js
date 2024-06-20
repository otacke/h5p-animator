import Util from '@services/util.js';
import TimeUtil from '@services/time-util.js';
import './slider.scss';

export default class Slider {

  constructor(params = {}, callbacks = {}) {
    this.params = Util.extend({
      maxValue: 100
    }, params);

    this.callbacks = Util.extend({
      onSliderStarted: () => {},
      onSliderSeeked: () => {},
      onSliderEnded: () => {}
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

    this.slider.addEventListener('keydown', (event) => {
      // Speed up slightly when holding down arrow keys
      const timeDeltaS = Math.max(1, Math.log(this.keydownTime + 1));

      if (event.key === 'ArrowLeft') {
        this.setValue(Math.max(0, this.getValue() - timeDeltaS));
      }
      else if (event.key === 'ArrowRight') {
        this.setValue(
          Math.min(this.getValue() + timeDeltaS, this.params.maxValue)
        );
      }
      this.keydownTime ++;
    });

    this.slider.addEventListener('input', (event) => {
      this.handleSliderSeeked(parseFloat(this.slider.value));
    });

    ['keyup', 'mouseup', 'touchend'].forEach((eventType) => {
      this.slider.addEventListener(eventType, (event) => {
        this.handleSliderEnded();
      });
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

    this.slider.value = Math.max(0, Math.min(this.params.maxValue, value));
    this.slider.setAttribute('aria-valuenow', value);
    this.slider.setAttribute(
      'aria-valuetext',
      TimeUtil.toHumanTime(value, { timeLabels: this.params.timeLabels })
    );

    const percentage = (value / this.params.maxValue) * 100;

    this.slider.style.background =
      `linear-gradient(to right, var(--color-primary-dark-80) ${percentage}%, var(--color-primary-15) ${percentage}%)`;
  }

  /**
   * Handle slider started.
   * @param {Event} event Event.
   */
  handleSliderStarted(event) {
    if (event instanceof KeyboardEvent) {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.code)) {
        return;
      }
      else {
        this.handleSliderSeeked(parseFloat(this.slider.value));
        event.preventDefault();
      }
    }

    this.callbacks.onSliderStarted();
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
