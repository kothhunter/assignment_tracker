'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Brain, Lightbulb, Target } from 'lucide-react';

interface AIThinkingStateProps {
  title?: string;
  className?: string;
}

const thinkingSteps = [
  {
    icon: Brain,
    text: "Analyzing your assignment instructions...",
    duration: 2000
  },
  {
    icon: Target,
    text: "Breaking down into manageable steps...",
    duration: 2500
  },
  {
    icon: Lightbulb,
    text: "Generating personalized study prompts...",
    duration: 3000
  }
];

export function AIThinkingState({ 
  title = "AI is Working",
  className = "" 
}: AIThinkingStateProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    const stepTimer = setTimeout(() => {
      if (currentStep < thinkingSteps.length - 1) {
        setCompletedSteps(prev => [...prev, currentStep]);
        setCurrentStep(prev => prev + 1);
      }
    }, thinkingSteps[currentStep].duration);

    return () => clearTimeout(stepTimer);
  }, [currentStep]);

  return (
    <Card className={className}>
      <CardContent className="p-8 text-center">
        {/* Main Animation */}
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6 relative">
          <Brain className="h-10 w-10 text-blue-600 animate-pulse" />
          <div className="absolute inset-0 rounded-full border-2 border-blue-200 animate-ping"></div>
          <div className="absolute inset-2 rounded-full border border-purple-200 animate-pulse delay-75"></div>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          {title}
        </h3>
        
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Our AI is carefully analyzing your assignment to create the most helpful study plan possible.
        </p>

        {/* Progress Steps */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 max-w-md mx-auto">
          <div className="space-y-4">
            {thinkingSteps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = completedSteps.includes(index);
              const isCurrent = currentStep === index;
              const isPending = index > currentStep;
              
              return (
                <div
                  key={index}
                  className={`flex items-center gap-3 transition-all duration-500 ${
                    isCompleted 
                      ? 'text-green-700' 
                      : isCurrent 
                        ? 'text-blue-700' 
                        : 'text-gray-400'
                  }`}
                >
                  <div className={`relative flex-shrink-0 ${
                    isCompleted 
                      ? 'text-green-600' 
                      : isCurrent 
                        ? 'text-blue-600' 
                        : 'text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      </div>
                    ) : isCurrent ? (
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                      </div>
                    ) : (
                      <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-sm font-medium text-left">
                    {step.text}
                  </div>
                  
                  {isCurrent && (
                    <Loader2 className="h-4 w-4 animate-spin ml-auto flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Subtle progress indicator */}
        <div className="mt-6">
          <div className="w-48 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
              style={{ 
                width: `${((currentStep + 1) / thinkingSteps.length) * 100}%`
              }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Step {currentStep + 1} of {thinkingSteps.length}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}