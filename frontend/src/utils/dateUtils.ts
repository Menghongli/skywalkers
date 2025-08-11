const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const isTomorrow = (date: Date): boolean => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date.toDateString() === tomorrow.toDateString();
};

const isThisWeek = (date: Date): boolean => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  return date >= startOfWeek && date <= endOfWeek;
};

const isThisYear = (date: Date): boolean => {
  const today = new Date();
  return date.getFullYear() === today.getFullYear();
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

const formatDateWithYear = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const getDayName = (date: Date): string => {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

export const formatGameDateTime = (datetime: Date): string => {
  try {
    if (isToday(datetime)) {
      return `Today, ${formatTime(datetime)}`;
    }
    
    if (isTomorrow(datetime)) {
      return `Tomorrow, ${formatTime(datetime)}`;
    }
    
    if (isThisWeek(datetime)) {
      return `${getDayName(datetime)}, ${formatTime(datetime)}`;
    }
    
    if (isThisYear(datetime)) {
      return `${formatDate(datetime)}, ${formatTime(datetime)}`;
    }
    
    return `${formatDateWithYear(datetime)}, ${formatTime(datetime)}`;
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return datetime.toString();
  }
};

export const formatGameDate = (datetime: Date): string => {
  try {
    if (isToday(datetime)) {
      return 'Today';
    }
    
    if (isTomorrow(datetime)) {
      return 'Tomorrow';
    }
    
    if (isThisWeek(datetime)) {
      return getDayName(datetime);
    }
    
    if (isThisYear(datetime)) {
      return formatDate(datetime);
    }
    
    return formatDateWithYear(datetime);
  } catch (error) {
    console.error('Error formatting date:', error);
    return datetime.toString();
  }
};

export const formatGameTime = (datetime: Date): string => {
  try {
    return formatTime(datetime);
  } catch (error) {
    console.error('Error formatting time:', error);
    return datetime.toString();
  }
};