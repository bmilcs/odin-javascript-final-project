import { differenceInYears, isBefore, parse } from 'date-fns';

export const isAFutureDate = (dateString: string) => {
  const today = new Date();
  const parsedDate = parse(dateString, 'yyyy-MM-dd', new Date());
  return isBefore(today, parsedDate);
};

export const formatDateNumberOfYearsPassed = (dateString: string) => {
  const today = new Date();
  const parsedDate = parse(dateString, 'yyyy-MM-dd', new Date());
  const age = differenceInYears(today, parsedDate);
  return age;
};

export const isDateOneBeforeDateTwo = (dateOne: string, dateTwo: string) => {
  const parsedDateOne = parse(dateOne, 'yyyy-MM-dd', new Date());
  const parsedDateTwo = parse(dateTwo, 'yyyy-MM-dd', new Date());
  return isBefore(parsedDateOne, parsedDateTwo);
};

export const formatDateYearOnly = (date: string) => {
  return date.split('-')[0];
};

// export const formatDateFullDate = (date: string) => {};
