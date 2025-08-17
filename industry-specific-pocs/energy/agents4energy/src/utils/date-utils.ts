import { format, parseISO } from 'date-fns';

export const formatDate = (dateString: string): string => {
    const date = parseISO(dateString);
    return format(date, 'MMM d, yyyy HH:mm:ss');
  };