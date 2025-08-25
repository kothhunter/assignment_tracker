'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, Save, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssignmentInstructionInputProps {
  onSubmit: (instructions: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function AssignmentInstructionInput({ 
  onSubmit, 
  isLoading = false, 
  className 
}: AssignmentInstructionInputProps) {
  const [instructions, setInstructions] = useState('');
  const [error, setError] = useState('');
  const [isAutoSaved, setIsAutoSaved] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  const characterCount = instructions.length;
  const maxCharacters = 5000;
  const isValid = instructions.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate instructions
    if (!instructions.trim()) {
      setError('Assignment instructions are required');
      return;
    }

    if (instructions.length > maxCharacters) {
      setError(`Instructions must be ${maxCharacters} characters or less`);
      return;
    }

    setError('');
    onSubmit(instructions.trim());
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Debounced auto-save functionality
  const handleAutoSave = useCallback((value: string) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    setIsAutoSaved(false);
    
    if (value.trim()) {
      autoSaveTimeoutRef.current = setTimeout(() => {
        try {
          localStorage.setItem('draft-assignment-instructions', value);
          setIsAutoSaved(true);
          // Clear auto-save indicator after 2 seconds
          setTimeout(() => setIsAutoSaved(false), 2000);
        } catch (err) {
          // Handle localStorage quota exceeded gracefully
          console.warn('Failed to auto-save instructions:', err);
        }
      }, 1000); // Debounce for 1 second
    }
  }, []);

  const handleInputChange = (value: string) => {
    setInstructions(value);
    if (error) {
      setError('');
    }
    // Trigger debounced auto-save
    handleAutoSave(value);
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Assignment Instructions
        </CardTitle>
        <p className="text-sm text-gray-600">
          Provide detailed instructions for this assignment. After saving, you&apos;ll be able to generate a structured learning prompt. 
          Include requirements, deliverables, formatting guidelines, and any specific criteria.
        </p>
        <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
          Heads up: Once you generate the learning prompt, these instructions will be locked and can’t be edited.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instructions" className="text-sm font-medium">
              Assignment Instructions *
            </Label>
            <Textarea
              id="instructions"
              placeholder="Enter detailed assignment instructions here...

For example:
• Write a 5-page research paper on renewable energy
• Include at least 5 peer-reviewed sources
• Use APA format for citations
• Due date: [specific date]
• Submit as PDF through course portal"
              value={instructions}
              onChange={(e) => handleInputChange(e.target.value)}
              className={cn(
                "min-h-[200px] resize-y",
                error && "border-red-500 focus:border-red-500"
              )}
              disabled={isLoading}
              aria-describedby={error ? "instructions-error" : undefined}
            />
            
            {/* Character count and validation */}
            <div className="flex justify-between items-center text-xs">
              <span className={cn(
                "text-gray-500",
                characterCount > maxCharacters && "text-red-500"
              )}>
                {characterCount}/{maxCharacters} characters
              </span>
              {isAutoSaved && (
                <span className="text-green-600 flex items-center gap-1">
                  <Save className="h-3 w-3" />
                  Auto-saved
                </span>
              )}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div 
              id="instructions-error"
              className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Submit button */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={!isValid || isLoading || characterCount > maxCharacters}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Saving...
                </>
              ) : (
                'Save Instructions'
              )}
            </Button>
          </div>
        </form>

        {/* Help text */}
        <div className="mt-4 p-4 bg-blue-50 rounded-md">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Tips for better instructions:</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Be specific about requirements and deliverables</li>
            <li>• Include formatting guidelines and citation styles</li>
            <li>• Mention any specific resources or restrictions</li>
            <li>• Specify the expected length or scope</li>
            <li>• Include evaluation criteria if available</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}