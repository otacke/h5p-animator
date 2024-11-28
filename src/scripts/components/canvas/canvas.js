import Util from '@services/util.js';
import CanvasElement from './canvas-element.js';

import './canvas.scss';

/** @constant {number} BASE_FONT_SIZE Base font size. */
const BASE_FONT_SIZE_PX = 16;

export default class Canvas {
  /**
   * @class
   * @param {object} [params] Parameters passed by the editor.
   */
  constructor(params = {}) {
    params = Util.extend({
      elements: [],
    }, params);

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
   * Resize.
   * @param {object} [params] Parameters.
   * @param {number} [params.sizeFactor] Size factor.
   */
  resize(params) {
    if (params.sizeFactor) {
      // Using same logic and values as CoursePresentation to scale text.
      this.dom.style.fontSize =
      `${BASE_FONT_SIZE_PX * params.sizeFactor}px`;
    }

    this.dom.style.setProperty(
      '--max-height', params.maxHeight ? `${params.maxHeight}px` : ''
    );
  }
}
