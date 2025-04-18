import ToolbarButton from './toolbar-button.js';
import Slider from './slider.js';
import TimeDisplay from './time-display.js';
import Util from '@services/util.js';
import './toolbar.scss';

/** @constant {number} BREAKPOINT_HIDE_TIME_DISPLAY Breakpoint to hide time display */
const BREAKPOINT_HIDE_TIME_DISPLAY = 320;

/** @constant {number} DEFAULT_DISPLAY_TIME_MS Default display time */
const DEFAULT_DISPLAY_TIME_MS = 3000;

/** Class representing the button bar */
export default class Toolbar {

  /**
   * @class
   * @param {object} [params] Parameters.
   * @param {object[]} [params.buttons] Button parameters.
   * @param {object} [callbacks] Callbacks.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = Util.extend({
      buttons: [],
      classes: []
    }, params);

    this.callbacks = Util.extend({
      onSliderStarted: () => {},
      onSliderSeeked: () => {},
      onSliderEnded: () => {},
      onPlayClicked: () => {},
      onFullscreenClicked: () => {}
    }, callbacks);

    this.buttons = {};

    // Build DOM
    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-animator-toolbar-tool-bar');

    this.buttons.play = new ToolbarButton(
      {
        id: 'play',
        classes: ['toolbar-button', 'toolbar-button-play'],
        type: 'toggle',
        a11y: {
          active: params.dictionary.get('a11y.pause'),
          inactive: params.dictionary.get('a11y.play')
        }
      },
      {
        onClick: () => {
          this.callbacks.onPlayClicked();
        },
        onFocus: () => {
          this.handleChildGotFocus();
        },
        onBlur: () => {
          this.handleChildLostFocus();
        }
      }
    );

    this.dom.append(this.buttons.play.getDOM());

    this.slider = new Slider(
      {
        maxValue: this.params.maxTime,
        ariaLabel: this.params.dictionary.get('a11y.timeSlider'),
        timeLabels: {
          hours: this.params.dictionary.get('a11y.hours'),
          hour: this.params.dictionary.get('a11y.hour'),
          minutes: this.params.dictionary.get('a11y.minutes'),
          minute: this.params.dictionary.get('a11y.minute'),
          seconds: this.params.dictionary.get('a11y.seconds'),
          second: this.params.dictionary.get('a11y.second'),
          humanTimePattern: this.params.dictionary.get('a11y.humanTimePattern')
        }
      },
      {
        onSliderStarted: () => {
          this.callbacks.onSliderStarted();
        },
        onSliderSeeked: (value) => {
          this.callbacks.onSliderSeeked(value);
        },
        onSliderEnded: () => {
          this.callbacks.onSliderEnded();
        },
        onFocus: () => {
          this.handleChildGotFocus();
        },
        onBlur: () => {
          this.handleChildLostFocus();
        }
      }
    );
    this.dom.append(this.slider.getDOM());

    this.timeDisplay = new TimeDisplay({ maxTime: this.params.maxTime });
    this.dom.append(this.timeDisplay.getDOM());

    if (this.params.globals.get('isFullscreenSupported')) {
      this.buttons.fullscreen = new ToolbarButton(
        {
          id: 'fullscreen',
          classes: ['toolbar-button', 'toolbar-button-fullscreen'],
          type: 'pulse',
          pulseStates: [
            {
              id: 'enter-fullscreen',
              label: this.params.dictionary.get('a11y.enterFullscreen')
            },
            {
              id: 'exit-fullscreen',
              label: this.params.dictionary.get('a11y.exitFullscreen')
            }
          ]
        },
        {
          onClick: () => {
            this.callbacks.onFullscreenClicked();
          },
          onFocus: () => {
            this.handleChildGotFocus();
          },
          onBlur: () => {
            this.handleChildLostFocus();
          }
        }
      );
      this.dom.append(this.buttons.fullscreen.getDOM());
    }

    // Once visible, show toolbar for 3 seconds before hiding
    if (this.params.hideControls) {
      this.dom.classList.add('absolute');

      // iOS is behind ... Again ...
      const idleCallback = window.requestIdleCallback ?? window.requestAnimationFrame;
      idleCallback(() => {
        // Get started once visible and ready
        const observer = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting) {
            observer.unobserve(this.dom);
            observer.disconnect();

            this.displayTemporarily();
          }
        }, { threshold: 0 });
        observer.observe(this.dom);
      });
    };
  }

  /**
   * Return the DOM for this class.
   * @returns {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Get full height.
   * @returns {number} Full height in px.
   */
  getFullHeight() {
    const styles = window.getComputedStyle(this.dom);
    const margin = parseFloat(styles.getPropertyValue('margin-top')) +
      parseFloat(styles.getPropertyValue('margin-bottom'));

    return Math.ceil(this.dom.offsetHeight + margin);
  }

  /**
   * Force button state.
   * @param {string} id Button id.
   * @param {boolean|number} active If true, toggle active, else inactive.
   * @param {object} [options] Options.
   */
  forceButton(id = '', active, options = {}) {
    if (!this.buttons[id]) {
      return; // Button not available
    }

    this.buttons[id].force(active, options);
  }

  /**
   * Enable button.
   * @param {string} id Button id.
   */
  enableButton(id = '') {
    if (!this.buttons[id]) {
      return; // Button not available
    }

    this.buttons[id].enable();
  }

  /**
   * Disable button.
   * @param {string} id Button id.
   */
  disableButton(id = '') {
    if (!this.buttons[id]) {
      return; // Button not available
    }

    this.buttons[id].disable();
  }

  /**
   * Enable slider.
   */
  enableSlider() {
    this.slider.enable();
  }

  /**
   * Disable slider.
   */
  disableSlider() {
    this.slider.disable();
  }

  /**
   * Show.
   */
  show() {
    this.dom.classList.remove('display-none');
  }

  /**
   * Hide.
   */
  hide() {
    this.dom.classList.add('display-none');
  }

  /**
   * Display toolbar temporarily, then turn transparent.
   * @param {number} [durationMs] Duration for showing.
   */
  displayTemporarily(durationMs = DEFAULT_DISPLAY_TIME_MS) {
    this.dom.classList.remove('transparent');

    window.clearTimeout(this.hideToolbarTimeout);
    this.hideToolbarTimeout = window.setTimeout(() => {
      this.dom.classList.add('transparent');
    }, durationMs);
  }

  /**
   * Get slider value.
   * @returns {number} Slider value.
   */
  getSliderValue() {
    return this.slider.getValue();
  }

  /**
   * Set slider value.
   * @param {number} value Slider value.
   */
  setSliderValue(value) {
    this.slider.setValue(value);
  }

  /**
   * Set time display value.
   * @param {number} value Time value.
   */
  setTimeDisplayValue(value) {
    this.timeDisplay.setTime(value);
  }

  /**
   * Set slider value,
   * @param {number} value Slider value.
   */
  setSliderValue(value) {
    this.slider.setValue(value);
  }

  /**
   * Handle child lost focus to show toolbar.
   */
  handleChildGotFocus() {
    if (!this.params.hideControls) {
      return;
    }

    window.clearTimeout(this.hideToolbarTimeout);

    this.dom.classList.remove('transparent');
  }

  /**
   * Handle child lost focus to hide toolbar.
   */
  handleChildLostFocus() {
    if (!this.params.hideControls) {
      return;
    }

    this.dom.classList.add('transparent');
  }
}
