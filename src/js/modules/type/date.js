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
    if (matches = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2})?$/)) {
      const [, day, month, year] = matches;
      date = new Date(`${month}, ${day} ${year}`);
    }
    // Match '22.11.2013'
    if (matches = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})?$/)) {
      const [, day, month, year] = matches;
      date = new Date(`${month}, ${day} ${year}`);
    }

    // Match '11/22'.
    if (matches = str.match(/^(\d{1,2})\/(\d{1,2})$/)) {
      const [, month, day] = matches;
      date.setMonth(month-1, day);
      if (date < now) {
        date.setFullYear(date.getFullYear() + 1);
      }
    }
    // Match '11/22/13'
    if (matches = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})?$/)) {
      const [, month, day, year] = matches;
      date = new Date(`${month}, ${day} ${year}`);
    }
    // Match '11/22/2013'
    if (matches = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})?$/)) {
      const [, month, day, year] = matches;
      date = new Date(`${month}, ${day} ${year}`);
    }
    // Match '+1' or '-2'
    if (matches = str.match(/^(-|\+)(\d+)$/)) {
      const [, operator, offset] = matches;
      switch (operator) {
        case "+":
          date.setDate(date.getDate() + parseInt(offset));
          break;
        case "-":
          date.setDate(date.getDate() - parseInt(offset));
          break;
      }
    }
    // Match 'Su', 'Mo', ...
    if (matches = str.match(/^([A-Za-z\u00E0-\u00FC]+)$/)) {
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
