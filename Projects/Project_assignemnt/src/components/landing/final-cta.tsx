'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SectionContainer } from '@/components/ui/section-container';
import { ArrowRight, CheckCircle2, Sparkles, Clock, CreditCard, Shield } from 'lucide-react';

const trustSignals = [
  {
    icon: CheckCircle2,
    text: 'Free Forever'
  },
  {
    icon: CreditCard,
    text: 'No Credit Card'
  },
  {
    icon: Clock,
    text: '2 Min Setup'
  },
  {
    icon: Shield,
    text: 'Data Protected'
  }
];

export function FinalCTASection() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/auth');
  };

  return (
    <SectionContainer background="gradient" size="lg">
      <div className="text-center space-y-12">
        {/* Decorative Elements */}
        <div className="relative">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-24 h-24 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
          </div>
          <div className="absolute top-8 left-1/4 transform -translate-x-1/2">
            <div className="w-16 h-16 bg-indigo-200 rounded-full opacity-30 animate-pulse delay-500"></div>
          </div>
          <div className="absolute top-8 right-1/4 transform translate-x-1/2">
            <div className="w-12 h-12 bg-purple-200 rounded-full opacity-25 animate-pulse delay-1000"></div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-blue-200">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Transform Your Academic Life</span>
          </div>

          {/* Headlines */}
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight max-w-4xl mx-auto">
              Ready to Take Control of Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Semester?
              </span>
            </h2>
            
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Sign up for free and get your first AI-powered assignment plan in minutes.
            </p>
          </div>

          {/* CTA Button */}
          <div className="space-y-6">
            <Button 
              onClick={handleGetStarted}
              size="lg"
              className="text-xl px-12 py-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 group relative overflow-hidden"
            >
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <span className="relative z-10 flex items-center gap-3">
                Get Started for Free
                <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
              </span>
            </Button>

            {/* Trust Signals */}
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
              {trustSignals.map((signal, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 text-gray-600"
                >
                  <signal.icon className="w-5 h-5 text-green-500" />
                  <span className="font-medium">{signal.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-2">
            <div className="flex -space-x-2">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 border-2 border-white flex items-center justify-center text-white text-sm font-medium"
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <span className="text-sm text-gray-600 ml-3">
              Join <strong>1,000+</strong> students already using AI to excel
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">15min</div>
              <div className="text-sm text-gray-600">Average time saved per assignment</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-blue-200">
              <div className="text-2xl font-bold text-green-600">94%</div>
              <div className="text-sm text-gray-600">Of students report better grades</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-blue-200">
              <div className="text-2xl font-bold text-purple-600">Zero</div>
              <div className="text-sm text-gray-600">Missed deadlines with our system</div>
            </div>
          </div>
        </div>

        {/* Final Message */}
        <div className="max-w-2xl mx-auto">
          <p className="text-lg text-gray-700">
            Don&apos;t let another semester overwhelm you. Take control today and experience the difference AI-powered organization can make.
          </p>
        </div>
      </div>
    </SectionContainer>
  );
}