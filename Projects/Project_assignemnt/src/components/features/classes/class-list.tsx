'use client';

import { useMemo, useState } from 'react';
import { ClassCard } from './class-card';
import { ClassForm } from './class-form';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, BookOpen } from 'lucide-react';
import type { Class } from '@/types';
import { api } from '@/lib/trpc';
import { useClassStore } from '@/stores/classes';
import { toast } from 'sonner';
import { useAssignments } from '@/hooks/use-assignments';

interface ClassListProps {
  classes: Class[];
  isLoading?: boolean;
}

export function ClassList({ classes, isLoading = false }: ClassListProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingClass, setDeletingClass] = useState<Class | null>(null);

  const { addClass, updateClass, removeClass } = useClassStore();

  // Ensure assignments are loaded so we can compute counts per class
  const { assignments, isLoading: assignmentsLoading } = useAssignments();

  const createClassMutation = api.class.create.useMutation({
    onSuccess: (newClass) => {
      addClass(newClass);
      toast.success('Class created successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateClassMutation = api.class.update.useMutation({
    onSuccess: (updatedClass) => {
      updateClass(updatedClass.id, updatedClass);
      toast.success('Class updated successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteClassMutation = api.class.delete.useMutation({
    onSuccess: (result) => {
      if (deletingClass) {
        removeClass(deletingClass.id);
        const message = result.deletedAssignments > 0 
          ? `Class deleted successfully. ${result.deletedAssignments} assignment${result.deletedAssignments !== 1 ? 's' : ''} were also deleted.`
          : 'Class deleted successfully';
        toast.success(message);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Compute per-class stats map from the assignments store
  const statsByClass = useMemo(() => {
    const map = new Map<number, { completed: number; remaining: number }>();
    for (const a of assignments) {
      const entry = map.get(a.class_id) || { completed: 0, remaining: 0 };
      if (a.status === 'complete') entry.completed += 1;
      else entry.remaining += 1;
      map.set(a.class_id, entry);
    }
    return map;
  }, [assignments]);

  const handleCreateClass = async (name: string) => {
    await createClassMutation.mutateAsync({ name });
  };

  const handleEditClass = async (name: string) => {
    if (!editingClass) return;
    await updateClassMutation.mutateAsync({ 
      id: editingClass.id, 
      name 
    });
  };

  const handleEditClick = (classData: Class) => {
    setEditingClass(classData);
    setShowEditForm(true);
  };

  const handleDeleteClick = (classData: Class) => {
    setDeletingClass(classData);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingClass) return;
    await deleteClassMutation.mutateAsync({ id: deletingClass.id });
    setShowDeleteDialog(false);
    setDeletingClass(null);
  };

  if (isLoading || assignmentsLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-24 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No classes yet</h3>
        <p className="text-gray-500 mb-6">
          Create your first class to start organizing your assignments.
        </p>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Your First Class
        </Button>
        <ClassForm
          open={showCreateForm}
          onOpenChange={setShowCreateForm}
          onSubmit={handleCreateClass}
          isLoading={createClassMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Your Classes</h2>
          <p className="text-sm text-gray-600">
            {classes.length} class{classes.length !== 1 ? 'es' : ''}
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Class
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {classes.map((classData) => {
          const stats = statsByClass.get(classData.id) || { completed: 0, remaining: 0 };
          return (
            <ClassCard
              key={classData.id}
              classData={classData}
              completedCount={stats.completed}
              remainingCount={stats.remaining}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          );
        })}
      </div>

      <ClassForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onSubmit={handleCreateClass}
        isLoading={createClassMutation.isPending}
      />

      <ClassForm
        open={showEditForm}
        onOpenChange={setShowEditForm}
        onSubmit={handleEditClass}
        initialData={editingClass}
        isLoading={updateClassMutation.isPending}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deletingClass?.name}&rdquo;? 
              This action cannot be undone and will also delete all assignments 
              associated with this class.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteClassMutation.isPending}
            >
              {deleteClassMutation.isPending ? 'Deleting...' : 'Delete Class'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}