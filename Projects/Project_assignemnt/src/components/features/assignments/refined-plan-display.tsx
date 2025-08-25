'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, Clock, Download, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { AssignmentPlan, SubTask } from '@/types';

interface RefinedPlanDisplayProps {
  plan: AssignmentPlan;
  assignmentId: number;
}

interface SubTaskCardProps {
  subTask: SubTask;
  index: number;
  onEdit?: (subTask: SubTask) => void;
}

function SubTaskCard({ subTask, index, onEdit }: SubTaskCardProps) {
  const statusColors = {
    pending: 'bg-gray-100 text-gray-700 border-gray-200',
    in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-green-100 text-green-700 border-green-200'
  };

  const statusIcons = {
    pending: <Clock className="h-4 w-4" />,
    in_progress: <Loader2 className="h-4 w-4 animate-spin" />,
    completed: <CheckCircle className="h-4 w-4" />
  };

  return (
    <Card className="transition-all hover:shadow-md" role="article">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-medium">
              {subTask.step_number || index + 1}
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-gray-900">
                {subTask.title}
              </CardTitle>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={`${statusColors[subTask.status]} flex items-center gap-1`}
            >
              {statusIcons[subTask.status]}
              {subTask.status.replace('_', ' ')}
            </Badge>
            {onEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(subTask)}>
                    Edit Details
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      {(subTask.description || subTask.generated_prompt) && (
        <CardContent className="pt-0">
          {subTask.description && (
            <p className="text-sm text-gray-600 whitespace-pre-wrap mb-3">
              {subTask.description}
            </p>
          )}
          {subTask.generated_prompt && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
              <h5 className="font-medium text-amber-900 mb-1 text-xs">Generated Prompt</h5>
              <p className="text-xs text-amber-800 whitespace-pre-wrap">
                {subTask.generated_prompt}
              </p>
            </div>
          )}
          <div className="flex items-center justify-between text-xs text-gray-500">
            {subTask.estimated_hours && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {subTask.estimated_hours} hour{subTask.estimated_hours !== 1 ? 's' : ''}
              </div>
            )}
            <div className="text-gray-400">
              Step {subTask.step_number || index + 1}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export function RefinedPlanDisplay({ plan, assignmentId }: RefinedPlanDisplayProps) {
  const [selectedSubTask, setSelectedSubTask] = useState<SubTask | null>(null);

  // Memoize calculations to prevent unnecessary re-renders
  const { completedTasks, totalTasks, completionPercentage, pendingTasks, inProgressTasks } = useMemo(() => {
    const completed = plan.sub_tasks.filter(task => task.status === 'completed').length;
    const pending = plan.sub_tasks.filter(task => task.status === 'pending').length;
    const inProgress = plan.sub_tasks.filter(task => task.status === 'in_progress').length;
    const total = plan.sub_tasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return {
      completedTasks: completed,
      totalTasks: total,
      completionPercentage: percentage,
      pendingTasks: pending,
      inProgressTasks: inProgress,
    };
  }, [plan.sub_tasks]);

  const handleDownloadPlan = () => {
    // Create a simple text export of the plan
    const planText = `Assignment Plan: ${plan.assignment_id}
Generated on: ${plan.created_at ? new Date(plan.created_at).toLocaleDateString() : new Date().toLocaleDateString()}

Original Instructions:
${plan.original_instructions}

Sub-Tasks (${totalTasks} total):
${plan.sub_tasks
  .sort((a, b) => (a.step_number || a.order_index) - (b.step_number || b.order_index))
  .map((task, index) => `
${task.step_number || index + 1}. ${task.title}
   Status: ${task.status}
   ${task.description ? `Description: ${task.description}` : ''}
   ${task.estimated_hours ? `Estimated Hours: ${task.estimated_hours}` : ''}
   ${task.generated_prompt ? `Prompt: ${task.generated_prompt}` : ''}
`).join('\n')}`;

    const blob = new Blob([planText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assignment-plan-${assignmentId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Plan Overview Card */}
      <Card className="sticky top-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-gray-900 mb-1">
                Current Plan
              </CardTitle>
              <p className="text-sm text-gray-600">
                {totalTasks} sub-tasks • {completionPercentage}% complete
              </p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-blue-600">{completionPercentage}%</div>
              <div className="text-xs text-gray-500">Complete</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-4 text-xs">
              <span className="text-gray-600">
                <strong>{totalTasks}</strong> total
              </span>
              <span className="text-yellow-600">
                <strong>{pendingTasks}</strong> pending
              </span>
              <span className="text-blue-600">
                <strong>{inProgressTasks}</strong> in progress
              </span>
              <span className="text-green-600">
                <strong>{completedTasks}</strong> completed
              </span>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleDownloadPlan}>
              <Download className="h-4 w-4 mr-2" />
              Export Plan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Refinement Instructions */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <h4 className="font-medium text-blue-900 mb-2">💬 How to Refine Your Plan</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• Use the chat to modify your sub-tasks with natural language</p>
            <p>• Examples: &quot;add a step about research&quot;, &quot;remove step 3&quot;, &quot;change step 2 to focus on analysis&quot;</p>
            <p>• The AI will update your plan in real-time based on your requests</p>
          </div>
        </CardContent>
      </Card>

      {/* Sub-Tasks List */}
      <div className="space-y-3">
        <h3 className="text-md font-semibold text-gray-900 px-1">
          Sub-Tasks ({totalTasks})
        </h3>
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {plan.sub_tasks
            .sort((a, b) => (a.step_number || a.order_index) - (b.step_number || b.order_index))
            .map((subTask, index) => (
              <SubTaskCard 
                key={subTask.id} 
                subTask={subTask} 
                index={index}
                onEdit={setSelectedSubTask}
              />
            ))}
        </div>
      </div>

      {/* Show empty state if no sub-tasks */}
      {plan.sub_tasks.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No sub-tasks available yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}