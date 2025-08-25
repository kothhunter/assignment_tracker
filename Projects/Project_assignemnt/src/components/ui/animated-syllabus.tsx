'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Calendar, AlertCircle } from 'lucide-react';

export function AnimatedSyllabus() {
  const [currentState, setCurrentState] = useState<'chaotic' | 'transforming' | 'organized'>('chaotic');

  useEffect(() => {
    const sequence = async () => {
      // Stay in chaotic state for 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      setCurrentState('transforming');
      
      // Transforming state for 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCurrentState('organized');
      
      // Stay organized for 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Loop back to chaotic
      setCurrentState('chaotic');
    };

    const interval = setInterval(sequence, 5000);
    return () => clearInterval(interval);
  }, []);

  const ChaoticState = () => (
    <Card className="p-6 bg-gray-100 border-2 border-dashed border-gray-300 transform rotate-1">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-4 h-4 bg-red-200 rounded"></div>
          <span className="text-gray-600">Assignment 1 - Due: ???</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-4 h-4 bg-yellow-200 rounded"></div>
          <span className="text-gray-600">Midterm exam somewhere...</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-4 h-4 bg-blue-200 rounded"></div>
          <span className="text-gray-600">Final project info buried in PDF</span>
        </div>
        <div className="text-xs text-gray-400 italic">
          Pages of scattered information...
        </div>
      </div>
    </Card>
  );

  const OrganizedState = () => (
    <Card className="p-6 bg-white border-2 border-blue-200 shadow-lg">
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-sm">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <div className="flex-1">
            <span className="font-medium text-gray-900">Assignment 1</span>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Calendar className="w-3 h-3" />
              <span>Due: Oct 15, 2024</span>
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>High Priority</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <CheckCircle2 className="w-5 h-5 text-blue-500" />
          <div className="flex-1">
            <span className="font-medium text-gray-900">Midterm Exam</span>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Calendar className="w-3 h-3" />
              <span>Due: Oct 22, 2024</span>
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>Medium Priority</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <CheckCircle2 className="w-5 h-5 text-gray-400" />
          <div className="flex-1">
            <span className="font-medium text-gray-900">Final Project</span>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Calendar className="w-3 h-3" />
              <span>Due: Dec 10, 2024</span>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Low Priority</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

  const TransformingState = () => (
    <div className="relative">
      <Card className="p-6 bg-gradient-to-br from-blue-100 to-indigo-100 border-2 border-blue-300 animate-pulse">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            <span className="text-blue-800 font-medium">Organizing assignments...</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-600 rounded-full border-t-transparent animate-spin delay-100"></div>
            <span className="text-blue-800 font-medium">Extracting due dates...</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-600 rounded-full border-t-transparent animate-spin delay-200"></div>
            <span className="text-blue-800 font-medium">Setting priorities...</span>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="w-full h-64 flex items-center justify-center">
      <div className="w-80 transition-all duration-500 ease-in-out">
        {currentState === 'chaotic' && <ChaoticState />}
        {currentState === 'transforming' && <TransformingState />}
        {currentState === 'organized' && <OrganizedState />}
      </div>
    </div>
  );
}