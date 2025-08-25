import { cn, getUrgencyLevel, getUrgencyColor } from '@/lib/utils';

interface UrgencyIndicatorProps {
  dueDate: Date;
  isComplete?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function UrgencyIndicator({ 
  dueDate, 
  isComplete = false, 
  size = 'sm',
  className = '' 
}: UrgencyIndicatorProps) {
  const urgency = getUrgencyLevel(dueDate, isComplete);
  const colorClass = getUrgencyColor(urgency);
  
  if (urgency === 'none') return null;
  
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3'
  };
  
  const urgencyLabels = {
    high: 'High urgency - due today or overdue',
    medium: 'Medium urgency - due within 3 days', 
    low: 'Low urgency - due later',
    none: ''
  };
  
  return (
    <div 
      className={cn(
        'rounded-full flex-shrink-0',
        sizeClasses[size],
        colorClass,
        className
      )}
      title={urgencyLabels[urgency]}
      aria-label={urgencyLabels[urgency]}
    />
  );
}