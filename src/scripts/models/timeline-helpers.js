/** @constant {number} EXTRA_OFFSITE_OFFSET_PX Extra offsite offset in pixels to completely hide elements */
const EXTRA_OFFSITE_OFFSET_PX = 5;

/**
 * Calculate offsite position for x-axis.
 * @param {number} position Element percentage position on canvas
 * @param {number} width Element width/height.
 * @param {string} side Side to put offsite: Left|Right.
 * @returns {number} Offsite position percentage.
 */
const calculateOffsiteX = (position, width, side) => {
  let offset = 0;

  if (side.includes('Left')) {
    // eslint-disable-next-line no-magic-numbers
    offset = (position + width) / width * -100 - EXTRA_OFFSITE_OFFSET_PX;
  }
  else if (side.includes('Right')) {
     
    offset = (100 - position) / width * 100 + EXTRA_OFFSITE_OFFSET_PX;
  }

  return offset;
};

/**
 * Calculate offsite position for y-axis.
 * @param {number} position Element percentage position on canvas
 * @param {number} height Element height.
 * @param {string} side Side to put offsite: Top|Left.
 * @returns {number} Offsite position percentage.
 */
const calculateOffsiteY = (position, height, side) => {
  let offset = 0;

  if (side.includes('Top')) {
    // eslint-disable-next-line no-magic-numbers
    offset = (position + height) / height * -100 - EXTRA_OFFSITE_OFFSET_PX;
  }
  else if (side.includes('Bottom')) {
     
    offset = (100 - position) / height * 100 + EXTRA_OFFSITE_OFFSET_PX;
  }

  return offset;
};

/**
 * Helper function for 'flyIn' effect.
 * @param {object} animationParams Animation parameters for anime.js.
 * @param {object} geometry Element geometry.
 * @param {object} animation Animation parameters set by editor.
 */
export const createFlyInParams = (animationParams, geometry, animation) => {
  const offsiteXIn = calculateOffsiteX(geometry.x, geometry.width, animation.flyInDirection);
  const offsiteYIn = calculateOffsiteY(geometry.y, geometry.height, animation.flyInDirection);

  if (offsiteXIn !== 0) {
    animationParams.translateX = [
      { value: `${offsiteXIn}%`, duration: 0 },
      { value: '0%', duration: animationParams.duration },
    ];
  }

  if (offsiteYIn !== 0) {
    animationParams.translateY = [
      { value: `${offsiteYIn}%`, duration: 0 },
      { value: '0%', duration: animationParams.duration },
    ];
  }
};

/**
 * Helper function for 'fadeIn' effect.
 * @param {object} animationParams Animation parameters for anime.js.
 */
export const createFadeInParams = (animationParams) => {
  animationParams.opacity = [
    { value: 0, duration: 0 },
    { value: 1, duration: animationParams.duration },
  ];
};

/**
 * Helper function for 'zoomIn' effect.
 * @param {object} animationParams Animation parameters for anime.js.
 */
export const createZoomInParams = (animationParams) => {
  animationParams.scale = [
    { value: 0, duration: 0 },
    { value: 1, duration: animationParams.duration },
  ];
};

/**
 * Helper function for 'rotate' effect.
 * @param {object} animationParams Animation parameters for anime.js.
 * @param {object} geometry Element geometry.
 * @param {object} animation Animation parameters set by editor.
 */
export const createRotateParams = (animationParams, geometry, animation) => {
  animationParams.rotate = [
    { value: animation.rotate },
  ];
};

/**
 * Helper function for 'pulse' effect.
 * @param {object} animationParams Animation parameters for anime.js.
 */
export const createPulseParams = (animationParams) => {
  animationParams.scale = [
    { value: 1 },
    { value: 1.05 },
    { value: 1 },
  ];
};

/**
 * Helper function for 'wobble' effect.
 * @param {object} animationParams Animation parameters for anime.js.
 */
export const createWobbleParams = (animationParams) => {
  animationParams.translateX = [
    { value: 0 },
    { value: '-25%' },
    { value: '20%' },
    { value: '-15%' },
    { value: '10%' },
    { value: '-5%' },
    { value: 0 },
  ];
};

/**
 * Helper function for 'shakeX' effect.
 * @param {object} animationParams Animation parameters for anime.js.
 */
export const createShakeXParams = (animationParams) => {
  animationParams.translateX = [
    { value: 0 },
    { value: '-10%' },
    { value: '10%' },
    { value: '-10%' },
    { value: '10%' },
    { value: '-10%' },
    { value: 0 },
  ];
};

/**
 * Helper function for 'shakeY' effect.
 * @param {object} animationParams Animation parameters for anime.js.
 */
export const createShakeYParams = (animationParams) => {
  animationParams.translateY = [
    { value: 0 },
    { value: '-10%' },
    { value: '10%' },
    { value: '-10%' },
    { value: '10%' },
    { value: '-10%' },
    { value: 0 },
  ];
};

/**
 * Helper function for 'translate' effect.
 * @param {object} animationParams Animation parameters for anime.js.
 * @param {object} geometry Element geometry.
 * @param {object} animation Animation parameters set by editor.
 */
export const createTranslateParams = (animationParams, geometry, animation) => {
  animationParams.translateX = [{ value: `${animation.translateX}%` }];
  animationParams.translateY = [{ value: `${animation.translateY}%` }];
};

/**
 * Helper function for 'flyOut' effect.
 * @param {object} animationParams Animation parameters for anime.js.
 * @param {object} geometry Element geometry.
 * @param {object} animation Animation parameters set by editor.
 */
export const createFlyOutParams = (animationParams, geometry, animation) => {
  const offsiteXOut = calculateOffsiteX(geometry.x, geometry.width, animation.flyOutDirection);
  const offsiteYOut = calculateOffsiteY(geometry.y, geometry.height, animation.flyOutDirection);

  if (offsiteXOut !== 0) {
    animationParams.translateX = [
      { value: '0%', duration: 0 },
      { value: `${offsiteXOut}%`, duration: animationParams.duration },
    ];
  }

  if (offsiteYOut !== 0) {
    animationParams.translateY = [
      { value: '0%', duration: 0 },
      { value: `${offsiteYOut}%`, duration: animationParams.duration },
    ];
  }
};

/**
 * Helper function for 'fadeOut' effect.
 * @param {object} animationParams Animation parameters for anime.js.
 */
export const createFadeOutParams = (animationParams) => {
  animationParams.opacity = [
    { value: 1, duration: 0 },
    { value: 0, duration: animationParams.duration },
  ];
};

/**
 * Helper function for 'zoomOut' effect.
 * @param {object} animationParams Animation parameters for anime.js.
 */
export const createZoomOutParams = (animationParams) => {
  animationParams.scale = [
    { value: 1, duration: 0 },
    { value: 0, duration: animationParams.duration },
  ];
};
