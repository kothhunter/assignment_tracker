'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Edit3, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/trpc';

interface InstructionsPreviewProps {
  assignmentId: number;
  instructions: string;
  isLocked?: boolean; // Lock editing after prompt generation
  onInstructionsUpdate?: () => void;
}

export function InstructionsPreview({ 
  assignmentId, 
  instructions, 
  isLocked = false,
  onInstructionsUpdate 
}: InstructionsPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(instructions);

  // Mutation to update assignment plan instructions
  const updateInstructions = api.assignment.updatePlan.useMutation({
    onSuccess: () => {
      toast.success('Instructions updated successfully');
      setIsEditing(false);
      onInstructionsUpdate?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update instructions');
    },
  });

  const handleEdit = () => {
    setEditValue(instructions);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!editValue.trim()) {
      toast.error('Instructions cannot be empty');
      return;
    }

    updateInstructions.mutate({
      assignmentId,
      instructions: editValue.trim(),
    });
  };

  const handleCancel = () => {
    setEditValue(instructions);
    setIsEditing(false);
  };

  // Show only first 3 lines of instructions for preview
  const getPreviewText = (text: string) => {
    const lines = text.split('\n');
    if (lines.length <= 3) return text;
    return lines.slice(0, 3).join('\n') + '...';
  };

  const showFullText = instructions.split('\n').length <= 3;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Assignment Instructions
          </CardTitle>
          {!isLocked && !isEditing && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleEdit}
              className="flex items-center gap-2"
            >
              <Edit3 className="h-4 w-4" />
              Edit Instructions
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Enter detailed assignment instructions..."
              className="min-h-[200px] resize-none"
              maxLength={5000}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {editValue.length}/5000 characters
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCancel}
                  disabled={updateInstructions.isPending}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSave}
                  disabled={updateInstructions.isPending || !editValue.trim()}
                  className="flex items-center gap-2"
                >
                  {updateInstructions.isPending ? (
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-gray-700 whitespace-pre-wrap">
              {showFullText ? instructions : getPreviewText(instructions)}
            </div>
            
            {!showFullText && (
              <div className="text-xs text-gray-500 italic">
                {instructions.split('\n').length - 3} more lines...
              </div>
            )}

            {isLocked && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-700">
                  📝 Instructions are locked after prompt generation to maintain consistency.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}