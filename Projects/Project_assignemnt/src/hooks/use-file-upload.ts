import { useState } from 'react';
import { toast } from 'sonner';

interface UseFileUploadOptions {
  acceptedTypes: readonly string[];
  maxSize: number;
  onFileSelect?: (file: File) => void;
}

export function useFileUpload({
  acceptedTypes,
  maxSize,
  onFileSelect,
}: UseFileUploadOptions) {
  const [dragActive, setDragActive] = useState(false);

  const validateFile = (file: File): boolean => {
    // Validate file type
    if (!acceptedTypes.includes(file.type)) {
      const extensions = acceptedTypes
        .map(type => {
          switch (type) {
            case 'application/pdf': return 'PDF';
            case 'text/plain': return 'TXT';
            case 'application/msword': return 'DOC';
            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': return 'DOCX';
            default: return type;
          }
        })
        .join(', ');
      
      toast.error(`Please select a ${extensions} file`);
      return false;
    }

    // Validate file size
    if (file.size > maxSize) {
      const sizeMB = maxSize / (1024 * 1024);
      toast.error(`File size must be less than ${sizeMB}MB`);
      return false;
    }

    return true;
  };

  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      onFileSelect?.(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileSelect(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  return {
    dragActive,
    handleDrag,
    handleDrop,
    handleFileInputChange,
    handleFileSelect,
  };
}