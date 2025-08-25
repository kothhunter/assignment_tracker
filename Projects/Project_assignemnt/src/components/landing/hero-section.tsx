'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SectionContainer } from '@/components/ui/section-container';
import { AnimatedSyllabus } from '@/components/ui/animated-syllabus';
import { ArrowRight, Sparkles } from 'lucide-react';

export function HeroSection() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/auth');
  };

  return (
    <SectionContainer background="gradient" size="lg" className="min-h-screen flex items-center pt-16">
      <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
        {/* Left Content */}
        <div className="space-y-8 text-center lg:text-left">
          {/* Brand Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-blue-200">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">AI-Powered Study Assistant</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Organize Your Semester.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Master Your Subjects.
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Turn your assignments into actionable plans. Get a personalized AI study buddy for every task, 
              from syllabus to final submission.
            </p>
          </div>

          {/* CTA Button */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Button 
              onClick={handleGetStarted}
              size="lg"
              className="text-lg px-8 py-6 bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 group"
            >
              Get Started for Free
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <div className="flex items-center justify-center lg:justify-start gap-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Free</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>No Credit Card</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>2 Min Setup</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Animation */}
        <div className="flex items-center justify-center lg:justify-end">
          <div className="relative">
            {/* Decorative Elements */}
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-indigo-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
            
            {/* Main Animation */}
            <div className="relative z-10">
              <AnimatedSyllabus />
            </div>
            
            {/* Floating Elements */}
            <div className="absolute top-8 -right-8 bg-white rounded-lg shadow-lg p-3 animate-bounce delay-500">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-xs font-medium text-gray-700">Assignment Due</span>
              </div>
            </div>
            
            <div className="absolute bottom-8 -left-8 bg-white rounded-lg shadow-lg p-3 animate-bounce delay-1000">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-xs font-medium text-gray-700">AI Assistant Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}