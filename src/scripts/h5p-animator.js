import Util from '@services/util.js';
import H5PUtil from '@services/h5p-util.js';
import Dictionary from '@services/dictionary.js';
import Globals from '@services/globals.js';
import AnimatorMain from '@components/main.js';
import '@styles/h5p-animator.scss';

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
        elements: []
      },
      behaviour: {
        aspectRatio: Animator.DEFAULT_ASPECT_RATIO
      }
    }, H5PUtil.getSemanticsDefaults());

    // Sanitize parameters
    this.params = Util.extend(defaults, params);

    this.params.editor.elements =
      this.retrieveElements(this.params.editor.elements);

    this.contentId = contentId;
    this.extras = extras;

    // Fill dictionary
    this.dictionary = new Dictionary();
    this.dictionary.fill({ l10n: this.params.l10n, a11y: this.params.a11y });

    // Set globals
    this.globals = new Globals();
    this.globals.set('mainInstance', this);
    this.globals.set('contentId', this.contentId);
    this.globals.set('isFullscreenSupported',
      this.isRoot() && H5P.fullscreenSupported
    );
    this.globals.set('resize', () => {
      this.trigger('resize');
    });


    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-animator-content');

    this.main = new AnimatorMain(
      {
        aspectRatio: this.retrieveAspectRatio(this.params.behaviour.aspectRatio),
        backgroundColor: this.params.editor.background.backgroundColor,
        backgroundImage: this.retrieveBackgroundImage(
          this.params.editor.background.backgroundImage?.path, this.contentId
        ),
        elements: this.params.editor.elements,
        dictionary: this.dictionary,
        globals: this.globals,
        hideControls: this.params.behaviour.hideControls,
        audio: this.params.audio
      },
      {
        onFullscreenClicked: () => {
          this.handleFullscreenClicked();
        }
      });
    this.dom = this.main.getDOM();

    if (this.globals.get('isFullscreenSupported')) {
      this.on('exitFullScreen', () => {
        this.triggerResizeAfterFullscreen();
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

    this.baseWidth = parseInt(this.wrapper.style.width ?? '0') ||
      Animator.BASE_WIDTH_PX;

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
      .map((element) => ({
        animations: element.animations ?? [],
        contentType: element.contentType,
        geometry: {
          x: parseFloat(element.x),
          y: parseFloat(element.y),
          width: parseFloat(element.width),
          height: parseFloat(element.height)
        }
      }))
      .filter((element) =>
        element.contentType.library !== undefined &&
        !Number.isNaN(element.geometry.x) &&
        !Number.isNaN(element.geometry.y) &&
        !Number.isNaN(element.geometry.width) &&
        !Number.isNaN(element.geometry.height)
      );
  }

  /**
   * Retrieve background image.
   * @param {string} path Image path.
   * @param {number|string} contentId ContentId.
   * @returns {string} Image source.
   */
  retrieveBackgroundImage(path, contentId) {
    if (typeof path !== 'string' || !contentId) {
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
    if (
      typeof aspectRatio !== 'string' ||
      !(aspectRatio.match(/^\d+(.\d+)?[:/]\d+(.\d+)?$/))
    ) {
      aspectRatio = Animator.DEFAULT_ASPECT_RATIO;
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
    }, 300); // Some devices don't register user gesture before call to to requestFullscreen
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

  /*
   * Wait for fullscreen to exit. H5P core does not relay exitFullscreen
   * promise and fullscreenchange event support is bad in Safari.
   */
  triggerResizeAfterFullscreen() {
    window.setTimeout(() => {
      this.trigger('resize');
    }, 50);
  }

  /**
   * Get task title.
   * @returns {string} Title.
   */
  getTitle() {
    // H5P Core function: createTitle
    return H5P.createTitle(
      this.extras?.metadata?.title || Animator.DEFAULT_DESCRIPTION
    );
  }

  /**
   * Get description.
   * @returns {string} Description.
   */
  getDescription() {
    return Animator.DEFAULT_DESCRIPTION;
  }
}

/** @constant {string} DEFAULT_DESCRIPTION Default description */
Animator.DEFAULT_DESCRIPTION = 'Animator';

/** @constant {string} DEFAULT_ASPECT_RATIO Default aspect ratio */
Animator.DEFAULT_ASPECT_RATIO = '16:9';

/** @constant {number} BASE_WIDTH_PX Base width for font size computation. */
Animator.BASE_WIDTH_PX = 640;
