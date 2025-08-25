'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Copy, 
  Check, 
  ArrowRight, 
  RefreshCw, 
  CheckCircle2, 
  Sparkles,
  AlertTriangle 
} from 'lucide-react';
import { toast } from 'sonner';
import type { AssignmentPlan } from '@/types';

interface FinalPromptDisplayProps {
  plan: AssignmentPlan;
  assignmentId: number;
  onBackToDashboard: () => void;
  onRegeneratePrompts: () => void;
  isRegenerating: boolean;
}

interface CopyButtonProps {
  text: string;
  className?: string;
}

function CopyButton({ text, className = '' }: CopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      toast.success('Copied to clipboard!');
      
      // Reset the icon after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
      console.error('Copy failed:', error);
    }
  };

  return (
    <Button
      onClick={handleCopy}
      variant={isCopied ? "default" : "default"}
      size="sm"
      className={`flex items-center gap-2 font-medium transition-all duration-200 ${
        isCopied 
          ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' 
          : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm hover:shadow-md'
      } ${className}`}
      disabled={!text.trim()}
    >
      {isCopied ? (
        <>
          <Check className="h-4 w-4" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          Copy Prompt
        </>
      )}
    </Button>
  );
}

export function FinalPromptDisplay({ 
  plan, 
  assignmentId, 
  onBackToDashboard, 
  onRegeneratePrompts,
  isRegenerating 
}: FinalPromptDisplayProps) {
  // Sort sub-tasks by step number
  const sortedSubTasks = plan.sub_tasks.sort((a, b) => a.step_number - b.step_number);
  
  // Check for any empty prompts
  const hasEmptyPrompts = sortedSubTasks.some(task => !task.generated_prompt || task.generated_prompt.trim().length === 0);
  
  // Get total completion statistics
  const totalTasks = sortedSubTasks.length;
  const tasksWithPrompts = sortedSubTasks.filter(task => task.generated_prompt && task.generated_prompt.trim().length > 0).length;

  return (
    <div className="space-y-6">
      {/* Completion Status Card */}
      <Card className={hasEmptyPrompts ? "border-yellow-200 bg-yellow-50" : "border-green-200 bg-green-50"}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {hasEmptyPrompts ? (
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              ) : (
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              )}
              <div>
                <h3 className={`font-semibold ${hasEmptyPrompts ? 'text-yellow-800' : 'text-green-800'}`}>
                  {hasEmptyPrompts ? 'Prompt Generation Incomplete' : 'All Prompts Generated Successfully!'}
                </h3>
                <p className={`text-sm ${hasEmptyPrompts ? 'text-yellow-700' : 'text-green-700'}`}>
                  {tasksWithPrompts} of {totalTasks} prompts generated
                  {hasEmptyPrompts && ' - Some prompts may need regeneration'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasEmptyPrompts && (
                <Button
                  onClick={onRegeneratePrompts}
                  disabled={isRegenerating}
                  variant="outline"
                  size="sm"
                  className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                >
                  {isRegenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate Missing
                    </>
                  )}
                </Button>
              )}
              <Badge variant={hasEmptyPrompts ? "secondary" : "default"}>
                {hasEmptyPrompts ? 'Partial' : 'Complete'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generated Prompts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Your Final Prompts
            </CardTitle>
            <div className="text-sm text-gray-500">
              {totalTasks} {totalTasks === 1 ? 'prompt' : 'prompts'}
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Copy these detailed prompts to help you complete each step of your assignment.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {sortedSubTasks.map((task, index) => (
            <div key={task.id} className="border-l-4 border-blue-200 pl-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full flex items-center justify-center">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{task.title}</h4>
                    <div className="flex items-center gap-2">
                      {task.generated_prompt && task.generated_prompt.trim().length > 0 ? (
                        <Badge variant="default" className="text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          Generated
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Missing Prompt
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <CopyButton text={task.generated_prompt || ''} />
              </div>
              
              {task.generated_prompt && task.generated_prompt.trim().length > 0 ? (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-blue-900">AI-Generated Prompt</span>
                  </div>
                  <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
                    {task.generated_prompt}
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-yellow-800 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Prompt not generated or empty. Try regenerating prompts.</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Planning Complete!</h3>
              <p className="text-sm text-gray-600">
                You now have detailed prompts for each step of your assignment. 
                {hasEmptyPrompts ? ' Consider regenerating any missing prompts first.' : ' You\'re ready to get started!'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {hasEmptyPrompts && (
                <Button
                  onClick={onRegeneratePrompts}
                  disabled={isRegenerating}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {isRegenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Regenerate All
                    </>
                  )}
                </Button>
              )}
              <Button
                onClick={onBackToDashboard}
                className="flex items-center gap-2"
              >
                Back to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Copy All Prompts Option */}
      {!hasEmptyPrompts && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Copy All Prompts</h3>
                <p className="text-sm text-gray-600">
                  Copy all prompts at once for easy reference while working.
                </p>
              </div>
              <CopyButton 
                text={sortedSubTasks
                  .map((task, index) => `${index + 1}. ${task.title}\n\n${task.generated_prompt}`)
                  .join('\n\n---\n\n')
                }
                className="px-6 py-3 text-base"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}