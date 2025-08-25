'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Class } from '@/types';

interface ClassFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => Promise<void>;
  initialData?: Class | null;
  isLoading?: boolean;
}

export function ClassForm({
  open,
  onOpenChange,
  onSubmit,
  initialData = null,
  isLoading = false,
}: ClassFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!initialData;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Class name is required');
      return;
    }

    if (trimmedName.length > 255) {
      setError('Class name is too long (maximum 255 characters)');
      return;
    }

    try {
      await onSubmit(trimmedName);
      setName('');
      setError(null);
      onOpenChange(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setName(initialData?.name || '');
      setError(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Class' : 'Create New Class'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the class name below.'
              : 'Enter a name for your new class. This could include course codes and titles (e.g., "MATH 113 - Calculus I").'
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Class Name
              </Label>
              <Input
                id="name"
                placeholder="e.g., MATH 113 - Calculus I"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={error ? 'border-red-500' : ''}
                disabled={isLoading}
                maxLength={255}
              />
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading 
                ? 'Saving...' 
                : isEditing 
                  ? 'Update Class' 
                  : 'Create Class'
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}