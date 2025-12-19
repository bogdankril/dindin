

export const formatDateTime = (timestamp: Date | number | string | undefined | null): string => {
  if (!timestamp) return '';
  let date: Date = new Date(timestamp);
  return date.toLocaleString();
};

export const formatDateForInput = (timestamp: Date | number | string | undefined | null): string => {
  if (!timestamp) return '';
  let date: Date = new Date(timestamp);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
};

export const formatTimeForInput = (timestamp: Date | number | string | undefined | null): string => {
  if (!timestamp) return '';
  let date: Date = new Date(timestamp);
  return date.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
};

export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
};

export const getPreviousWorkDay = (date: Date): Date => {
  let newDate = new Date(date);
  do {
    newDate.setDate(newDate.getDate() - 1);
  } while (isWeekend(newDate));
  return newDate;
};

export const getNextWorkDay = (date: Date): Date => {
  let newDate = new Date(date);
  do {
    newDate.setDate(newDate.getDate() + 1);
  } while (isWeekend(newDate));
  return newDate;
};

    