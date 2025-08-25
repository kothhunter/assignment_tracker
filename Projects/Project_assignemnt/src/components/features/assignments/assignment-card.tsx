import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UrgencyIndicator } from '@/components/ui/urgency-indicator';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { format, isAfter, startOfDay } from 'date-fns';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { AssignmentWithClass } from '@/types';
import { cn, getRelativeDueDate } from '@/lib/utils';
import { api } from '@/lib/trpc';

interface AssignmentCardProps {
  assignment: AssignmentWithClass;
  onStatusUpdate?: () => void;
}

export function AssignmentCard({ assignment, onStatusUpdate }: AssignmentCardProps) {
  const router = useRouter();
  const dueDate = new Date(assignment.due_date);
  const today = startOfDay(new Date());
  const isOverdue = isAfter(today, startOfDay(dueDate)) && assignment.status === 'incomplete';
  const isComplete = assignment.status === 'complete';

  // Mutation to update assignment status
  const updateStatus = api.assignment.updateStatus.useMutation({
    onSuccess: () => {
      toast.success(
        isComplete 
          ? 'Assignment marked as incomplete' 
          : 'Assignment completed! 🎉'
      );
      onStatusUpdate?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update assignment status');
    },
  });

  const handleCardClick = () => {
    router.push(`/assignments/${assignment.id}`);
  };

  const handleStatusToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    const newStatus = isComplete ? 'incomplete' : 'complete';
    updateStatus.mutate({
      id: assignment.id,
      status: newStatus,
    });
  };

  return (
    <Card 
      data-testid="assignment-card"
      className={cn(
        "transition-all duration-200 hover:shadow-md cursor-pointer hover:scale-[1.02]",
        isOverdue && !isComplete && "border-red-200 bg-red-50/50",
        isComplete && "border-green-200 bg-green-50/50"
      )}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <button
              onClick={handleStatusToggle}
              disabled={updateStatus.isPending}
              className={cn(
                "mt-0.5 p-1 rounded-full transition-all duration-200 hover:bg-gray-100",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
                updateStatus.isPending && "opacity-50 cursor-not-allowed"
              )}
              title={isComplete ? "Mark as incomplete" : "Mark as complete"}
            >
              {updateStatus.isPending ? (
                <div className="h-5 w-5 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin" />
              ) : isComplete ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 hover:text-green-700" />
              ) : (
                <Circle className="h-5 w-5 text-gray-400 hover:text-blue-600" />
              )}
            </button>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <UrgencyIndicator 
                  dueDate={dueDate} 
                  isComplete={isComplete}
                  size="md"
                />
                <h3 className={cn(
                  "font-semibold text-base leading-6",
                  isComplete && "text-gray-500 line-through"
                )}>
                  {assignment.title}
                </h3>
              </div>
              <p className="text-xs text-gray-500">
                {assignment.class.name}
              </p>
            </div>
          </div>
          <Badge 
            variant={isComplete ? "secondary" : isOverdue ? "destructive" : "default"}
            className="ml-2 text-xs"
          >
            {isComplete ? "Complete" : isOverdue ? "Overdue" : "Pending"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center text-sm">
          <Clock className="h-4 w-4 mr-2" />
          <span className={cn(
            "font-medium",
            isOverdue && !isComplete ? "text-red-600" : "text-gray-700"
          )}>
            {getRelativeDueDate(dueDate)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}