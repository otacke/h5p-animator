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
   * // TODO: Can we work around the limitations of starting animations that require
   * //       changes to the same property value at the same time?
   * // TODO: Use "lookup table"
   * // TODO: When editor is in place, this needs to work with one global timeline
   * @param {object[]} animations Parameters set by editor.
   * @param {HTMLElement} dom element to animate.
   * @returns {object[]} Animations for anime.js timeline.
   */
  createAnimations(animations = [], dom) {
    return animations
      .map((animation) => {
        const animationParams = {
          targets: dom,
          startWith: animation.startWith,
          easing: animation.easing,
          delay: animation.delay * 1000,
          duration: animation.duration * 1000
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
            animationParams.translateX = [
              { value: `${offsiteX}%`, duration: 0 },
              { value: '0%', duration: animationParams.duration }
            ];
          }

          if (offsiteY !== 0) {
            animationParams.translateY = [
              { value: `${offsiteY}%`, duration: 0 },
              { value: '0%', duration: animationParams.duration }
            ];
          }
        }
        else if (animation.effect === 'fadeIn') {
          animationParams.opacity = [
            { value: 0, duration: 0 },
            { value: 1, duration: animationParams.duration }
          ];
        }
        else if (animation.effect === 'zoomIn') {
          animationParams.scale = [
            { value: 0, duration: 0 },
            { value: 1, duration: animationParams.duration }
          ];
        }
        else if (animation.effect === 'rotate') {
          animationParams.rotate = [
            { value: animation.rotate }
          ];
        }
        else if (animation.effect === 'pulse') {
          animationParams.scale = [
            { value: 1 },
            { value: 1.05 },
            { value: 1 }
          ];
        }
        else if (animation.effect === 'wobble') {
          animationParams.translateX = [
            { value: 0 },
            { value: '-25%' },
            { value: '20%' },
            { value: '-15%' },
            { value: '10%' },
            { value: '-5%' },
            { value: 0 }
          ];
        }
        else if (animation.effect === 'shakeX') {
          animationParams.translateX = [
            { value: 0 },
            { value: '-10%' },
            { value: '10%' },
            { value: '-10%' },
            { value: '10%' },
            { value: '-10%' },
            { value: 0 }
          ];
        }
        else if (animation.effect === 'shakeY') {
          animationParams.translateY = [
            { value: 0 },
            { value: '-10%' },
            { value: '10%' },
            { value: '-10%' },
            { value: '10%' },
            { value: '-10%' },
            { value: 0 }
          ];
        }
        else if (animation.effect === 'translate') {
          animationParams.translateX = [
            { value: `${animation.translateX}%` }
          ];

          animationParams.translateY = [
            { value: `${animation.translateY}%` }
          ];
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
            animationParams.translateX = [
              { value: '0%', duration: 0 },
              { value: `${offsiteX}%`, duration: animationParams.duration }
            ];
          }

          if (offsiteY !== 0) {
            animationParams.translateY = [
              { value: '0%', duration: 0 },
              { value: `${offsiteY}%`, duration: animationParams.duration }
            ];
          }
        }
        else if (animation.effect === 'fadeOut') {
          animationParams.opacity = [
            { value: 1, duration: 0 },
            { value: 0, duration: animationParams.duration }
          ];
        }
        else if (animation.effect === 'zoomOut') {
          animationParams.scale = [
            { value: 1, duration: 0 },
            { value: 0, duration: animationParams.duration }
          ];
        }

        return animationParams;
      })
      .reduce((acc, animation, index) => {
        // Merge animations that should start at the same time
        if (index === 0 || animation.startWith === 'afterPrevious') {
          delete animation.startWith;
          acc.push(animation);
        }
        else {
          const previousAnimation = acc.pop();
          Object.keys(animation).forEach((key) => {
            if (key !== 'targets' && key !== 'startWith') {
              previousAnimation[key] = animation[key];
            }
          });

          acc.push(previousAnimation);
        }

        return acc;
      }, []);
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
