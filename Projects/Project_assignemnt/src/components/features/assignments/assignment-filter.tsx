'use client';

import { useAssignmentStore } from '@/stores/assignments';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AssignmentFilterProps {
  className?: string;
}

export function AssignmentFilter({ className }: AssignmentFilterProps) {
  const { selectedClassId, setSelectedClassId, getUniqueClasses } = useAssignmentStore();
  const classes = getUniqueClasses();

  const handleValueChange = (value: string) => {
    setSelectedClassId(value === 'all' ? null : parseInt(value, 10));
  };

  const currentValue = selectedClassId === null ? 'all' : selectedClassId.toString();

  return (
    <div className={className}>
      <Select value={currentValue} onValueChange={handleValueChange}>
        <SelectTrigger className="w-[200px] bg-white border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-colors">
          <SelectValue placeholder="Filter by class" />
        </SelectTrigger>
        <SelectContent className="bg-white border-gray-200 shadow-lg">
          <SelectItem value="all" className="hover:bg-gray-50 focus:bg-gray-50">
            All Classes
          </SelectItem>
          {classes.map((classItem) => (
            <SelectItem 
              key={classItem.id} 
              value={classItem.id.toString()}
              className="hover:bg-gray-50 focus:bg-gray-50"
            >
              {classItem.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}