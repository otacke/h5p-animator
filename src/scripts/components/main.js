import Util from '@services/util.js';
import Canvas from '@components/canvas/canvas.js';
import Toolbar from '@components/toolbar/toolbar.js';
import Timeline from '@models/timeline.js';
import Jukebox from '@services/jukebox.js';
import { MS_IN_S, secondsToMilliseconds, millisecondsToSeconds } from '@services/time-util.js';
import './main.scss';

/** @constant {number} FRAMES_PER_SECOND Frames per second aspired. */
const FRAMES_PER_SECOND = 25;

/** @constant {number} UPDATE_INTERVAL_MS Update interval in milliseconds. */
const UPDATE_INTERVAL_MS = MS_IN_S / FRAMES_PER_SECOND;

/** @constant {string} KEY_REWIND Key to rewind. */
const KEY_REWIND = 'j';

/** @constant {string} KEY_PLAY_PAUSE Key to play/pause. */
const KEY_PLAY_PAUSE = 'k';

/** @constant {string} KEY_FORWARD Key to forward. */
const KEY_FORWARD = 'l';

export default class AnimatorMain {
  /**
   * @class
   * @param {object} [params] Parameters.
   * @param {object} [callbacks] Callbacks.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = Util.extend({
    }, params);

    this.callbacks = Util.extend({
      onFullscreenClicked: () => {}
    }, callbacks);

    this.isPlayingState = false;
    this.currentTime = 0;

    this.hasAudio = !!this.params.audio.audio?.[0]?.path;

    if (this.hasAudio) {
      this.jukebox = new Jukebox({
        // Audio is buffered and ready to play
        onAudioContextReady: () => {
          this.toolbar?.enableButton('play');
          this.toolbar?.enableSlider();
        }
      });
      this.fillJukebox();
    }

    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-animator-main');

    // Screen reader only description
    if (typeof this.params.description === 'string') {
      const description = document.createElement('div');
      description.classList.add('h5p-animator-description');
      description.classList.add('sr-only');
      description.textContent = Util.purifyHTML(this.params.description);
      this.dom.append(description);
    }

    this.canvas = new Canvas({
      aspectRatio: this.params.aspectRatio,
      backgroundColor: this.params.backgroundColor,
      backgroundImage: this.params.backgroundImage,
      globals: this.params.globals,
      elements: this.params.elements
    });

    const elementsLookup = this.canvas.elements.reduce((acc, element) => {
      const subContentId = element.getSubContentId();
      if (subContentId) {
        acc[subContentId] = {
          dom: element.getDOM(),
          geometry: element.getGeometry()
        };
      }

      return acc;
    }, {});

    this.timeline = new Timeline({
      animations: this.params.animations,
      elementsLookup: elementsLookup
    });

    this.duration = this.timeline.getDuration();

    this.toolbar = new Toolbar(
      {
        dictionary: this.params.dictionary,
        globals: this.params.globals,
        maxTime: millisecondsToSeconds(this.duration),
        hideControls: this.params.hideControls
      },
      {
        onSliderStarted: () => {
          this.handleSliderStarted();
        },
        onSliderSeeked: (value) => {
          this.handleSliderSeeked(value);
        },
        onSliderEnded: () => {
          this.handleSliderEnded();
        },
        onPlayClicked: () => {
          this.handlePlayPause();
        },
        onFullscreenClicked: () => {
          this.callbacks.onFullscreenClicked();
        }
      }
    );

    if (this.hasAudio) {
      this.toolbar.disableButton('play');
      this.toolbar.disableSlider();
      // Will be enabled when audio is ready
    }

    if (this.params.hideControls) {
      this.dom.append(this.toolbar.getDOM());
      this.dom.append(this.canvas.getDOM());
    }
    else {
      this.dom.append(this.canvas.getDOM());
      this.dom.append(this.toolbar.getDOM());
    }

    document.body.addEventListener('keydown', (event) => {
      if (event.key === KEY_REWIND) {
        this.handleSliderSeeked(this.currentTime - 1, true);
      }
      else if (event.key === KEY_PLAY_PAUSE) {
        if (event.repeat) {
          return;
        }
        this.handlePlayPause();
      }
      else if (event.key === KEY_FORWARD) {
        this.handleSliderSeeked(this.currentTime + 1, true);
      }
    });
  }

  /**
   * Return the DOM for this class.
   * @returns {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Reset.
   */
  reset() {
    this.stop();
    this.timeline.seek(0);
  }

  /**
   * Resize
   * @param {object} [params] Parameters.
   */
  resize(params = {}) {
    let maxCanvasHeight;
    if (H5P.isFullscreen) {
      const toolbarHeight = this.params.hideControls ? 0 : this.toolbar.getFullHeight();

      if (params.containerSize.height) {
        maxCanvasHeight = params.containerSize.height - toolbarHeight;
      }
    }

    this.canvas.resize({
      sizeFactor: params.sizeFactor,
      ...(maxCanvasHeight && { maxHeight: maxCanvasHeight })
    });
  }

  /**
   * Handle slider started.
   */
  handleSliderStarted() {
    this.continueState = this.isPlayingState;
    this.stop({ keepState: true });
  }

  /**
   * Handle slider seeked.
   * @param {number} value Time in seconds.
   * @param {boolean} [copyback] If true, copy back the value to the slider.
   */
  handleSliderSeeked(value, copyback = false) {
    value = Math.max(0, Math.min(value, millisecondsToSeconds(this.duration)));

    this.currentTime = value;
    this.toolbar.setTimeDisplayValue(this.currentTime);
    if (copyback) {
      this.toolbar.setSliderValue(this.currentTime);
    }
    this.timeline.seek(secondsToMilliseconds(this.currentTime));
  }

  /**
   * Handle slider ended.
   */
  handleSliderEnded() {
    if (this.continueState) {
      this.start();
    }
  }

  /**
   * Handle play/pause request by user.
   */
  handlePlayPause() {
    if (this.isPlayingState) {
      this.stop();
    }
    else {
      this.start();
    }
  }

  /**
   * Stop animation.
   * @param {object} [params] Parameters.
   * @param {boolean} [params.keepState] If true, don't change the state of the animation.
   */
  stop(params = {}) {
    if (!params.keepState) {
      this.isPlayingState = false;
    }

    window.clearTimeout(this.updateTimeout);

    if (!params.keepState) {
      this.toolbar.forceButton('play', false, { noCallback: true });
    }

    this.timeline.pause();

    if (this.hasAudio) {
      this.jukebox.stop('background');
    }
  }

  /**
   * Start animation.
   */
  start() {
    if (this.currentTime >= millisecondsToSeconds(this.duration)) {
      this.currentTime = 0; // Restart from beginning after finished
    }

    this.lastTickMS = Date.now();
    this.toolbar.forceButton('play', true, { noCallback: true });
    // Ensure that all timelines are synced with global time
    this.isPlayingState = true;

    this.timeline.seek(secondsToMilliseconds(this.currentTime));
    this.timeline.play();
    if (this.hasAudio) {
      this.jukebox.play('background', this.currentTime);
    }

    this.update();
  }

  /**
   * Update animation.
   */
  update() {
    const nowMS = Date.now();
    const secondsPassed = millisecondsToSeconds(nowMS - this.lastTickMS);
    this.lastTickMS = nowMS;

    this.currentTime = this.currentTime + secondsPassed;

    const durattionS = millisecondsToSeconds(this.duration);

    if (this.currentTime > durattionS) {
      // Animation finished
      this.toolbar.setSliderValue(durattionS);
      this.toolbar.setTimeDisplayValue(durattionS);

      if (this.params.hideControls) {
        this.toolbar.displayTemporarily();
      }

      this.stop();
      return;
    }

    this.toolbar.setSliderValue(this.currentTime);
    this.toolbar.setTimeDisplayValue(this.currentTime);

    window.clearTimeout(this.updateTimeout);
    this.updateTimeout = window.setTimeout(() => {
      this.update();
    }, UPDATE_INTERVAL_MS);
  }

  /**
   * Fill jukebox with audio.
   */
  fillJukebox() {
    const audios = {};

    if (this.params.audio.audio?.[0]?.path) {
      const src = H5P.getPath(
        this.params.audio.audio[0].path, this.params.globals.get('contentId')
      );

      const crossOrigin =
        H5P.getCrossOrigin?.(this.params.audio.audio[0]) ??
        'Anonymous';

      audios.background = {
        src: src,
        crossOrigin: crossOrigin
      };
    }
    this.jukebox.fill(audios);
  }
}
