'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Plus, 
  Trash2, 
  Calendar, 
  Book,
  AlertCircle,
  Save,
  Undo2
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import type { 
  AIParsingResult, 
  ReviewableAssignment, 
  AssignmentReviewState,
  ParsedAssignment 
} from '@/types';
import { api } from '@/lib/trpc';

// Validation schema for assignment editing
const assignmentEditSchema = z.object({
  title: z.string().min(1, 'Assignment title is required').max(200, 'Title is too long'),
  due_date: z.string().min(1, 'Due date is required').refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime()) && parsed > new Date();
  }, 'Due date must be a valid future date'),
  description: z.string().max(1000, 'Description is too long').optional(),
  type: z.string().max(50, 'Type is too long').optional(),
  points: z.number().min(0, 'Points must be non-negative').optional(),
});

type AssignmentEditValues = z.infer<typeof assignmentEditSchema>;

interface AssignmentReviewProps {
  aiResult: AIParsingResult;
  onConfirm?: (assignments: ParsedAssignment[]) => void;
  onCancel: () => void;
  isConfirming?: boolean;
}

export function AssignmentReview({ 
  aiResult, 
  onConfirm, 
  onCancel, 
  isConfirming = false 
}: AssignmentReviewProps) {
  const router = useRouter();
  // Initialize review state
  const [reviewState, setReviewState] = useState<AssignmentReviewState>(() => {
    const reviewAssignments: ReviewableAssignment[] = aiResult.assignments.map((assignment, index) => ({
      ...assignment,
      id: `original-${index}`,
      isEdited: false,
      isNew: false,
    }));

    return {
      originalAssignments: aiResult.assignments,
      reviewAssignments,
      className: aiResult.className,
      classId: aiResult.assignments[0]?.class_id || 0,
      isConfirming: false,
      hasChanges: false,
    };
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  // API mutation for batch assignment creation
  const utils = api.useUtils();
  const createBatchMutation = api.assignment.createBatch.useMutation({
    onSuccess: (data) => {
      toast.success(`Successfully saved ${data.count} assignments!`);
      // Invalidate assignment queries to refresh dashboard data
      utils.assignment.getAll.invalidate();
      utils.assignment.getByClass.invalidate();
      // Navigate to dashboard after successful save
      router.push('/dashboard');
    },
    onError: (error) => {
      console.error('Save assignments error:', error);
      toast.error(error.message || 'Failed to save assignments. Please try again.');
    },
  });

  // Form for editing assignments
  const editForm = useForm<AssignmentEditValues>({
    resolver: zodResolver(assignmentEditSchema),
    defaultValues: {
      title: '',
      due_date: '',
      description: '',
      type: '',
      points: undefined,
    },
  });

  // Update confirming state
  useEffect(() => {
    setReviewState(prev => ({ ...prev, isConfirming }));
  }, [isConfirming]);

  // Start editing an assignment
  const startEditing = (assignment: ReviewableAssignment) => {
    setEditingId(assignment.id);
    editForm.reset({
      title: assignment.title,
      due_date: assignment.due_date,
      description: assignment.description || '',
      type: assignment.type || '',
      points: assignment.points,
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null);
    editForm.reset();
  };

  // Save edited assignment
  const saveEdit = (values: AssignmentEditValues) => {
    if (!editingId) return;

    setReviewState(prev => {
      const updatedAssignments = prev.reviewAssignments.map(assignment => {
        if (assignment.id === editingId) {
          return {
            ...assignment,
            ...values,
            isEdited: true,
          };
        }
        return assignment;
      });

      return {
        ...prev,
        reviewAssignments: updatedAssignments,
        hasChanges: true,
      };
    });

    setEditingId(null);
    editForm.reset();
    toast.success('Assignment updated successfully');
  };

  // Add new assignment
  const addNewAssignment = () => {
    const newId = `new-${Date.now()}`;
    const newAssignment: ReviewableAssignment = {
      id: newId,
      title: 'New Assignment',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to 1 week from now
      description: '',
      type: 'assignment',
      points: 0,
      class_id: reviewState.classId,
      isEdited: false,
      isNew: true,
    };

    setReviewState(prev => ({
      ...prev,
      reviewAssignments: [...prev.reviewAssignments, newAssignment],
      hasChanges: true,
    }));

    // Immediately start editing the new assignment
    startEditing(newAssignment);
    toast.success('New assignment added. Please edit the details.');
  };

  // Delete assignment
  const deleteAssignment = (id: string) => {
    setReviewState(prev => ({
      ...prev,
      reviewAssignments: prev.reviewAssignments.filter(assignment => assignment.id !== id),
      hasChanges: true,
    }));
    toast.success('Assignment removed');
  };

  // Reset to original assignments
  const resetToOriginal = () => {
    const reviewAssignments: ReviewableAssignment[] = reviewState.originalAssignments.map((assignment, index) => ({
      ...assignment,
      id: `original-${index}`,
      isEdited: false,
      isNew: false,
    }));

    setReviewState(prev => ({
      ...prev,
      reviewAssignments,
      hasChanges: false,
    }));

    setEditingId(null);
    editForm.reset();
    toast.success('Reset to original assignments');
  };

  // Confirm final assignments
  const handleConfirm = () => {
    // Convert reviewable assignments back to parsed assignments format
    const finalAssignments: ParsedAssignment[] = reviewState.reviewAssignments.map(assignment => ({
      title: assignment.title,
      due_date: assignment.due_date,
      description: assignment.description,
      type: assignment.type,
      points: assignment.points,
      class_id: assignment.class_id,
    }));

    // Call the original onConfirm if provided (for backward compatibility)
    if (onConfirm) {
      onConfirm(finalAssignments);
      return;
    }

    // Otherwise, save directly using the API
    createBatchMutation.mutate({
      assignments: finalAssignments,
    });
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Review Assignments
          </CardTitle>
          <CardDescription>
            Review and edit the {reviewState.reviewAssignments.length} assignments found in your {reviewState.className} syllabus.
            You can edit details, remove incorrect assignments, or add missing ones.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Book className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{reviewState.reviewAssignments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Edited</p>
                <p className="text-2xl font-bold">
                  {reviewState.reviewAssignments.filter(a => a.isEdited).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Added</p>
                <p className="text-2xl font-bold">
                  {reviewState.reviewAssignments.filter(a => a.isNew).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Removed</p>
                <p className="text-2xl font-bold">
                  {reviewState.originalAssignments.length - reviewState.reviewAssignments.filter(a => !a.isNew).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 justify-between">
        <div className="flex gap-2">
          <Button 
            onClick={addNewAssignment}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Assignment
          </Button>
          
          {reviewState.hasChanges && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Undo2 className="h-4 w-4" />
                  Reset All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset to Original?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will discard all your changes and restore the original AI-parsed assignments.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={resetToOriginal}>
                    Reset All Changes
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={onCancel}
            variant="outline"
            disabled={reviewState.isConfirming || createBatchMutation.isPending}
          >
            Cancel
          </Button>
          
          <Button 
            onClick={handleConfirm}
            disabled={reviewState.isConfirming || createBatchMutation.isPending || reviewState.reviewAssignments.length === 0}
            className="min-w-[120px]"
          >
            {reviewState.isConfirming || createBatchMutation.isPending ? 'Saving...' : 'Confirm & Save'}
          </Button>
        </div>
      </div>

      {/* Assignment List */}
      <div className="space-y-4">
        {reviewState.reviewAssignments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Assignments</h3>
              <p className="text-muted-foreground mb-4">
                All assignments have been removed. Add some assignments or reset to the original list.
              </p>
              <Button onClick={addNewAssignment} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add First Assignment
              </Button>
            </CardContent>
          </Card>
        ) : (
          reviewState.reviewAssignments.map((assignment) => (
            <Card key={assignment.id} className="relative">
              <CardContent className="p-6">
                {editingId === assignment.id ? (
                  /* Editing Mode */
                  <Form {...editForm}>
                    <form onSubmit={editForm.handleSubmit(saveEdit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={editForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Assignment Title</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={editForm.control}
                          name="due_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Due Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={editForm.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Type</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., homework, exam, project" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={editForm.control}
                          name="points"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Points</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={editForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Assignment description or notes..."
                                className="min-h-[80px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-2 pt-2">
                        <Button type="submit" size="sm">
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={cancelEditing}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  /* Display Mode */
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{assignment.title}</h3>
                          <div className="flex gap-1">
                            {assignment.isNew && (
                              <Badge variant="secondary" className="text-xs">
                                New
                              </Badge>
                            )}
                            {assignment.isEdited && (
                              <Badge variant="outline" className="text-xs">
                                Edited
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Due: {formatDate(assignment.due_date)}
                          </div>
                          {assignment.type && (
                            <div>Type: {assignment.type}</div>
                          )}
                          {assignment.points !== undefined && (
                            <div>Points: {assignment.points}</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-1 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditing(assignment)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Assignment?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove &quot;{assignment.title}&quot;? 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteAssignment(assignment.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    
                    {assignment.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {assignment.description}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}