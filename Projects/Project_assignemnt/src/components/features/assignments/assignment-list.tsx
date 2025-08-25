import { AssignmentCard } from './assignment-card';
import { useAssignmentStore } from '@/stores/assignments';

interface AssignmentListProps {
  isLoading?: boolean;
  onStatusUpdate?: () => void;
}

export function AssignmentList({ isLoading = false, onStatusUpdate }: AssignmentListProps) {
  const { getFilteredAssignments, selectedClassId, getUniqueClasses } = useAssignmentStore();
  const assignments = getFilteredAssignments();
  const classes = getUniqueClasses();
  
  // Get the selected class name for display
  const selectedClassName = selectedClassId !== null 
    ? classes.find(c => c.id === selectedClassId)?.name 
    : null;
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-24 bg-gray-100 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (assignments.length === 0) {
    const isFiltered = selectedClassId !== null;
    
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
          <svg
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            className="h-full w-full"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {isFiltered ? `No assignments in ${selectedClassName}` : 'No assignments yet'}
        </h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          {isFiltered 
            ? `There are no assignments for ${selectedClassName}. Try selecting a different class or add new assignments.`
            : "When you add assignments to your classes, they'll appear here in chronological order."
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {assignments.map((assignment) => (
        <AssignmentCard
          key={assignment.id}
          assignment={assignment}
          onStatusUpdate={onStatusUpdate}
        />
      ))}
    </div>
  );
}