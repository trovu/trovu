import moment from 'moment';

export default class TimeParser {
  static async parse(str, locale) {
    let time;

    let now = moment();

    // Match '2', '2.', '22', '22.'.
    if (str.match(/^(\d{1,2})(\.)?$/)) {
      time = moment(str, "DD");
      // If time in past: set it to next month.
      if (time < now) {
        time.add(1, "month");
      }
    }
    // Match '11'
    if (str.match(/^(\d+)$/)) {
      time = moment(str, "HH");
    }
    // Match '11:23' and '11.23'
    if (str.match(/^(\d+)(\.|:)(\d+)$/)) {
      time = moment(str, "HH:mm");
    }
    // Match '+1' and '-2'
    let matches = str.match(/^(-|\+)(\d+)$/);
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

    return time;
  }
}
