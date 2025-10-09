import { getISOWeek } from "date-fns";

function getTimeBuckets(createdAt: string | Date) {
  const date = new Date(createdAt);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    week: getISOWeek(date),
  };
}

export default getTimeBuckets;