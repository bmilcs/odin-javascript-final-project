import { differenceInYears, parse } from "date-fns";

export const formatDateNumberOfYearsPassed = (dateString: string) => {
  const today = new Date();
  const parsedDate = parse(dateString, "yyyy-MM-dd", new Date());
  const age = differenceInYears(today, parsedDate);
  return age;
};

export const formatDateYearOnly = (date: string) => {
  return date.split("-")[0];
};

export const formatDateFullDate = (date: string) => {};
