import { SectionContainer } from '@/components/ui/section-container';
import { FeatureCard } from '@/components/ui/feature-card';
import { FileX, AlertTriangle, Target } from 'lucide-react';

const problemPoints = [
  {
    icon: FileX,
    title: 'Scattered Syllabi & Deadlines',
    description: 'Juggling information from your learning portal, emails, and lecture notes. Important dates buried in dense PDFs.'
  },
  {
    icon: AlertTriangle,
    title: 'The Fear of Forgetting',
    description: 'The nagging feeling that a deadline might have slipped through the cracks. Constant worry about missing something important.'
  },
  {
    icon: Target,
    title: 'The Pressure to Perform',
    description: 'The constant stress of not just submitting work, but submitting high-quality work, every single time.'
  }
];

export function ProblemSection() {
  return (
    <SectionContainer background="gray" size="lg">
      <div className="text-center space-y-12">
        {/* Section Header */}
        <div className="space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Tired of Semester Chaos?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Every semester, students face the same overwhelming challenges that turn learning into stress.
          </p>
        </div>

        {/* Problem Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {problemPoints.map((problem, index) => (
            <div 
              key={index}
              className="opacity-0 animate-[fadeInUp_0.6s_ease-out_forwards]"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <FeatureCard
                icon={problem.icon}
                title={problem.title}
                description={problem.description}
                variant="problem"
                className="h-full"
              />
            </div>
          ))}
        </div>

        {/* Bottom Message */}
        <div className="max-w-2xl mx-auto">
          <p className="text-lg text-gray-700 italic">
            Sound familiar? You&apos;re not alone. Thousands of students struggle with these exact same issues every semester.
          </p>
        </div>
      </div>
    </SectionContainer>
  );
}