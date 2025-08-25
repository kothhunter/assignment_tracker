import { AssignmentList } from './assignment-list';
import { AssignmentForm } from './assignment-form';
import { AssignmentFilter } from './assignment-filter';
import { useAssignmentStore } from '@/stores/assignments';
import { useEffect } from 'react';
import type { AssignmentWithClass } from '@/types';

interface DashboardProps {
  assignments: AssignmentWithClass[];
  isLoading?: boolean;
  error?: string | null;
  onAssignmentCreated?: () => void;
  onStatusUpdate?: () => void;
}

export function Dashboard({ assignments, isLoading = false, error, onAssignmentCreated, onStatusUpdate }: DashboardProps) {
  const { setAssignments, getFilteredAssignments } = useAssignmentStore();
  
  // Sync assignments to store when they change
  useEffect(() => {
    if (assignments) {
      setAssignments(assignments);
    }
  }, [assignments, setAssignments]);

  // Get filtered assignments for statistics
  const filteredAssignments = getFilteredAssignments();
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50/50 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-red-300 mb-4">
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
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Something went wrong
            </h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600">
            Your assignments, organized by due date
          </p>
        </div>

        {/* Assignment Statistics */}
        {!isLoading && assignments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="text-2xl font-bold text-gray-900">
                {filteredAssignments.length}
              </div>
              <div className="text-sm text-gray-500">Total Assignments</div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="text-2xl font-bold text-green-600">
                {filteredAssignments.filter(a => a.status === 'complete').length}
              </div>
              <div className="text-sm text-gray-500">Completed</div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="text-2xl font-bold text-orange-600">
                {filteredAssignments.filter(a => {
                  const dueDate = new Date(a.due_date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  dueDate.setHours(0, 0, 0, 0);
                  return dueDate < today && a.status === 'incomplete';
                }).length}
              </div>
              <div className="text-sm text-gray-500">Overdue</div>
            </div>
          </div>
        )}

        {/* Assignments List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Assignments
              </h2>
              <AssignmentForm onSuccess={onAssignmentCreated} />
            </div>
            <div className="flex items-center justify-between">
              <AssignmentFilter />
              <div className="text-sm text-gray-500">
                {filteredAssignments.length} assignment{filteredAssignments.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          <div className="p-6">
            <AssignmentList
              isLoading={isLoading}
              onStatusUpdate={onStatusUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}