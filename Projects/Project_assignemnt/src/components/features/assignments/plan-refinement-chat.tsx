'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, User, Bot, Undo, ArrowRight, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/trpc';
import { format } from 'date-fns';
import type { AssignmentPlan, RefinementMessage } from '@/types';

// Utility function to create a temporary message template
const createTemporaryMessage = (
  planId: number,
  messageType: 'user' | 'system',
  content: string,
  changeSummary?: string
): RefinementMessage => {
  const timestamp = new Date().toISOString();
  return {
    id: (Date.now() + Math.random()).toString(), // More unique temporary ID
    plan_id: planId,
    message_type: messageType,
    content,
    change_summary: changeSummary,
    timestamp,
    created_at: timestamp,
  };
};

interface PlanRefinementChatProps {
  plan: AssignmentPlan;
  assignmentId: number;
  onPlanUpdated: () => void;
  onProceedToPromptGeneration: () => void;
}

interface MessageBubbleProps {
  message: RefinementMessage;
  isLatest?: boolean;
}

function MessageBubble({ message, isLatest }: MessageBubbleProps) {
  const isUser = message.message_type === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-start gap-2 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
        }`}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>
        <div className={`rounded-lg p-3 ${
          isUser 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-100 text-gray-900 border'
        } ${isLatest && !isUser ? 'animate-pulse' : ''}`}>
          <div className="text-sm whitespace-pre-wrap">
            {message.content}
          </div>
          {message.change_summary && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="text-xs text-gray-600 font-medium mb-1">Changes Made:</div>
              <div className="text-xs text-gray-600 bg-white/10 rounded p-1">
                {message.change_summary}
              </div>
            </div>
          )}
          <div className={`text-xs mt-2 ${
            isUser ? 'text-blue-100' : 'text-gray-500'
          }`}>
            {format(new Date(message.timestamp || message.created_at || Date.now()), 'h:mm a')}
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingMessage() {
  return (
    <div className="flex justify-start mb-4">
      <div className="flex items-start gap-2 max-w-[80%]">
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100 text-gray-600">
          <Bot className="h-4 w-4" />
        </div>
        <div className="rounded-lg p-3 bg-gray-100 text-gray-900 border">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing your request and updating the plan...
          </div>
        </div>
      </div>
    </div>
  );
}

export function PlanRefinementChat({ 
  plan, 
  assignmentId, 
  onPlanUpdated, 
  onProceedToPromptGeneration 
}: PlanRefinementChatProps) {
  const [messages, setMessages] = useState<RefinementMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Get refinement history (placeholder - implement when backend is ready)
  const refinementHistory: RefinementMessage[] = [];
  const refetchHistory = () => {};

  // Refine plan mutation (placeholder - implement when backend is ready)
  const refinePlanMutation = {
    mutateAsync: async () => ({ success: true }),
    isPending: false,
  };

  // Undo last change mutation (placeholder - implement when backend is ready)
  const undoMutation = {
    mutateAsync: async () => ({ success: true }),
    isPending: false,
  };

  // Update messages when history is loaded
  useEffect(() => {
    if (refinementHistory && refinementHistory.length > 0) {
      setMessages(refinementHistory);
      setHasChanges(refinementHistory.length > 0);
    }
  }, [refinementHistory]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage = createTemporaryMessage(
      plan.id,
      'user',
      inputValue.trim()
    );

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    // Call the refinement API
    refinePlanMutation.mutateAsync();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleUndo = () => {
    undoMutation.mutateAsync();
  };

  // Initial welcome message
  const welcomeMessage = messages.length === 0 && !isProcessing;

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-gray-900">
            💬 Refine Your Plan
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="secondary" className="text-xs">
                Modified
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={!hasChanges || undoMutation.isPending}
              className="text-xs"
            >
              <Undo className="h-3 w-3 mr-1" />
              Undo
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Use natural language to modify your sub-tasks
        </p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 px-4 overflow-y-auto" ref={scrollAreaRef}>
          <div className="py-2">
            {welcomeMessage && (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Bot className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Ready to refine your plan!
                </h3>
                <div className="text-sm text-gray-600 max-w-sm mx-auto space-y-1">
                  <p>• &quot;Add a step about researching sources&quot;</p>
                  <p>• &quot;Remove step 3&quot;</p>
                  <p>• &quot;Change step 2 to focus on analysis&quot;</p>
                  <p>• &quot;Make step 1 more detailed&quot;</p>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <MessageBubble
                key={message.id || index}
                message={message}
                isLatest={index === messages.length - 1}
              />
            ))}

            {isProcessing && <LoadingMessage />}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex gap-2 mb-3">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe how you'd like to modify your plan..."
              disabled={isProcessing}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isProcessing}
              size="sm"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              Press Enter to send, Shift+Enter for new line
            </div>
            <Button
              onClick={onProceedToPromptGeneration}
              disabled={plan.sub_tasks.length === 0}
              className="flex items-center gap-2"
              size="sm"
            >
              Generate Prompts
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}