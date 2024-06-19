import Util from '@services/util.js';
import CanvasElement from './canvas-element.js';

import './canvas.scss';

export default class Canvas {
  /**
   * @class
   * @param {object} [params] Parameters passed by the editor.
   * @param {object} [callbacks] Callbacks.
   */
  constructor(params = {}, callbacks = {}) {
    params = Util.extend({
      elements: [],
    }, params);

    callbacks = Util.extend({}, callbacks);

    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-animator-canvas');
    this.dom.style.setProperty('--aspect-ratio', params.aspectRatio ?? '16/9');

    if (params.backgroundColor) {
      this.dom.style.setProperty('--background-color', params.backgroundColor);
    }

    if (params.backgroundImage) {
      this.dom.classList.add('has-background-image');
      this.dom.style.setProperty(
        '--background-image', `url(${params.backgroundImage})`
      );
    }

    this.elements = params.elements.map((element) => {
      return new CanvasElement({
        animations: element.animations,
        contentType: element.contentType,
        geometry: element.geometry,
        globals: params.globals
      });
    });

    this.elements.forEach((element) => {
      this.dom.appendChild(element.getDOM());
    });
  }

  /**
   * Get DOM.
   * @returns {HTMLElement} DOM.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Play animation.
   */
  play() {
    this.elements.forEach((element) => {
      element.play();
    });
  }

  /**
   * Pause animation.
   */
  pause() {
    this.elements.forEach((element) => {
      element.pause();
    });
  }

  /**
   * Seek to a specific time.
   * @param {number} timeMs Time in milliseconds.
   */
  seek(timeMs) {
    this.elements.forEach((element) => {
      element.seek(timeMs);
    });
  }

  /**
   * Get total duration.
   * @returns {number} Total duration in milliseconds.
   */
  getDuration() {
    return Math.max(...this.elements.map((element) => element.getDuration()));
  }

  /**
   * Resize.
   * @param {object} [params] Parameters.
   * @param {number} [params.sizeFactor] Size factor.
   */
  resize(params) {
    if (params.sizeFactor) {
      // Using same logic and values as CoursePresentation to scale text.
      this.dom.style.fontSize =
      `${CanvasElement.BASE_FONT_SIZE_PX * params.sizeFactor}px`;
    }

    this.dom.style.setProperty(
      '--max-height', params.maxHeight ? `${params.maxHeight}px` : ''
    );
  }
}

/** @constant {number} BASE_FONT_SIZE Base font size. */
CanvasElement.BASE_FONT_SIZE_PX = 16;
