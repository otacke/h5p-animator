import Util from '@services/util.js';
import TimeUtil from '@services/time-util.js';
import './time-display.scss';

export default class TimeDisplay {
  /**
   * Time display.
   * @class
   * @param {object} [params] Parameters.
   */
  constructor(params = {}) {
    this.params = Util.extend({
      currentTime: 0,
      maxTime: 100
    }, params);

    // TODO: Make time accessible

    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-animator-time-display');

    this.currentTime = document.createElement('div');
    this.currentTime.classList.add('h5p-animator-time-display-current');
    this.dom.append(this.currentTime);

    const separator = document.createElement('span');
    separator.classList.add('h5p-animator-time-display-separator');
    separator.textContent = '/ ';
    this.dom.append(separator);

    const maxTime = document.createElement('div');
    maxTime.classList.add('h5p-animator-time-display-max');
    maxTime.textContent = TimeUtil.toTimecode(
      this.params.maxTime, { padMinutes: true }
    );
    this.dom.append(maxTime);

    this.setTime(this.params.currentTime);
  }

  /**
   * Get time display DOM.
   * @returns {HTMLElement} Time display DOM.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Set time.
   * @param {number} time Time.
   */
  setTime(time) {
    if (typeof time === 'number') {
      time = TimeUtil.toTimecode(time, { padMinutes: true });
    }

    this.currentTime.textContent = time;
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
}
