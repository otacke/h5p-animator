import { createTimeline } from 'animejs';
import { secondsToMilliseconds } from '@services/time-util.js';
import {
  createFlyInParams,
  createFadeInParams,
  createZoomInParams,
  createRotateParams,
  createPulseParams,
  createWobbleParams,
  createShakeXParams,
  createShakeYParams,
  createTranslateParams,
  createFlyOutParams,
  createFadeOutParams,
  createZoomOutParams,
} from './timeline-helpers.js';

export default class Timeline {
  /**
   * @class
   * @param {object} [params] Parameters.
   * @param {object[]} [params.animations] Parameters set by editor.
   * @param {object[]} [params.elementsLookup] Info about elements by subContentId: dom and geometry.
   */
  constructor(params = {}) {
    this.timeline = createTimeline({ autoplay: false });

    this.animations = this.createAnimations(params.animations, params.elementsLookup);

    this.setInitialStates();

    this.animations.forEach((animation) => {
      const { targets, timeOffset, ...animationParams } = animation;
      this.timeline.add(targets, animationParams, timeOffset);
    });

    // Timeline isn't rendered by anime.js 4 until played or seeked. Render first frame right away to avoid showing all.
    this.timeline.seek(0);
  }

  /**
   * Put elements into state that their first animation starts with, e.g. to make transparent.
   */
  setInitialStates() {
    const handledTargets = new Set();

    this.animations.forEach((animation) => {
      const targets = animation.targets;
      if (handledTargets.has(targets)) {
        return; // Only earliest animation determines start state.
      }
      handledTargets.add(targets);

      const initialParams = {};
      Object.entries(animation).forEach(([key, keyframes]) => {
        if (Array.isArray(keyframes) && keyframes[0]?.duration === 0) {
          initialParams[key] = keyframes[0].to;
        }
      });

      if (Object.keys(initialParams).length > 0) {
        this.timeline.set(targets, initialParams, 0);
      }
    });
  }

  /**
   * Create animations for anime.js timeline.
   * @param {object[]} animations Parameters set by editor.
   * @param {object[]} elementsLookup Elements info: dom and geometry
   * @returns {object[]} Animations for anime.js timeline.
   */
  createAnimations(animations = [], elementsLookup = {}) {
    const animationParamsArray = animations.map((animation) => {
      const { dom, geometry } = elementsLookup[animation.subContentId];
      return this.createAnimationParams({ ...animation, dom }, geometry);
    });

    return this.mergeAnimations(animationParamsArray);
  }

  /**
   * Create animation parameters based on the effect.
   * @param {object} animation Animation parameters set by editor.
   * @param {object} geometry Element geometry.
   * @returns {object} Animation parameters for anime.js.
   */
  createAnimationParams(animation, geometry) {
    const animationParams = {
      targets: animation.dom,
      startWith: animation.startWith,
      ease: animation.easing,
      delay: secondsToMilliseconds(animation.delay),
      duration: secondsToMilliseconds(animation.duration),
    };

    const effectHandlers = {
      flyIn: createFlyInParams,
      fadeIn: createFadeInParams,
      zoomIn: createZoomInParams,
      rotate: createRotateParams,
      pulse: createPulseParams,
      wobble: createWobbleParams,
      shakeX: createShakeXParams,
      shakeY: createShakeYParams,
      translate: createTranslateParams,
      flyOut: createFlyOutParams,
      fadeOut: createFadeOutParams,
      zoomOut: createZoomOutParams,
    };

    const handler = effectHandlers[animation.effect];
    if (handler) {
      handler(animationParams, geometry, animation);
    }

    return animationParams;
  };

  /**
   * Merge animations that should start at the same time.
   * Note: anime.js does not overlap animations properly!
   * @param {object[]} animations Array of animation parameters.
   * @returns {object[]} Merged animations.
   */
  mergeAnimations(animations) {
    return animations.reduce((acc, animation, index) => {
      const startWith = animation.startWith;
      delete animation.startWith;

      if (index === 0 || startWith === 'afterPrevious') {
        acc.push(animation);
      }
      else {
        let previousAnimation = acc[acc.length - 1];
        if (animation.targets === previousAnimation.targets) {
          Object.keys(animation).forEach((key) => {
            previousAnimation[key] = animation[key];
          });
          return acc;
        }
        else {
          animation.timeOffset = `-=${previousAnimation.duration}`;
          acc.push(animation);
        }
      }

      return acc;
    }, []);
  }

  /**
   * Get duration timeline.
   * @returns {number} Duration in milliseconds.
   */
  getDuration() {
    return this.timeline.duration;
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
   * Destroy self.
   */
  destroy() {
    this.timeline?.pause();
    this.timeline = null;
    this.animations = null;
  }
}
