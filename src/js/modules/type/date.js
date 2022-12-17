import moment from 'moment';

export default class DateParser {
  static async parse(str, locale) {
    moment.locale(locale);

    const now = new Date();
    let date = new Date();
    let matches;

    // Match '2', '2.', '22', '22.'.
    if (str.match(/^(\d{1,2})(\.)?$/)) {
      date.setDate(str)
      // If date in past: set it to next month.
      if (date < now) {
        date.setMonth(date.getMonth() + 1);
      }
    }
    // Match '22.11' and '22.11.'
    if (matches = str.match(/^(\d{1,2})\.(\d{1,2})(\.)?$/)) {
      const [, day, month] = matches;
      date.setMonth(month-1, day);
      if (date < now) {
        date.setFullYear(date.getFullYear() + 1);
      }
    }
    // Match '22.11.13'
    if (str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2})?$/)) {
      date = moment(str, "DD.MM.YY");
    }
    // Match '22.11.2013'
    if (str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})?$/)) {
      date = moment(str, "DD.MM.YYYY");
    }

    // Match '11/22'.
    if (str.match(/^(\d{1,2})\/(\d{1,2})$/)) {
      date = moment(str, "MM/DD");
      // If date in past: set it to next year.
      if (date < now) {
        date.add(1, "year");
      }
    }
    // Match '11/22/13'
    if (str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})?$/)) {
      date = moment(str, "MM/DD/YY");
    }
    // Match '11/22/2013'
    if (str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})?$/)) {
      date = moment(str, "MM/DD/YYYY");
    }
    // Match '+1' or '-2'
    if (matches = str.match(/^(-|\+)(\d+)$/)) {
      date = now;
      switch (matches[1]) {
        case "+":
          date.add(matches[2], "days");
          break;
        case "-":
          date.subtract(matches[2], "days");
          break;
      }
    }
    // Match 'Su', 'Mo', ...
    if (str.match(/^([A-Za-z\u00E0-\u00FC]+)$/)) {
      date = moment().day(str);
      if (date < now) {
        date.add(1, "week");
      }
    }

    // Temporary code, until we replace moment's .format().
    const dateMoment = moment(date);
    return dateMoment;
  }
}
