export default class DateType {
  static async parse(str, locale) {
    const now = new Date();
    let date, matches;

    // Match '2', '2.', '22', '22.'.
    if (str.match(/^(\d{1,2})(\.)?$/)) {
      date = new Date();
      date.setDate(str);
      // If date in past: set it to next month.
      if (date < now) {
        date.setMonth(date.getMonth() + 1);
      }
    }
    // Match '22.11' and '22.11.'
    if ((matches = str.match(/^(\d{1,2})\.(\d{1,2})(\.)?$/))) {
      const [, day, month] = matches;
      date = new Date();
      date.setMonth(month - 1, day);
      if (date < now) {
        date.setFullYear(date.getFullYear() + 1);
      }
    }
    // Match '22.11.13'
    if ((matches = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2})?$/))) {
      const [, day, month, year] = matches;
      date = new Date(`${month}, ${day} ${year}`);
    }
    // Match '22.11.2013'
    if ((matches = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})?$/))) {
      const [, day, month, year] = matches;
      date = new Date(`${month}, ${day} ${year}`);
    }

    // Match '11/22'.
    if ((matches = str.match(/^(\d{1,2})\/(\d{1,2})$/))) {
      const [, month, day] = matches;
      date = new Date();
      date.setMonth(month - 1, day);
      if (date < now) {
        date.setFullYear(date.getFullYear() + 1);
      }
    }
    // Match '11/22/13'
    if ((matches = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})?$/))) {
      const [, month, day, year] = matches;
      date = new Date(`${month}, ${day} ${year}`);
    }
    // Match '11/22/2013'
    if ((matches = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})?$/))) {
      const [, month, day, year] = matches;
      date = new Date(`${month}, ${day} ${year}`);
    }
    // Match '+1' or '-2'
    if ((matches = str.match(/^(-|\+)(\d+)$/))) {
      const [, operator, offset] = matches;
      switch (operator) {
        case '+':
          date = new Date();
          date.setDate(date.getDate() + parseInt(offset));
          break;
        case '-':
          date = new Date();
          date.setDate(date.getDate() - parseInt(offset));
          break;
      }
    }
    // Match 'Su', 'Mo', ...
    if ((matches = str.match(/^([A-Za-z\u00E0-\u00FC]+)$/))) {
      let maps = [];
      switch (locale.substr(0, 2)) {
        case 'cs':
          maps.push('ne po út st čt pá so');
          maps.push('ne po ut st ct pa so');
          break;
        case 'de':
          maps.push('so mo di mi do fr sa');
          break;
        case 'en':
          maps.push('u m t w r f s');
          maps.push('su mo tu we th fr sa');
          maps.push('sun mon tue wed thu fri sat');
          break;
        case 'es':
          maps.push('do lu ma mi ju vi sá');
          maps.push('do lu ma mi ju vi sa');
          break;
        case 'pl':
          maps.push('nd pn wt śr cz pt so');
          maps.push('nd pn wt sr cz pt so');
          break;
        case 'sk':
          maps.push('ne po ut st št pi so');
          break;
      }
      for (const map of maps) {
        const mapArray = map.split(' ');
        const desired_day_of_week_index = mapArray.indexOf(str.toLowerCase());
        if (desired_day_of_week_index > -1) {
          date = new Date();
          date.setDate(
            date.getDate() + desired_day_of_week_index - date.getDay(),
          );
          if (date < now) {
            date.setDate(date.getDate() + 7);
          }
          break;
        }
      }
    }

    return date;
  }
}
