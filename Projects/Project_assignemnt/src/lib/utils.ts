import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get relative date string for assignment due dates
 */
export function getRelativeDueDate(dueDate: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  
  const timeDiff = due.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  
  if (daysDiff < 0) {
    const overdueDays = Math.abs(daysDiff);
    if (overdueDays === 1) return "Overdue by 1 day";
    return `Overdue by ${overdueDays} days`;
  } else if (daysDiff === 0) {
    return "Due today";
  } else if (daysDiff === 1) {
    return "Due tomorrow";
  } else if (daysDiff <= 7) {
    return `Due in ${daysDiff} days`;
  } else if (daysDiff <= 14) {
    const weeks = Math.ceil(daysDiff / 7);
    return `Due in ${weeks} week${weeks > 1 ? 's' : ''}`;
  } else {
    // For dates far in the future, show the actual date
    return `Due ${dueDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: dueDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })}`;
  }
}

/**
 * Get urgency level based on due date
 */
export function getUrgencyLevel(dueDate: Date, isComplete: boolean = false): 'high' | 'medium' | 'low' | 'none' {
  if (isComplete) return 'none';
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  
  const timeDiff = due.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  
  if (daysDiff <= 0) return 'high'; // Overdue or due today
  if (daysDiff <= 3) return 'medium'; // Due within 3 days
  return 'low'; // Due later
}

/**
 * Get urgency indicator color classes
 */
export function getUrgencyColor(urgency: 'high' | 'medium' | 'low' | 'none'): string {
  switch (urgency) {
    case 'high':
      return 'bg-red-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'low':
      return 'bg-green-500';
    case 'none':
    default:
      return 'bg-gray-300';
  }
}

/**
 * Check if a user is new and should see onboarding
 */
export function isNewUser(
  profile: { has_completed_onboarding?: boolean; created_at?: string } | null,
  assignments: any[] = [],
  classes: any[] = []
): boolean {
  if (!profile) return false;
  
  // Check if onboarding was explicitly completed
  if (profile.has_completed_onboarding === true) return false;
  
  // Consider user new if they have no assignments and no classes
  if (assignments.length === 0 && classes.length === 0) return true;
  
  // Consider user new if account was created recently (within 24 hours) and no onboarding flag
  if (profile.created_at && !profile.has_completed_onboarding) {
    const createdAt = new Date(profile.created_at);
    const now = new Date();
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceCreation < 24;
  }
  
  return false;
}