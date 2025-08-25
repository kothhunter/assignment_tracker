'use client';

import { useParams, useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';
import { toast, Toaster } from 'sonner';
import { api } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, BookOpen, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { AssignmentInstructionInput } from '@/components/features/assignments';
import { InstructionsPreview } from '@/components/features/assignments/instructions-preview';
import { PromptDisplay } from '@/components/features/assignments/prompt-display';

function AssignmentDetailContent() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = parseInt(params.id as string, 10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: assignment, isLoading, error } = api.assignment.getById.useQuery(
    { id: assignmentId },
    {
      enabled: !isNaN(assignmentId),
      retry: false,
    }
  );

  // Check if a plan already exists for this assignment
  const { data: existingPlan, isLoading: isLoadingPlan, refetch: refetchPlan } = api.ai.getPlan.useQuery(
    { assignmentId },
    {
      enabled: !isNaN(assignmentId),
      retry: false,
    }
  );

  const initiatePlanMutation = api.assignment.initiatePlan.useMutation({
    onSuccess: () => {
      toast.success('Instructions saved successfully!');
      // Refetch the plan to show the instructions preview and generate button
      refetchPlan();
    },
    onError: (error) => {
      console.error('Failed to save instructions - Assignment ID:', assignmentId);
      toast.error(error.message || 'Failed to save instructions');
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const generatePromptMutation = api.ai.generatePrompt.useMutation({
    onSuccess: () => {
      toast.success('Learning prompt generated successfully!');
      refetchPlan();
    },
    onError: (error) => {
      console.error('Failed to generate prompt:', error);
      toast.error(error.message || 'Failed to generate learning prompt');
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  if (isLoading || isLoadingPlan) {
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

  if (error || !assignment) {
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

  const dueDate = new Date(assignment.due_date);
  const isOverdue = dueDate < new Date() && assignment.status === 'incomplete';
  
  // Determine if instructions are locked (after prompt generation)
  const isInstructionsLocked = Boolean(existingPlan?.generated_prompt && existingPlan?.prompt_status === 'completed');

  const handleInstructionsSubmit = (instructions: string) => {
    setIsSubmitting(true);
    initiatePlanMutation.mutate({
      assignment_id: assignmentId,
      instructions,
    });
  };

  const handleGeneratePrompt = () => {
    setIsSubmitting(true);
    generatePromptMutation.mutate({ assignmentId });
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
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600 text-sm">Assignment Details</span>
        </div>

        {/* Assignment Information Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
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
        </Card>

        {/* Assignment Instructions Section */}
        {existingPlan && existingPlan.original_instructions ? (
          <div className="space-y-6">
            <InstructionsPreview
              assignmentId={assignmentId}
              instructions={existingPlan.original_instructions}
              isLocked={isInstructionsLocked}
              onInstructionsUpdate={refetchPlan}
            />
            
            {/* Prompt Generation/Display Section */}
            {existingPlan.generated_prompt && existingPlan.prompt_status === 'completed' ? (
              <PromptDisplay
                plan={existingPlan}
                isGenerating={false}
                onRetryGeneration={handleGeneratePrompt}
              />
            ) : existingPlan.prompt_status === 'generating' ? (
              <PromptDisplay
                plan={existingPlan}
                isGenerating={true}
                onRetryGeneration={handleGeneratePrompt}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Ready to Generate Learning Prompt</CardTitle>
                  <p className="text-sm text-gray-600">
                    Your assignment instructions are ready. Generate a personalized learning prompt to guide your work.
                  </p>
                  <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
                    Note: After you generate your learning prompt, the assignment instructions will be locked and can’t be edited.
                  </p>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={handleGeneratePrompt}
                    disabled={isSubmitting}
                    className="flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate Learning Prompt'
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <AssignmentInstructionInput
            onSubmit={handleInstructionsSubmit}
            isLoading={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}

export default function AssignmentDetailPage() {
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
      <AssignmentDetailContent />
    </Suspense>
  );
}