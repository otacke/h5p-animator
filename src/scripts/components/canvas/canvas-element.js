import Util from '@services/util.js';
import './canvas-element.scss';

import anime from 'animejs/lib/anime.es.js';

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

    this.instance = H5P.newRunnable(
      this.params.contentType,
      this.params.globals.get('contentId'),
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

    this.params.animations = this.sanitizeAnimations(this.params.animations);
    this.animations = this.createAnimations(this.params.animations, this.dom);

    this.timeline = anime.timeline({ autoplay: false });

    this.animations.forEach((animation) => {
      this.timeline.add(animation);
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
   * Play timeline.
   */
  play() {
    if (this.timeline.currentTime >= this.timeline.duration) {
      return; // Would otherwise restart timeline
    }

    this.timeline.seek(this.timeline.currentTime);
    this.timeline.play();
  }

  /**
   * Pause timeline.
   */
  pause() {
    this.timeline.pause();
  }

  /**
   * Seek to a specific time on timeline.
   * @param {number} timeMs Time in milliseconds.
   */
  seek(timeMs) {
    this.timeline.seek(timeMs);
  }

  /**
   * Get duration of thie element's timeline.
   * @returns {number} Duration in milliseconds.
   */
  getDuration() {
    return this.timeline.duration;
  }

  /**
   * Create animations for anime.js timeline.
   * // TODO: Use "lookup table"
   * // TODO: Allow overlapping animations
   * @param {object[]} animations Parameters set by editor.
   * @param {HTMLElement} dom element to animate.
   * @returns {object[]} Animations for anime.js timeline.
   */
  createAnimations(animations = [], dom) {
    return animations.map((animation) => {
      const animationParams = {
        targets: dom,
        easing: animation.easing,
        delay: parseFloat(animation.delay) * 1000,
        duration: parseFloat(animation.duration) * 1000,
      };

      if (animation.effect === 'flyIn') {
        const offsiteX = this.calculateOffsiteX(
          this.params.geometry.x,
          this.params.geometry.width,
          animation.flyInDirection
        );

        const offsiteY = this.calculateOffsiteY(
          this.params.geometry.y,
          this.params.geometry.height,
          animation.flyInDirection
        );

        if (offsiteX !== 0) {
          animationParams.translateX = [`${offsiteX}%`, '0%'];
        }

        if (offsiteY !== 0) {
          animationParams.translateY = [`${offsiteY}%`, '0%'];
        }
      }
      else if (animation.effect === 'fadeIn') {
        animationParams.opacity = [0, 1];
      }
      else if (animation.effect === 'zoomIn') {
        animationParams.scale = [0, 1];
      }
      else if (animation.effect === 'rotate') {
        animationParams.rotate = animation.rotate;
      }
      else if (animation.effect === 'pulse') {
        animationParams.keyframes = [
          { scale: 1 },
          { scale: 1.05 },
          { scale: 1 }
        ];
      }
      else if (animation.effect === 'wobble') {
        animationParams.keyframes = [
          { translateX: 0, rotate: 0 },
          { translateX: '-25%', rotate: '-5deg' },
          { translateX: '20%', rotate: '3deg' },
          { translateX: '-15%', rotate: '-3deg' },
          { translateX: '10%', rotate: '2deg' },
          { translateX: '-5%', rotate: '-1deg' },
          { translateX: 0 }
        ];
      }
      else if (animation.effect === 'shakeX') {
        animationParams.keyframes = [
          { translateX: 0 },
          { translateX: '-10%' },
          { translateX: '10%' },
          { translateX: '-10%' },
          { translateX: '10%' },
          { translateX: '-10%' },
          { translateX: 0 }
        ];
      }
      else if (animation.effect === 'shakeY') {
        animationParams.keyframes = [
          { translateY: 0 },
          { translateY: '-10%' },
          { translateY: '10%' },
          { translateY: '-10%' },
          { translateY: '10%' },
          { translateY: '-10%' },
          { translateY: 0 }
        ];
      }
      else if (animation.effect === 'translate') {
        animationParams.translateX = `${animation.translateX}%`;
        animationParams.translateY = `${animation.translateY}%`;
      }
      if (animation.effect === 'flyOut') {
        const offsiteX = this.calculateOffsiteX(
          this.params.geometry.x,
          this.params.geometry.width,
          animation.flyOutDirection
        );

        const offsiteY = this.calculateOffsiteY(
          this.params.geometry.y,
          this.params.geometry.height,
          animation.flyOutDirection
        );

        if (offsiteX !== 0) {
          animationParams.translateX = ['0%', `${offsiteX}%`];
        }

        if (offsiteY !== 0) {
          animationParams.translateY = ['0%', `${offsiteY}%`];
        }
      }
      else if (animation.effect === 'fadeOut') {
        animationParams.opacity = [1, 0];
      }
      else if (animation.effect === 'zoomOut') {
        animationParams.scale = [1, 0];
      }

      return animationParams;
    });
  }

  /**
   * Calculate offsite position for x-axis.
   * @param {number} position Element percentage position on canvas
   * @param {number} width Element width/height.
   * @param {string} side Side to put offsite: Left|Right.
   * @returns {number} Offsite position percentage.
   */
  calculateOffsiteX(position, width, side) {
    if (side.includes('Left')) {
      return (position + width) / width * -100 - 5; // -5 to really hide
    }
    else if (side.includes('Right')) {
      return (100 - position) / width * 100 + 5; // +5 to really hide
    }

    return 0;
  }

  /**
   * Calculate offsite position for y-axis.
   * @param {number} position Element percentage position on canvas
   * @param {number} height Element height.
   * @param {string} side Side to put offsite: Top|Left.
   * @returns {number} Offsite position percentage.
   */
  calculateOffsiteY(position, height, side) {
    if (side.includes('Top')) {
      return (position + height) / height * -100 - 5; // -5 to really hide
    }
    else if (side.includes('Bottom')) {
      return (100 - position) / height * 100 + 5; // +5 to really hide
    }

    return 0;
  }

  /**
   * Sanitize animation parameters.
   * @param {object[]} animations Parameters set by editor.
   * @returns {object[]} Sanitized parameters.
   */
  sanitizeAnimations(animations = []) {
    return animations.map((animation) => {
      animation.delay = parseFloat(animation.delay) || 0;
      animation.duration = parseFloat(animation.duration) || 0;

      return animation;
    });
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
