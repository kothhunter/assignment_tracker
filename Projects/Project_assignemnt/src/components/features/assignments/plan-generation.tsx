'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AIThinkingState } from '@/components/ui/ai-thinking-state';
import { Loader2, RefreshCw, CheckCircle, Clock, ArrowRight, AlertCircle } from 'lucide-react';
import type { AssignmentPlan, SubTask } from '@/types';

interface PlanGenerationDisplayProps {
  plan?: AssignmentPlan | null;
  isGenerating: boolean;
  onRetryGeneration: () => void;
  onProceedToRefinement: () => void;
}

interface SubTaskCardProps {
  subTask: SubTask;
  index: number;
}

function SubTaskCard({ subTask, index }: SubTaskCardProps) {
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
              {index + 1}
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-gray-900">
                {subTask.title}
              </CardTitle>
            </div>
          </div>
          <Badge 
            variant="secondary" 
            className={`${statusColors[subTask.status]} flex items-center gap-1`}
          >
            {statusIcons[subTask.status]}
            {subTask.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      {subTask.description && (
        <CardContent className="pt-0">
          <p className="text-sm text-gray-600 whitespace-pre-wrap">
            {subTask.description}
          </p>
          {subTask.estimated_hours && (
            <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Estimated: {subTask.estimated_hours} hour{subTask.estimated_hours !== 1 ? 's' : ''}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function LoadingState() {
  return (
    <AIThinkingState 
      title="Generating Your Plan"
      className="border-blue-200 shadow-lg"
    />
  );
}

function EmptyState({ onRetryGeneration }: { onRetryGeneration: () => void }) {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-yellow-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          No Plan Generated Yet
        </h3>
        <p className="text-gray-600 mb-6">
          It looks like the AI hasn&apos;t generated your sub-task plan yet. This might be due to a temporary issue.
        </p>
        <Button onClick={onRetryGeneration} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Generate Plan Now
        </Button>
      </CardContent>
    </Card>
  );
}

function GeneratedPlan({ plan, onProceedToRefinement }: { plan: AssignmentPlan; onProceedToRefinement: () => void }) {
  // Memoize calculations to prevent unnecessary re-renders
  const { completedTasks, totalTasks, completionPercentage, pendingTasks } = useMemo(() => {
    const completed = plan.sub_tasks.filter(task => task.status === 'completed').length;
    const total = plan.sub_tasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const pending = plan.sub_tasks.filter(task => task.status === 'pending').length;
    
    return {
      completedTasks: completed,
      totalTasks: total,
      completionPercentage: percentage,
      pendingTasks: pending,
    };
  }, [plan.sub_tasks]);

  return (
    <div className="space-y-6">
      {/* Plan Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                Generated Plan Overview
              </CardTitle>
              <p className="text-sm text-gray-600">
                AI has broken down your assignment into {totalTasks} manageable sub-tasks
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{completionPercentage}%</div>
              <div className="text-xs text-gray-500">Complete</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-4 text-sm">
              <span className="text-gray-600">
                <strong>{totalTasks}</strong> total tasks
              </span>
              <span className="text-blue-600">
                <strong>{pendingTasks}</strong> pending
              </span>
              <span className="text-green-600">
                <strong>{completedTasks}</strong> completed
              </span>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" size="sm">
              Download Plan
            </Button>
            <Button onClick={onProceedToRefinement} className="flex items-center gap-2">
              Refine Plan  
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sub-Tasks List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Sub-Tasks Breakdown</h3>
        <div className="grid gap-4">
          {plan.sub_tasks
            .sort((a, b) => a.order_index - b.order_index)
            .map((subTask, index) => (
              <SubTaskCard 
                key={subTask.id} 
                subTask={subTask} 
                index={index} 
              />
            ))}
        </div>
      </div>
    </div>
  );
}

export function PlanGenerationDisplay({ 
  plan, 
  isGenerating, 
  onRetryGeneration, 
  onProceedToRefinement 
}: PlanGenerationDisplayProps) {
  if (isGenerating) {
    return <LoadingState />;
  }

  if (!plan || plan.sub_tasks.length === 0) {
    return <EmptyState onRetryGeneration={onRetryGeneration} />;
  }

  return <GeneratedPlan plan={plan} onProceedToRefinement={onProceedToRefinement} />;
}