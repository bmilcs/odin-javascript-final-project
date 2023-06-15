// date functions
const { parseISO, isAfter, parse, isBefore, isSameDay, format, addDays } = require('date-fns');

const getTodayObj = () => new Date();

const getDateObj = (dateString: string) => parse(dateString, 'yyyy-MM-dd', new Date());

const formatDate = (dateObj: Date) => format(dateObj, 'yyyy-MM-dd');

const isAFutureDate = (dateString: string) => {
  const date = getDateObj(dateString);
  return isBefore(getTodayObj(), date);
};

const isToday = (dateString: string) => {
  const date = getDateObj(dateString);
  return isSameDay(getTodayObj(), date);
};

const isSpecialNotReleasedYet = (date: string) => {
  return isAFutureDate(date);
};

const isSpecialReleasedToday = (date: string) => {
  return isToday(date);
};

const getReleaseDateType = (special: IRawSpecial) => {
  if (isSpecialNotReleasedYet(special.release_date)) return 'upcoming';
  else if (isSpecialReleasedToday(special.release_date)) return 'today';
  else return 'available';
};

const sortByReleaseDate = (specials: IRawSpecial[]) => {
  return specials.sort((a, b) =>
    isAfter(parseISO(a.release_date), parseISO(b.release_date)) ? 1 : -1,
  );
};

module.exports = {
  getTodayObj,
  getDateObj,
  formatDate,
  isSpecialNotReleasedYet,
  isSpecialReleasedToday,
  parseISO,
  isAfter,
  getReleaseDateType,
  sortByReleaseDate,
};
