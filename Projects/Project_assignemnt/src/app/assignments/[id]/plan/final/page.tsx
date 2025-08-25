'use client';

import { useParams, useRouter } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import { toast, Toaster } from 'sonner';
import { api } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, BookOpen, Clock, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { ErrorBoundary } from 'react-error-boundary';
import { FinalPromptDisplay } from '@/components/features/assignments/final-prompt-display';

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

function FinalPromptGenerationContent() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = parseInt(params.id as string, 10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

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

  // Generate final prompts mutation
  const generatePromptsMutation = api.ai.generatePrompt.useMutation({
    onMutate: () => {
      setIsGenerating(true);
    },
    onSuccess: () => {
      setHasGenerated(true);
      setIsGenerating(false);
      toast.success('Final prompts generated successfully!');
      refetchPlan();
    },
    onError: (error) => {
      setIsGenerating(false);
      toast.error(`Failed to generate prompts: ${error.message}`);
    },
  });

  // Check if prompts already exist
  useEffect(() => {
    if (plan?.sub_tasks) {
      const hasExistingPrompts = plan.sub_tasks.some(task => task.generated_prompt && task.generated_prompt.trim().length > 0);
      setHasGenerated(hasExistingPrompts);
    }
  }, [plan]);

  if (isLoadingAssignment || isLoadingPlan) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Toaster richColors position="top-right" />
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse" data-testid="loading-skeleton">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded mb-6"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
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
              onClick={() => router.push(`/assignments/${assignmentId}/plan/refine`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Refinement
            </Button>
          </div>
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Plan Not Found
              </h2>
              <p className="text-gray-600 mb-4">
                No assignment plan found. Please return to plan refinement and ensure your plan is ready.
              </p>
              <Button onClick={() => router.push(`/assignments/${assignmentId}/plan/refine`)}>
                Return to Plan Refinement
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
              onClick={() => router.push(`/assignments/${assignmentId}/plan/refine`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Refinement
            </Button>
          </div>
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No Sub-Tasks Available
              </h2>
              <p className="text-gray-600 mb-4">
                This plan doesn&apos;t have any sub-tasks yet. Please generate and refine sub-tasks first.
              </p>
              <Button onClick={() => router.push(`/assignments/${assignmentId}/plan/refine`)}>
                Return to Plan Refinement
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const dueDate = new Date(assignment.due_date);
  const isOverdue = dueDate < new Date() && assignment.status === 'incomplete';

  const handleGeneratePrompts = async () => {
    try {
      await generatePromptsMutation.mutateAsync({
        assignmentId: plan.assignment_id,
      });
    } catch (error) {
      // Error is handled by the mutation's onError callback
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster richColors position="top-right" />
      <div className="max-w-4xl mx-auto">
        {/* Navigation breadcrumbs */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/assignments/${assignmentId}/plan/refine`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Refinement
          </Button>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600 text-sm">Final Prompt Generation</span>
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

        {/* Sub-tasks Review Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Final Sub-Task Review
            </CardTitle>
            <p className="text-sm text-gray-600">
              Review your refined sub-tasks before generating the final prompts.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {plan.sub_tasks
                .sort((a, b) => a.step_number - b.step_number)
                .map((task, index) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full flex items-center justify-center">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
                      {task.generated_prompt && (
                        <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Prompt generated
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Generate Prompts Section */}
        {!hasGenerated ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Ready to Generate Final Prompts?</CardTitle>
              <p className="text-sm text-gray-600">
                Click the button below to generate detailed, actionable prompts for each of your sub-tasks.
                This will complete your assignment planning workflow.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleGeneratePrompts}
                  disabled={isGenerating}
                  className="flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Generating Prompts...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate Final Prompts
                    </>
                  )}
                </Button>
                <div className="text-sm text-gray-500">
                  This may take a few moments to complete.
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <FinalPromptDisplay
              plan={plan}
              assignmentId={assignmentId}
              onBackToDashboard={() => router.push('/dashboard')}
              onRegeneratePrompts={handleGeneratePrompts}
              isRegenerating={isGenerating}
            />
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
}

export default function FinalPromptGenerationPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded mb-6"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    }>
      <FinalPromptGenerationContent />
    </Suspense>
  );
}