'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AIThinkingState } from '@/components/ui/ai-thinking-state';
import { Copy, Check, RefreshCw, BookOpen, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { AssignmentPlan } from '@/types';

interface PromptDisplayProps {
  plan?: AssignmentPlan | null;
  isGenerating: boolean;
  onRetryGeneration: () => void;
}

function LoadingState() {
  return (
    <AIThinkingState 
      title="Generating Your Learning Prompt"
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
          No Prompt Generated Yet
        </h3>
        <p className="text-gray-600 mb-6">
          It looks like the AI hasn&apos;t generated your learning prompt yet. This might be due to a temporary issue.
        </p>
        <Button onClick={onRetryGeneration} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Generate Prompt Now
        </Button>
      </CardContent>
    </Card>
  );
}

function GeneratedPrompt({ plan }: { plan: AssignmentPlan }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!plan.generated_prompt) return;

    try {
      await navigator.clipboard.writeText(plan.generated_prompt);
      setCopied(true);
      toast.success('Learning prompt copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy prompt');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'generating':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Learning Prompt Ready
            </CardTitle>
            <p className="text-sm text-gray-600">
              Your personalized learning guide has been generated and is ready to use
            </p>
          </div>
          <Badge variant="secondary" className={getStatusColor(plan.prompt_status)}>
            {plan.prompt_status === 'completed' ? 'Ready' : plan.prompt_status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center space-y-4">
          <Button 
            onClick={handleCopy} 
            size="lg"
            className="flex items-center gap-3 px-8 py-6 text-base font-medium"
            disabled={!plan.generated_prompt}
          >
            {copied ? (
              <>
                <Check className="h-5 w-5" />
                Copied to Clipboard!
              </>
            ) : (
              <>
                <Copy className="h-5 w-5" />
                Copy Learning Prompt
              </>
            )}
          </Button>
          
          {/* Usage Instructions */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
            <h4 className="text-sm font-medium text-blue-900 mb-2">📋 How to use your learning prompt:</h4>
            <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
              <li>Click the button above to copy your personalized learning guide</li>
              <li>Open your preferred AI assistant (ChatGPT, Claude, Gemini, etc.)</li>
              <li>Paste the prompt to get step-by-step learning guidance</li>
              <li>Follow the structured approach for maximum learning</li>
              <li>Use reflection questions to deepen your understanding</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PromptDisplay({ 
  plan, 
  isGenerating, 
  onRetryGeneration 
}: PromptDisplayProps) {
  if (isGenerating) {
    return <LoadingState />;
  }

  if (!plan || !plan.generated_prompt) {
    return <EmptyState onRetryGeneration={onRetryGeneration} />;
  }

  return <GeneratedPrompt plan={plan} />;
}