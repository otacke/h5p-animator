import Util from '@services/util.js';
import { toAriaDatetime, toTimecode } from '@services/time-util.js';
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

    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-animator-time-display');

    this.currentTime = document.createElement('time');
    this.currentTime.classList.add('h5p-animator-time-display-current');
    this.dom.append(this.currentTime);

    const separator = document.createElement('span');
    separator.classList.add('h5p-animator-time-display-separator');
    separator.textContent = '/ ';
    this.dom.append(separator);

    const maxTime = document.createElement('time');
    maxTime.classList.add('h5p-animator-time-display-max');
    maxTime.setAttribute('datetime', toAriaDatetime(this.params.maxTime));
    maxTime.textContent = toTimecode(this.params.maxTime, { padMinutes: true });
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
    if (typeof time !== 'number') {
      return;
    }

    this.currentTime.setAttribute('datetime', toAriaDatetime(time));
    this.currentTime.textContent = toTimecode(time, { padMinutes: true });
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
