import { SectionContainer } from '@/components/ui/section-container';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, LayoutDashboard, Brain, ArrowRight, CheckCircle2 } from 'lucide-react';

const features = [
  {
    icon: Upload,
    title: 'From Syllabus to Schedule in Seconds',
    description: 'Upload or paste any syllabus, and our AI will build your entire semester\'s schedule automatically.',
    benefit: 'Save hours of manual planning',
    visual: 'upload'
  },
  {
    icon: LayoutDashboard,
    title: 'Your Semester at a Glance',
    description: 'See all assignments on a clean dashboard with color-coded urgency indicators.',
    benefit: 'Never miss a deadline again',
    visual: 'dashboard'
  },
  {
    icon: Brain,
    title: 'The Perfect Assistant for Every Task',
    description: 'Always have the perfect assistant by your side. Get a tailored learning helper that guides you to do your best work.',
    benefit: 'Improve your grades with AI guidance',
    visual: 'ai'
  }
];

function FeatureVisual({ type }: { type: string }) {
  if (type === 'upload') {
    return (
      <div className="relative">
        <div className="w-full h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
          <Upload className="w-12 h-12 text-blue-600 animate-bounce" />
        </div>
        <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2">
          <CheckCircle2 className="w-4 h-4 text-white" />
        </div>
      </div>
    );
  }

  if (type === 'dashboard') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-2 bg-green-50 rounded border-l-4 border-green-500">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium">Assignment 1 - Due Today</span>
        </div>
        <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded border-l-4 border-yellow-500">
          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          <span className="text-sm font-medium">Essay - Due in 3 days</span>
        </div>
        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded border-l-4 border-blue-500">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-sm font-medium">Project - Due next week</span>
        </div>
      </div>
    );
  }

  if (type === 'ai') {
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Brain className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-blue-800">Let me help you break down this assignment into manageable steps...</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-xs">You</span>
          </div>
          <div className="flex-1 bg-gray-100 rounded-lg p-3">
            <p className="text-sm text-gray-700">How should I approach the research phase?</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export function SolutionSection() {
  return (
    <SectionContainer background="white" size="lg">
      <div className="space-y-16">
        {/* Section Header */}
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Introducing Your AI Study Partner
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transform chaos into clarity with intelligent automation and personalized guidance.
          </p>
        </div>

        {/* Features */}
        <div className="space-y-16">
          {features.map((feature, index) => (
            <div 
              key={index}
              className={`grid lg:grid-cols-2 gap-12 items-center ${
                index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''
              }`}
            >
              {/* Content */}
              <div className={`space-y-6 ${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-full">
                  <feature.icon className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Feature {index + 1}</span>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="font-medium text-green-800">{feature.benefit}</span>
                </div>
              </div>

              {/* Visual */}
              <div className={`${index % 2 === 1 ? 'lg:col-start-1' : ''}`}>
                <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <FeatureVisual type={feature.visual} />
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">
            Ready to experience the difference?
          </p>
          <div className="inline-flex items-center gap-2 text-blue-600 font-medium">
            <span>See how it works</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}