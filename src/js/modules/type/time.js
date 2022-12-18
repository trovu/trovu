import moment from 'moment';

export default class TimeParser {
  static async parse(str, locale) {

    const now = new Date();
    let time, matches;

    // Match '11'
    if (matches = str.match(/^(\d+)$/)) {
      time = new Date();
      time.setHours(str);
      time.setMinutes(0);
    }
    // Match '11:23' and '11.23'
    if (matches = str.match(/^(\d+)(\.|:)(\d+)$/)) {
      const [, hours, minutes] = matches;
      time = new Date();
      time.setHours(hours);
      time.setMinutes(minutes);
    }
    // Match '+1' and '-2'
    if (matches = str.match(/^(-|\+)(\d+)$/)) {
      time = new Date();
      const [, operator, offset] = matches;
      switch (operator) {
        case "+":
          time.setHours(time.getHours() + parseInt(offset));
          break;
        case "-":
          time.setHours(time.getHours() - parseInt(offset));
          break;
      }
    }

    // Temporary code, until we replace moment's .format().
    const timeMoment = moment(time);
    return timeMoment;

    return time;
  }
}
