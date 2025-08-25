'use client';

import { memo } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Calendar, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Class } from '@/types';

interface ClassCardProps {
  classData: Class;
  completedCount?: number;
  remainingCount?: number;
  onEdit?: (classData: Class) => void;
  onDelete?: (classData: Class) => void;
}

export const ClassCard = memo(function ClassCard({ 
  classData, 
  completedCount = 0,
  remainingCount = 0, 
  onEdit, 
  onDelete 
}: ClassCardProps) {
  const createdDate = classData.created_at ? new Date(classData.created_at) : null;

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-0.5">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="font-medium text-sm leading-5">
                {classData.name}
              </h3>
              {createdDate && (
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>
                    Created {format(createdDate, 'MMM d, yyyy')}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs" aria-label={`${completedCount} assignments done`}>
              {completedCount} done
            </Badge>
            <Badge variant="outline" className="text-xs" aria-label={`${remainingCount} assignments left`}>
              {remainingCount} left
            </Badge>
            {(onEdit || onDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid="class-menu">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(classData)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem 
                      onClick={() => onDelete(classData)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
});