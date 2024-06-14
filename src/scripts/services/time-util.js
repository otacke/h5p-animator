import Util from '@services/util.js';

export default class TimeUtil {
  /**
   * Convert time in ms to timecode.
   * @param {number} timeS Time in s.
   * @param {object} [options] Options.
   * @returns {string} Timecode.
   */
  static toTimecode(timeS, options = {}) {
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
  }

  /**
   * Convert time in seconds to human readable time.
   * @param {number} timeS Time in seconds.
   * @param {object} [options] Options.
   * @returns {string} Human readable time.
   */
  static toHumanTime(timeS, options = {}) {
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

    const timecode = TimeUtil.toTimecode(timeS);
    const segments = timecode.split(':');

    const humanTimeSegments = [];
    if (segments.length > 2) {
      const hoursValue = parseInt(segments[0]);
      const hoursLabel = (hoursValue === 1) ?
        options.timeLabels.hour :
        options.timeLabels.hours;
      humanTimeSegments.push(`${hoursValue} ${hoursLabel}`);
    }

    if (segments.length > 1) {
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
  }
}
