import Util from '@services/util.js';
import H5PUtil from '@services/h5p-util.js';
import Dictionary from '@services/dictionary.js';
import Globals from '@services/globals.js';
import AnimatorMain from '@components/main.js';
import '@styles/h5p-animator.scss';

/** @constant {string} DEFAULT_DESCRIPTION Default description */
const DEFAULT_DESCRIPTION = 'Animator';

/** @constant {string} DEFAULT_ASPECT_RATIO Default aspect ratio */
const DEFAULT_ASPECT_RATIO = '16:9';

/** @constant {number} BASE_WIDTH_PX Base width for font size computation. */
const BASE_WIDTH_PX = 640;

/** @constant {number} FULLSCREEN_DELAY_MS Delay for going to fullscreen. */
const FULLSCREEN_DELAY_MS = 300;

/** @constant {number} FULLSCREEN_RESIZE_DELAY_MS Delay before resizing after exiting fullscreen. */
const FULLSCREEN_RESIZE_DELAY_MS = 50;

export default class Animator extends H5P.EventDispatcher {

  /**
   * @class
   * @param {object} params Parameters passed by the editor.
   * @param {number|string} contentId Content's id. Technically, only a number would be valid
   * @param {object} [extras] Saved state, metadata, etc.
   */
  constructor(params, contentId, extras = {}) {
    super();

    const defaults = Util.extend({
      editor: {
        background: {},
        elements: [],
        animations: []
      },
      audio: {},
      behaviour: {
        aspectRatio: DEFAULT_ASPECT_RATIO
      }
    }, H5PUtil.getSemanticsDefaults());

    this.params = Util.extend(defaults, params);

    this.contentId = contentId;
    this.extras = extras;

    // Fill dictionary
    this.dictionary = new Dictionary();
    this.dictionary.fill({ l10n: this.params.l10n, a11y: this.params.a11y });

    // Set globals
    this.globals = new Globals();
    this.globals.set('mainInstance', this);
    this.globals.set('contentId', this.contentId);
    this.globals.set('isFullscreenSupported', this.isRoot() && H5P.fullscreenSupported);
    this.globals.set('resize', () => {
      this.trigger('resize');
    });

    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-animator-content');

    this.main = new AnimatorMain(
      {
        animations: this.retrieveAnimations(this.params.editor.animations),
        aspectRatio: this.retrieveAspectRatio(this.params.behaviour.aspectRatio),
        audio: this.params.audio,
        backgroundColor: this.params.background.backgroundColor,
        backgroundImage: this.retrieveBackgroundImage(
          this.params.background.backgroundImage?.path, this.contentId
        ),
        description: this.params.behaviour.description,
        elements: this.retrieveElements(this.params.editor.elements),
        dictionary: this.dictionary,
        globals: this.globals,
        hideControls: this.params.behaviour.hideControls
      },
      {
        onFullscreenClicked: () => {
          this.handleFullscreenClicked();
        }
      });

    this.dom = this.main.getDOM();

    if (this.globals.get('isFullscreenSupported')) {
      this.on('exitFullScreen', () => {
        /*
        * Wait for fullscreen to exit. H5P core does not relay exitFullscreen
        * promise and fullscreenchange event support is bad in Safari.
        */
        window.setTimeout(() => {
          this.trigger('resize');
        }, FULLSCREEN_RESIZE_DELAY_MS);
      });
    }
  }

  /**
   * Attach library to wrapper.
   * @param {H5P.jQuery} $wrapper Content's container.
   */
  attach($wrapper) {
    this.wrapper = $wrapper.get(0);
    this.wrapper.classList.add('h5p-animator');
    this.wrapper.appendChild(this.dom);

    this.baseWidth = parseInt(this.wrapper.style.width ?? '0') || BASE_WIDTH_PX;

    this.on('resize', () => {
      this.resize();
    });
  }

  /**
   * Resize.
   */
  resize() {
    this.main.resize({
      sizeFactor: this.wrapper.clientWidth / this.baseWidth,
      containerSize: {
        width: this.wrapper.clientWidth,
        height: this.wrapper.clientHeight
      }
    });
  }

  /**
   * Retrieve elements.
   * @param {object[]} [elements] Elements.
   * @returns {object[]} Valid elements.
   */
  retrieveElements(elements = []) {
    return elements
      .filter((element) => element.contentType?.library !== undefined)
      .map((element) => ({
        contentType: element.contentType,
        geometry: {
          x: parseFloat(element.x),
          y: parseFloat(element.y),
          width: parseFloat(element.width),
          height: parseFloat(element.height)
        }
      }))
      .filter((element) =>
        !Number.isNaN(element.geometry.x) &&
        !Number.isNaN(element.geometry.y) &&
        !Number.isNaN(element.geometry.width) &&
        !Number.isNaN(element.geometry.height)
      );
  }

  /**
   * Retrieve animations with basic sanitization.
   * @param {object[]} [animations] Animations.
   * @returns {object[]} Valid animations.
   */
  retrieveAnimations(animations = []) {
    animations = animations
      .filter((animation) => animation !== null)
      .map((animation) => {
        if (typeof animation !== 'object' || animation === null) {
          return null;
        }

        animation = Util.extend({
          delay: '0',
          duration: '1',
          easing: 'linear',
          startWith: 'afterPrevious'
        }, animation);

        animation.delay = parseFloat(animation.delay);
        animation.duration = parseFloat(animation.duration);

        return animation;
      })
      .filter((animation) =>
        !Number.isNaN(animation.delay) &&
        !Number.isNaN(animation.duration)
      );

    return animations ?? [];
  }

  /**
   * Retrieve background image.
   * @param {string} path Image path.
   * @param {number|string} contentId ContentId.
   * @returns {string} Image source.
   */
  retrieveBackgroundImage(path, contentId) {
    if (typeof path !== 'string') {
      return '';
    }

    const image = new Image();
    H5P.setSource(image, { path: path }, contentId);

    return image.src ?? '';
  }

  /**
   * Retrieve aspect ratio.
   * @param {string} aspectRatio Aspect ratio.
   * @returns {number} Aspect ratio.
   */
  retrieveAspectRatio(aspectRatio) {
    if (typeof aspectRatio === 'number') {
      aspectRatio = aspectRatio.toString();
    }

    if (typeof aspectRatio !== 'string') {
      aspectRatio = DEFAULT_ASPECT_RATIO;
    }

    if (aspectRatio.match(/^\d+(.\d+)?$/)) {
      aspectRatio = `${aspectRatio}/1`;
    }

    if (!(aspectRatio.match(/^\d+(.\d+)?[:/]\d+(.\d+)?$/))) {
      aspectRatio = DEFAULT_ASPECT_RATIO;
    }

    const [width, height] = aspectRatio.includes(':') ?
      aspectRatio.split(':') :
      aspectRatio.split('/');

    return parseFloat(width) / parseFloat(height);
  }

  /**
   * Handle fullscreen button clicked.
   */
  handleFullscreenClicked() {
    setTimeout(() => {
      this.toggleFullscreen();
    }, FULLSCREEN_DELAY_MS); // Some devices don't register user gesture before call to to requestFullscreen
  }

  /**
   * Toggle fullscreen button.
   * @param {string|boolean} state enter|false for enter, exit|true for exit.
   */
  toggleFullscreen(state) {
    if (!this.dom) {
      return;
    }

    if (typeof state === 'string') {
      if (state === 'enter') {
        state = false;
      }
      else if (state === 'exit') {
        state = true;
      }
    }

    if (typeof state !== 'boolean') {
      state = !H5P.isFullscreen;
    }

    if (state) {
      this.container = this.container || this.dom.closest('.h5p-container');
      if (this.container) {
        H5P.fullScreen(H5P.jQuery(this.container), this);
      }
    }
    else {
      H5P.exitFullScreen();
    }
  }

  /**
   * Get task title.
   * @returns {string} Title.
   */
  getTitle() {
    // H5P Core function: createTitle
    return H5P.createTitle(
      this.extras?.metadata?.title || DEFAULT_DESCRIPTION
    );
  }

  /**
   * Get description.
   * @returns {string} Description.
   */
  getDescription() {
    return DEFAULT_DESCRIPTION;
  }

  /**
   * Reset.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-5}
   */
  resetTask() {
    this.main.reset();
  }
}
