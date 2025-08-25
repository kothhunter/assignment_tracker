import { Metadata } from 'next';
import { 
  HeroSection, 
  ProblemSection, 
  SolutionSection, 
  HowItWorksSection, 
  FinalCTASection,
  Navigation
} from '@/components/landing';

export const metadata: Metadata = {
  title: 'Organize Your Semester. Master Your Subjects. | Assignment Tracker',
  description: 'Turn your assignments into actionable plans. Get a personalized AI study buddy for every task, from syllabus to final submission.',
  keywords: 'assignment tracker, AI study assistant, syllabus organizer, academic planner, student productivity, AI-powered learning',
  authors: [{ name: 'Assignment Tracker Team' }],
  openGraph: {
    title: 'Organize Your Semester. Master Your Subjects.',
    description: 'Turn your assignments into actionable plans. Get a personalized AI study buddy for every task, from syllabus to final submission.',
    type: 'website',
    siteName: 'Assignment Tracker',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Organize Your Semester. Master Your Subjects.',
    description: 'Turn your assignments into actionable plans. Get a personalized AI study buddy for every task, from syllabus to final submission.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <HowItWorksSection />
      <FinalCTASection />
    </main>
  );
}