import moment from 'moment';

export default class TimeParser {
  static async parse(str, locale) {
    let time;

    let now = moment();

    // Match '11'
    if (str.match(/^(\d+)$/)) {
      time = moment(str, "HH");
    }
    // Match '11:23' and '11.23'
    if (str.match(/^(\d+)(\.|:)(\d+)$/)) {
      time = moment(str, "HH:mm");
    }
    // Match '+1' and '-2'
    const matches = str.match(/^(-|\+)(\d+)$/);
    if (matches) {
      time = now;
      switch (matches[1]) {
        case "+":
          time.add(matches[2], "hours");
          break;
        case "-":
          time.subtract(matches[2], "hours");
          break;
      }
    }

    // Temporary code, until we replace moment's .format().
    const timeMoment = moment(time);
    return timeMoment;

    return time;
  }
}
