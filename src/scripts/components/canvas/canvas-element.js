import Util from '@services/util.js';
import './canvas-element.scss';

export default class CanvasElement {
  /**
   * @class
   * @param {object} [params] Parameters passed by the editor.
   * @param {object} [callbacks] Callbacks.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = Util.extend({}, params);

    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-animator-canvas-element');

    const machineName = this.params.contentType?.library?.split(' ')[0];
    if (machineName === 'H5P.Video') {
      /*
       * H5P.Video currently has a bug that prevents this from taking effect.
       * Fixed with workaround below.
       */
      this.params.contentType.params.visuals.disableFullscreen = true;
    }

    const contentId = window.H5PEditor?.filesPath ? undefined : this.params.globals.get('contentId');
    this.instance = H5P.newRunnable(
      this.params.contentType,
      contentId,
      H5P.jQuery(this.dom)
    );

    this.dom.style.left = `${this.params.geometry.x}%`;
    this.dom.style.top = `${this.params.geometry.y}%`;
    this.dom.style.width = `${this.params.geometry.width}%`;
    this.dom.style.height = `${this.params.geometry.height}%`;

    // Workaround for H5P.Video bug up to 1.6.50 at least
    if (machineName === 'H5P.Video') {
      const html5Video = this.dom.querySelector('.h5p-video video');
      if (html5Video) {
        html5Video.setAttribute(
          'controlslist',
          `${html5Video.getAttribute('controlslist')} nofullscreen`
        );
      }
    }

    if (!this.instance) {
      return;
    }

    // Resize parent when children resize
    this.bubbleUp(
      this.instance, 'resize', this.params.globals.get('mainInstance')
    );

    // Resize children to fit inside parent
    this.bubbleDown(
      this.params.globals.get('mainInstance'), 'resize', [this.instance]
    );
  }

  /**
   * Get DOM.
   * @returns {HTMLElement} DOM.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Get the instance's subcontent ID.
   * @returns {string|undefined} Subcontent ID.
   */
  getSubContentId() {
    return this.instance?.subContentId;
  }

  /**
   * Get geometry.
   * @returns {object} Geometry.
   */
  getGeometry() {
    return this.params.geometry;
  }

  /**
   * Make it easy to bubble events from child to parent.
   * @param {object} origin Origin of event.
   * @param {string} eventName Name of event.
   * @param {object} target Target to trigger event on.
   */
  bubbleUp(origin, eventName, target) {
    origin.on(eventName, (event) => {
      // Prevent target from sending event back down
      target.bubblingUpwards = true;

      // Trigger event
      target.trigger(eventName, event);

      // Reset
      target.bubblingUpwards = false;
    });
  }

  /**
   * Make it easy to bubble events from parent to children.
   * @param {object} origin Origin of event.
   * @param {string} eventName Name of event.
   * @param {object[]} targets Targets to trigger event on.
   */
  bubbleDown(origin, eventName, targets) {
    origin.on(eventName, (event) => {
      if (origin.bubblingUpwards) {
        return; // Prevent send event back down.
      }

      targets.forEach((target) => {
        target.trigger(eventName, event);
      });
    });
  }
}
