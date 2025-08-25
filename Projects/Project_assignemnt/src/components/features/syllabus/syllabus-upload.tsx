'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Upload, FileText, Type } from 'lucide-react';
import { toast } from 'sonner';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/trpc';
import { useFileUpload } from '@/hooks';
import type { Class } from '@/types';

// Constants
const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
] as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const MIN_TEXT_LENGTH = 100;
const FILE_TYPE_EXTENSIONS = '.pdf,.txt,.doc,.docx';

// Validation schema for syllabus upload
const syllabusUploadSchema = z.object({
  class_id: z.number().min(1, 'Please select a class from the dropdown'),
  input_method: z.enum(['file', 'text'], {
    message: 'Please select either file upload or text input method',
  }),
  file: z.instanceof(File).optional(),
  text_content: z.string().optional(),
}).refine((data) => {
  if (data.input_method === 'file' && !data.file) {
    return false;
  }
  if (data.input_method === 'text' && (!data.text_content || data.text_content.trim().length < MIN_TEXT_LENGTH)) {
    return false;
  }
  return true;
}, {
  message: `Please provide either a valid file or sufficient text content (minimum ${MIN_TEXT_LENGTH} characters)`,
  path: ['text_content'],
});

type SyllabusUploadValues = z.infer<typeof syllabusUploadSchema>;

interface SyllabusUploadProps {
  onSuccess?: () => void;
}

export function SyllabusUpload({ onSuccess }: SyllabusUploadProps) {
  
  const form = useForm<SyllabusUploadValues>({
    resolver: zodResolver(syllabusUploadSchema),
    defaultValues: {
      class_id: undefined,
      input_method: 'file',
      text_content: '',
    },
  });

  const inputMethod = form.watch('input_method');
  const textContent = form.watch('text_content');

  // Fetch user's classes
  const { data: classes = [], isLoading: isLoadingClasses } = api.class.getAll.useQuery();

  // File upload handling
  const { dragActive, handleDrag, handleDrop, handleFileInputChange } = useFileUpload({
    acceptedTypes: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    onFileSelect: (file) => {
      form.setValue('file', file);
      form.setValue('input_method', 'file');
      form.clearErrors('file');
    },
  });

  // Syllabus upload mutation
  const uploadSyllabus = api.syllabus.uploadText.useMutation({
    onSuccess: (data) => {
      const message = data.assignmentsCreated > 0 
        ? `🎉 Success! Created ${data.assignmentsCreated} assignments from your syllabus`
        : '✅ Syllabus processed, but no assignments were found to extract';
      
      toast.success(message, {
        duration: 5000,
      });
      
      if (data.notes) {
        toast.info(`AI Notes: ${data.notes}`, {
          duration: 7000,
        });
      }
      
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to upload syllabus');
    },
  });

  const onSubmit = async (values: SyllabusUploadValues) => {
    try {
      if (values.input_method === 'text' && values.text_content && values.class_id) {
        await uploadSyllabus.mutateAsync({
          class_id: values.class_id,
          text_content: values.text_content,
        });
      } else if (values.input_method === 'file') {
        // File upload not implemented yet
        toast.info('File upload feature coming soon! Please use text input for now.');
      } else {
        toast.error('Please provide valid syllabus content and select a class.');
      }
    } catch (error) {
      // Error handling is done in the mutation's onError callback
      console.error('Upload error:', error);
    }
  };


  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Syllabus
          </CardTitle>
          <CardDescription>
            Select a class and upload your syllabus file or paste the text content for AI parsing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Class Selection */}
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

              {/* Input Method Selection */}
              <FormField
                control={form.control}
                name="input_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Input Method</FormLabel>
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        type="button"
                        variant={field.value === 'file' ? 'default' : 'outline'}
                        className="h-auto p-4 justify-start"
                        onClick={() => field.onChange('file')}
                      >
                        <FileText className="h-5 w-5 mr-2" />
                        <div className="text-left">
                          <div className="font-medium">Upload File</div>
                          <div className="text-sm text-muted-foreground">
                            PDF, TXT, DOC, DOCX
                          </div>
                        </div>
                      </Button>
                      <Button
                        type="button"
                        variant={field.value === 'text' ? 'default' : 'outline'}
                        className="h-auto p-4 justify-start"
                        onClick={() => field.onChange('text')}
                      >
                        <Type className="h-5 w-5 mr-2" />
                        <div className="text-left">
                          <div className="font-medium">Paste Text</div>
                          <div className="text-sm text-muted-foreground">
                            Copy and paste content
                          </div>
                        </div>
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* File Upload Section */}
              {inputMethod === 'file' && (
                <FormField
                  control={form.control}
                  name="file"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Syllabus File</FormLabel>
                      <FormControl>
                        <div
                          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                            dragActive
                              ? 'border-primary bg-primary/5'
                              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                          }`}
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={handleDrop}
                        >
                          {field.value ? (
                            <div className="space-y-2">
                              <FileText className="h-8 w-8 mx-auto text-primary" />
                              <p className="font-medium">{field.value.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {(field.value.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => form.setValue('file', undefined)}
                              >
                                Remove File
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-4" />
                              <p className="text-lg font-medium mb-2">
                                Drop your syllabus file here
                              </p>
                              <p className="text-sm text-muted-foreground mb-4">
                                or click to select a file
                              </p>
                              <Input
                                type="file"
                                accept={FILE_TYPE_EXTENSIONS}
                                onChange={handleFileInputChange}
                                className="hidden"
                                id="file-input"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById('file-input')?.click()}
                              >
                                Select File
                              </Button>
                              <p className="text-xs text-muted-foreground mt-2">
                                Supported formats: PDF, TXT, DOC, DOCX (max {MAX_FILE_SIZE / (1024 * 1024)}MB)
                              </p>
                            </>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Text Paste Section */}
              {inputMethod === 'text' && (
                <FormField
                  control={form.control}
                  name="text_content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Syllabus Content</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Textarea
                            placeholder="Paste your syllabus content here..."
                            className="min-h-[200px] resize-y"
                            data-testid="syllabus-text-input"
                            {...field}
                          />
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Minimum {MIN_TEXT_LENGTH} characters required</span>
                            <span className={textContent && textContent.length < MIN_TEXT_LENGTH ? 'text-destructive' : ''}>
                              {textContent?.length || 0} characters
                            </span>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={uploadSyllabus.isPending}
                  className="min-w-[150px]"
                >
                  {uploadSyllabus.isPending ? 'Uploading...' : 'Upload Syllabus'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}