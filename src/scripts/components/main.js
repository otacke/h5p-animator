import Util from '@services/util.js';
import Canvas from '@components/canvas/canvas.js';
import Toolbar from '@components/toolbar/toolbar.js';
import Timeline from '@models/timeline.js';
import Jukebox from '@services/jukebox.js';
import { MS_IN_S, secondsToMilliseconds, millisecondsToSeconds } from '@services/time-util.js';

/** @constant {number} FRAMES_PER_SECOND Frames per second aspired. */
const FRAMES_PER_SECOND = 25;

/** @constant {number} UPDATE_INTERVAL_MS Update interval in milliseconds. */
const UPDATE_INTERVAL_MS = MS_IN_S / FRAMES_PER_SECOND;

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

    this.canvas = new Canvas(
      {
        aspectRatio: this.params.aspectRatio,
        backgroundColor: this.params.backgroundColor,
        backgroundImage: this.params.backgroundImage,
        globals: this.params.globals,
        elements: this.params.elements
      },
      {}
    );

    const elementsLookup = this.canvas.elements.reduce((acc, element) => {
      const subContentId = element.getSubContentId();
      if (!subContentId) {
        return acc;
      }

      acc[element.getSubContentId()] = {
        dom: element.getDOM(),
        geometry: element.getGeometry()
      };

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
          this.continueState = this.isPlayingState;
          this.stop({ keepState: true });
        },
        onSliderSeeked: (value) => {
          this.currentTime = value;
          this.toolbar.setTimeDisplayValue(this.currentTime);
          this.timeline.seek(secondsToMilliseconds(this.currentTime));
        },
        onSliderEnded: () => {
          if (this.continueState) {
            this.start();
          }
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
    }

    if (this.params.hideControls) {
      this.dom.append(this.toolbar.getDOM());
      this.dom.append(this.canvas.getDOM());
    }
    else {
      this.dom.append(this.canvas.getDOM());
      this.dom.append(this.toolbar.getDOM());
    }
  }

  /**
   * Return the DOM for this class.
   * @returns {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Resize
   * @param {object} [params] Parameters.
   */
  resize(params = {}) {
    let maxCanvasHeight;
    if (H5P.isFullscreen) {
      const toolbarHeight = this.params.hideControls ?
        0 :
        this.toolbar.getFullHeight();

      if (params.containerSize.height) {
        maxCanvasHeight = params.containerSize.height - toolbarHeight;
      }
    }

    this.toolbar.resize();

    this.canvas.resize({
      sizeFactor: params.sizeFactor,
      ...(maxCanvasHeight && { maxHeight: maxCanvasHeight })
    });
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
      this.currentTime = 0;
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
