'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AssignmentReview } from '@/components/features/syllabus';
import type { AIParsingResult, ParsedAssignment } from '@/types';

// Mock data for demonstration - in production this would come from the AI parsing result
const mockAIResult: AIParsingResult = {
  assignments: [
    {
      title: 'Homework 1: Introduction to Calculus',
      due_date: '2025-08-15',
      description: 'Complete problems 1-20 from Chapter 1',
      type: 'homework',
      points: 50,
      class_id: 1,
    },
    {
      title: 'Quiz 1: Limits and Continuity', 
      due_date: '2025-08-22',
      description: 'Online quiz covering sections 1.1-1.3',
      type: 'quiz',
      points: 25,
      class_id: 1,
    },
    {
      title: 'Midterm Exam',
      due_date: '2025-09-15',
      description: 'Comprehensive exam covering chapters 1-4',
      type: 'exam',
      points: 100,
      class_id: 1,
    },
    {
      title: 'Final Project: Calculus Applications',
      due_date: '2025-12-01',
      description: 'Research project on real-world applications of calculus',
      type: 'project',
      points: 150,
      class_id: 1,
    },
  ],
  confidence: 0.85,
  notes: 'Successfully identified 4 assignments from the syllabus',
  className: 'MATH 113 - Calculus I',
  message: 'Successfully extracted 4 assignments from syllabus',
};

export default function ReviewAssignmentsPage() {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async (assignments: ParsedAssignment[]) => {
    setIsConfirming(true);
    
    try {
      // TODO: Implement actual save logic - this would call Story 2.4 functionality
      console.log('Confirmed assignments:', assignments);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In production, this would redirect to dashboard or show success
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to save assignments:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/upload-syllabus');
  };

  return (
    <div className="container mx-auto py-6">
      <AssignmentReview
        aiResult={mockAIResult}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isConfirming={isConfirming}
      />
    </div>
  );
}