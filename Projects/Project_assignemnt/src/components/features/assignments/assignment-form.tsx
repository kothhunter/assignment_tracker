'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { api } from '@/lib/trpc';
import { useAssignmentStore } from '@/stores/assignments';
import type { Class } from '@/types';

const assignmentFormSchema = z.object({
  title: z.string().min(1, 'Assignment title is required'),
  class_id: z.number().min(1, 'Please select a class'),
  due_date: z.string().min(1, 'Due date is required'),
});

type AssignmentFormValues = z.infer<typeof assignmentFormSchema>;

interface AssignmentFormProps {
  onSuccess?: () => void;
}

export function AssignmentForm({ onSuccess }: AssignmentFormProps) {
  const [open, setOpen] = useState(false);
  const { addAssignment } = useAssignmentStore();
  
  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      title: '',
      class_id: undefined,
      due_date: '',
    },
  });

  // Fetch user's classes
  const { data: classes = [], isLoading: isLoadingClasses } = api.class.getAll.useQuery();
  
  // Create assignment mutation
  const createAssignment = api.assignment.createManual.useMutation({
    onSuccess: (data) => {
      // Add to store for optimistic update
      addAssignment(data);
      toast.success('Assignment created successfully!');
      form.reset();
      setOpen(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create assignment');
    },
  });

  const onSubmit = async (values: AssignmentFormValues) => {
    try {
      await createAssignment.mutateAsync(values);
    } catch (error) {
      // Error handled by mutation onError
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Assignment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Assignment</DialogTitle>
          <DialogDescription>
            Add a new assignment to one of your existing classes.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignment Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter assignment title..."
                      data-testid="assignment-title-input"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="class_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value, 10))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="class-select">
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingClasses ? (
                        <SelectItem value="loading" disabled>
                          Loading classes...
                        </SelectItem>
                      ) : classes.length === 0 ? (
                        <SelectItem value="empty" disabled>
                          No classes available
                        </SelectItem>
                      ) : (
                        classes.map((classItem: Class) => (
                          <SelectItem
                            key={classItem.id}
                            value={classItem.id.toString()}
                          >
                            {classItem.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      data-testid="due-date-input"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createAssignment.isPending}
              >
                {createAssignment.isPending ? 'Creating...' : 'Create Assignment'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}