/**
 * Format a date string to a readable format
 * @param dateString ISO date string
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString; // Return original if invalid
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format a date time string to a readable format including time
 * @param dateString ISO date string
 * @returns Formatted date and time string
 */
export function formatDateTime(dateString: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString; // Return original if invalid
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit', 
    minute: '2-digit'
  });
}

/**
 * Check if a date is in the past
 * @param dateString ISO date string
 * @returns boolean
 */
export function isPastDate(dateString: string): boolean {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;
  
  const now = new Date();
  return date < now;
}

/**
 * Format a relative time (e.g., "2 days ago", "in 3 hours")
 * @param dateString ISO date string
 * @returns Relative time string
 */
export function formatRelativeTime(dateString: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);
  
  if (diffDay > 30 || diffDay < -30) {
    return formatDate(dateString);
  }
  
  if (diffDay > 0) {
    return `in ${diffDay} ${diffDay === 1 ? 'day' : 'days'}`;
  } else if (diffDay < 0) {
    return `${Math.abs(diffDay)} ${Math.abs(diffDay) === 1 ? 'day' : 'days'} ago`;
  } else if (diffHour > 0) {
    return `in ${diffHour} ${diffHour === 1 ? 'hour' : 'hours'}`;
  } else if (diffHour < 0) {
    return `${Math.abs(diffHour)} ${Math.abs(diffHour) === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffMin > 0) {
    return `in ${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'}`;
  } else if (diffMin < 0) {
    return `${Math.abs(diffMin)} ${Math.abs(diffMin) === 1 ? 'minute' : 'minutes'} ago`;
  } else {
    return 'just now';
  }
} 