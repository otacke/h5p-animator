var H5PUpgrades = H5PUpgrades || {};

/**
 * Upgrades for the Animator content type.
 */
H5PUpgrades['H5P.Animator'] = (() => {
  return {
    1: {
      /**
       * Asynchronous content upgrade hook.
       * Upgrades content parameters to support Animator 1.1.
       * Updates easing values for migration to AnimeJS 4.
       * @param {object} parameters Content parameters.
       * @param {function} finished Callback when finished.
       * @param {object} extras Extra parameters such as metadata, etc.
       */
      1: (parameters, finished, extras) => {
        if (Array.isArray(parameters?.editor?.animations)) {
          parameters.editor.animations = parameters.editor.animations.map((animation) => {
            if (animation.easing === 'easeInQuad') {
              animation.easing = 'inQuad';
            }
            else if (animation.easing === 'easeOutQuad') {
              animation.easing = 'outQuad';
            }
            else if (animation.easing === 'easeInOutQuad') {
              animation.easing = 'inOutQuad';
            }

            return animation;
          });
        }

        finished(null, parameters, extras);
      },
    },
  };
})();
