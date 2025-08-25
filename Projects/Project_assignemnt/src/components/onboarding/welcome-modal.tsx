'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle2, 
  BookOpen, 
  Upload, 
  PlusCircle, 
  Sparkles,
  ArrowRight,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: string;
  route: string;
  completed?: boolean;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'upload-syllabus',
    title: 'Upload Your First Syllabus',
    description: 'Upload a syllabus to automatically extract assignments and due dates',
    icon: Upload,
    action: 'Upload Syllabus',
    route: '/dashboard/upload-syllabus'
  },
  {
    id: 'create-class',
    title: 'Create Your Classes',
    description: 'Add your classes manually to organize your assignments',
    icon: BookOpen,
    action: 'Manage Classes',
    route: '/classes'
  },
  {
    id: 'create-assignment',
    title: 'Add Your First Assignment',
    description: 'Manually add an assignment to see how the AI planning works',
    icon: PlusCircle,
    action: 'Create Assignment',
    route: '/dashboard' // Will trigger the assignment form
  }
];

export function WelcomeModal({ isOpen, onClose, userEmail }: WelcomeModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  const handleStepAction = (route: string) => {
    onClose();
    router.push(route as any);
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Welcome to Assignment Tracker!
              </DialogTitle>
              <p className="text-gray-600 mt-1">
                Welcome, {userEmail}! Let&apos;s get you started with AI-powered assignment planning.
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="px-6 pb-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center gap-2">
              {onboardingSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index <= currentStep 
                      ? 'bg-blue-600' 
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Current step */}
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {React.createElement(onboardingSteps[currentStep].icon, {
                    className: "h-8 w-8 text-blue-600"
                  })}
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {onboardingSteps[currentStep].title}
                </h3>
                
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {onboardingSteps[currentStep].description}
                </p>

                <div className="flex items-center justify-center gap-3">
                  {currentStep > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(currentStep - 1)}
                      className="flex items-center gap-2"
                    >
                      Previous
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => handleStepAction(onboardingSteps[currentStep].route)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    {onboardingSteps[currentStep].action}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  
                  {currentStep < onboardingSteps.length - 1 && (
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(currentStep + 1)}
                      className="flex items-center gap-2"
                    >
                      Next
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* All steps overview */}
          <div className="mt-6 grid gap-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Start Options:</h4>
            {onboardingSteps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(index)}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                  index === currentStep
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  index === currentStep
                    ? 'bg-blue-100'
                    : 'bg-gray-100'
                }`}>
                  {React.createElement(step.icon, {
                    className: `h-4 w-4 ${
                      index === currentStep ? 'text-blue-600' : 'text-gray-600'
                    }`
                  })}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900">{step.title}</div>
                  <div className="text-xs text-gray-600">{step.description}</div>
                </div>
                {index === currentStep && (
                  <ArrowRight className="h-4 w-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Skip for now, I&apos;ll explore on my own
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}