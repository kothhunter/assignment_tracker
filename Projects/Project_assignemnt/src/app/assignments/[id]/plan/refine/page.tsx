'use client';

import { useParams, useRouter } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import { toast, Toaster } from 'sonner';
import { api } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, BookOpen, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ErrorBoundary } from 'react-error-boundary';
import { PlanRefinementChat } from '@/components/features/assignments/plan-refinement-chat';
import { RefinedPlanDisplay } from '@/components/features/assignments/refined-plan-display';

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <Card className="border-red-200">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 text-red-600 mb-4">
          <AlertCircle className="h-5 w-5" />
          <h3 className="font-semibold">Something went wrong</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">{error.message}</p>
        <Button onClick={resetErrorBoundary} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}

function PlanRefinementContent() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = parseInt(params.id as string, 10);

  // Get assignment details
  const { data: assignment, isLoading: isLoadingAssignment, error: assignmentError } = api.assignment.getById.useQuery(
    { id: assignmentId },
    {
      enabled: !isNaN(assignmentId),
      retry: false,
    }
  );

  // Get assignment plan
  const { data: plan, isLoading: isLoadingPlan, error: planError, refetch: refetchPlan } = api.ai.getPlan.useQuery(
    { assignmentId },
    {
      enabled: !isNaN(assignmentId),
      retry: false,
    }
  );

  if (isLoadingAssignment || isLoadingPlan) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Toaster richColors position="top-right" />
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse" data-testid="loading-skeleton">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded mb-6"></div>
            <div className="grid grid-cols-2 gap-6">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (assignmentError || !assignment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Toaster richColors position="top-right" />
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Assignment Not Found
              </h2>
              <p className="text-gray-600 mb-4">
                The assignment you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
              </p>
              <Button onClick={() => router.push('/dashboard')}>
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (planError || !plan) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Toaster richColors position="top-right" />
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/assignments/${assignmentId}/plan`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Plan
            </Button>
          </div>
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Plan Not Found
              </h2>
              <p className="text-gray-600 mb-4">
                No assignment plan found. Please return to the plan page and generate a plan first.
              </p>
              <Button onClick={() => router.push(`/assignments/${assignmentId}/plan`)}>
                Return to Plan Generation
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Ensure plan has sub-tasks
  if (!plan.sub_tasks || plan.sub_tasks.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Toaster richColors position="top-right" />
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/assignments/${assignmentId}/plan`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Plan
            </Button>
          </div>
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No Sub-Tasks to Refine
              </h2>
              <p className="text-gray-600 mb-4">
                This plan doesn&apos;t have any sub-tasks yet. Please generate sub-tasks first before refining.
              </p>
              <Button onClick={() => router.push(`/assignments/${assignmentId}/plan`)}>
                Generate Sub-Tasks First
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const dueDate = new Date(assignment.due_date);
  const isOverdue = dueDate < new Date() && assignment.status === 'incomplete';

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster richColors position="top-right" />
      <div className="max-w-6xl mx-auto">
        {/* Navigation breadcrumbs */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/assignments/${assignmentId}/plan`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Plan
          </Button>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600 text-sm">Plan Refinement</span>
        </div>

        {/* Assignment Context Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                  {assignment.title}
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{assignment.class.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Due {format(dueDate, 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{format(dueDate, 'h:mm a')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={assignment.status === 'complete' ? 'default' : isOverdue ? 'destructive' : 'secondary'}
                >
                  {assignment.status === 'complete' ? 'Complete' : isOverdue ? 'Overdue' : 'Incomplete'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          {plan.original_instructions && (
            <CardContent>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Assignment Instructions</h4>
                <p className="text-sm text-blue-800 whitespace-pre-wrap">{plan.original_instructions}</p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Two-column layout: Plan display and Chat interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Plan Display */}
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <RefinedPlanDisplay
              plan={plan}
              assignmentId={assignmentId}
            />
          </ErrorBoundary>

          {/* Chat Interface */}
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <PlanRefinementChat
              plan={plan}
              assignmentId={assignmentId}
              onPlanUpdated={refetchPlan}
              onProceedToPromptGeneration={() => {
                router.push(`/assignments/${assignmentId}/plan/final`);
              }}
            />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}

export default function PlanRefinementPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded mb-6"></div>
            <div className="grid grid-cols-2 gap-6">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    }>
      <PlanRefinementContent />
    </Suspense>
  );
}