import Util from '@services/util.js';

/** @constant {number} MS_IN_S Milliseconds in a second. Not a perfect constant, I know. */
export const MS_IN_S = 1000;

/**
 * Convert seconds to milliseconds.
 * @param {number} timeS Time in seconds.
 * @returns {number|undefined} Time in milliseconds.
 */
export const secondsToMilliseconds = (timeS) => {
  if (typeof timeS !== 'number') {
    return;
  }

  return timeS * MS_IN_S;
};

/**
 * Convert milliseconds to seconds.
 * @param {number} timeMs Time in milliseconds.
 * @returns {number|undefined} Time in seconds.
 */
export const millisecondsToSeconds = (timeMs) => {
  if (typeof timeMs !== 'number') {
    return;
  }

  return timeMs / MS_IN_S;
};

/**
 * Convert time in seconds to timecode.
 * @param {number} timeS Time in seconds.
 * @param {object} options Options.
 * @param {boolean} [options.padHours] If true, pad hours.
 * @param {boolean} [options.padMinutes] If true, pad minutes.
 * @returns {string} Timecode.
 */
export const toTimecode = (timeS, options = {}) => {
  if (typeof timeS !== 'number') {
    return '';
  }

  const date = new Date(0);
  date.setSeconds(Math.round(Math.max(0, timeS)));

  // Timecode as HH:MM:SS.
  let timecode = date.toISOString().split('T')[1].split('.')[0];

  if (options.padHours) {
    return timecode;
  }
  else if (options.padMinutes) {
    return timecode.replace(/^(00:)/, '') || '0';
  }
  else {
    return timecode.replace(/^(00:)+/, '') || '0';
  }
};

/**
 * Convert time in seconds to human readable time.
 * @param {number} timeS Time in seconds.
 * @param {object} [options] Options.
 * @returns {string} Human readable time.
 */
export const toHumanTime = (timeS, options = {}) => {
  options = Util.extend({
    timeLabels: {
      hours: 'hours',
      hour: 'hour',
      minutes: 'minutes',
      minute: 'minute',
      seconds: 'seconds',
      second: 'second',
      humanTimePattern: '@hours @hourLabel, @minutes @minuteLabel, @seconds @secondLabel'
    }
  }, options);

  if (typeof timeS !== 'number') {
    return '';
  }

  const timecode = toTimecode(timeS);
  const segments = timecode.split(':');

  const humanTimeSegments = [];
  // eslint-disable-next-line no-magic-numbers
  if (segments.length > 2) {
    const hoursValue = parseInt(segments[0]);
    const hoursLabel = (hoursValue === 1) ?
      options.timeLabels.hour :
      options.timeLabels.hours;
    humanTimeSegments.push(`${hoursValue} ${hoursLabel}`);
  }

  if (segments.length > 1) {
    // eslint-disable-next-line no-magic-numbers
    const minutesValue = parseInt(segments[segments.length - 2]);
    const minutesLabel = (minutesValue === 1) ?
      options.timeLabels.minute :
      options.timeLabels.minutes;
    humanTimeSegments.push(`${minutesValue} ${minutesLabel}`);
  }

  const secondsValue = parseInt(segments[segments.length - 1]);
  const secondsLabel = (secondsValue === 1) ?
    options.timeLabels.second :
    options.timeLabels.seconds;
  humanTimeSegments.push(`${secondsValue} ${secondsLabel}`);

  return humanTimeSegments.join(', ');
};

/**
 * Convert time in seconds to ARIA datetime.
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/time
 * @param {number} timeS Time in seconds.
 * @returns {string} ARIA datetime duration.
 */
export const toAriaDatetime = (timeS) => {
  if (typeof timeS !== 'number') {
    return '';
  }

  const timecode = toTimecode(timeS);
  const segments = timecode.split(':');

  const ariaDateTimeSegments = [];
  // eslint-disable-next-line no-magic-numbers
  if (segments.length > 2) {
    const hoursValue = parseInt(segments[0]);
    ariaDateTimeSegments.push(`${hoursValue.toString()}h`);
  }

  if (segments.length > 1) {
    // eslint-disable-next-line no-magic-numbers
    const minutesValue = parseInt(segments[segments.length - 2]);
    ariaDateTimeSegments.push(`${minutesValue.toString()}m`);
  }

  const secondsValue = parseInt(segments[segments.length - 1]);
  ariaDateTimeSegments.push(`${secondsValue.toString()}s`);

  return ariaDateTimeSegments.join(' ');
};
