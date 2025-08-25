import { SectionContainer } from '@/components/ui/section-container';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, MousePointer, Brain, ArrowRight } from 'lucide-react';

const steps = [
  {
    number: 1,
    icon: Upload,
    title: 'Upload Your Syllabi',
    description: 'Upload or paste syllabi to automatically build your schedule.',
    detail: 'Drag and drop your syllabus files or paste the text. Our AI instantly extracts all assignments, due dates, and requirements.',
    color: 'blue'
  },
  {
    number: 2,
    icon: MousePointer,
    title: 'Choose Your Assignment',
    description: 'Select any task from your dashboard to begin.',
    detail: 'Browse your organized assignment list and click on any task you want to work on. Everything is prioritized by urgency.',
    color: 'indigo'
  },
  {
    number: 3,
    icon: Brain,
    title: 'Get Your Learning Assistant',
    description: 'Provide instructions to get a personalized AI helper.',
    detail: 'Tell our AI about your assignment details and get a customized study plan with step-by-step guidance.',
    color: 'purple'
  }
];

function StepCard({ step, index }: { step: typeof steps[0], index: number }) {
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600 border-blue-200 bg-blue-50',
    indigo: 'from-indigo-500 to-indigo-600 border-indigo-200 bg-indigo-50', 
    purple: 'from-purple-500 to-purple-600 border-purple-200 bg-purple-50'
  };

  return (
    <div className="relative group">
      {/* Connection Line */}
      {index < steps.length - 1 && (
        <div className="hidden lg:block absolute top-1/2 left-full w-16 h-px bg-gradient-to-r from-gray-300 to-gray-400 transform -translate-y-1/2 z-0">
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      )}
      
      <Card className="relative z-10 transition-all duration-300 hover:shadow-xl group-hover:scale-105">
        <CardContent className="p-8 text-center space-y-6">
          {/* Step Number and Icon */}
          <div className="relative">
            <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${colorClasses[step.color]} flex items-center justify-center shadow-lg`}>
              <step.icon className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center border-2 border-gray-100">
              <span className="text-sm font-bold text-gray-700">{step.number}</span>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-gray-900">
              {step.title}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Detailed Description */}
          <div className={`p-4 rounded-lg border ${colorClasses[step.color]} bg-opacity-30`}>
            <p className="text-sm text-gray-700 leading-relaxed">
              {step.detail}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function HowItWorksSection() {
  return (
    <SectionContainer background="gradient" size="lg">
      <div className="space-y-16">
        {/* Section Header */}
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            How It Works in 3 Simple Steps
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From chaos to clarity in minutes. Our streamlined process makes academic organization effortless.
          </p>
        </div>

        {/* Steps */}
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div 
              key={step.number}
              className="opacity-0 animate-[fadeInUp_0.6s_ease-out_forwards]"
              style={{ animationDelay: `${index * 0.3}s` }}
            >
              <StepCard step={step} index={index} />
            </div>
          ))}
        </div>

        {/* Bottom Message */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full border border-blue-200">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">Average setup time: 2 minutes</span>
          </div>
          
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            That&apos;s it! Once set up, your AI study partner works continuously to keep you organized and on track.
          </p>
        </div>
      </div>
    </SectionContainer>
  );
}