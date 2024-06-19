import Util from '@services/util.js';
import Canvas from '@components/canvas/canvas.js';
import Toolbar from '@components/toolbar/toolbar.js';

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

    this.duration = this.canvas.getDuration();

    this.toolbar = new Toolbar(
      {
        dictionary: this.params.dictionary,
        globals: this.params.globals,
        maxTime: this.duration / 1000,
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
          this.canvas.seek(this.currentTime * 1000);
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
    if (this.currentTime >= this.duration / 1000) {
      this.stop();
      return;
    }

    if (this.isPlayingState) {
      this.stop();
    }
    else {
      this.start();
    }
    this.isPlayingState = !this.isPlayingState;
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

    this.canvas.pause();
  }

  /**
   * Start animation.
   */
  start() {
    if (this.currentTime >= this.duration / 1000) {
      return;
    }

    this.lastTickMS = Date.now();
    this.toolbar.forceButton('play', true, { noCallback: true });
    // Ensure that all timelines are synced with global time
    this.canvas.seek(this.currentTime * 1000);
    this.canvas.play();
    this.update();
  }

  /**
   * Update animation.
   */
  update() {
    const nowMS = Date.now();
    const secondsPassed = (nowMS - this.lastTickMS) / 1000;
    this.lastTickMS = nowMS;

    this.currentTime = this.currentTime + secondsPassed;

    if (this.currentTime > this.duration / 1000) {
      this.canvas.seek(this.duration / 1000);
      this.toolbar.setSliderValue(this.duration / 1000);
      this.toolbar.setTimeDisplayValue(this.duration / 1000);

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
    }, 40); // 25fps
  }
}
