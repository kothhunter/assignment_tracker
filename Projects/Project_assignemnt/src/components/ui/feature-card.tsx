import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  variant?: 'default' | 'problem' | 'solution';
}

export function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  className = '',
  variant = 'default'
}: FeatureCardProps) {
  const variants = {
    default: 'bg-white border-gray-200 hover:border-gray-300',
    problem: 'bg-white border-red-100 hover:border-red-200 text-red-800',
    solution: 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:border-blue-300'
  };

  const iconVariants = {
    default: 'text-blue-600',
    problem: 'text-red-500',
    solution: 'text-blue-600'
  };

  return (
    <Card className={cn(
      'transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer group',
      variants[variant],
      className
    )}>
      <CardContent className="p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/50 flex items-center justify-center group-hover:bg-white/80 transition-colors">
          <Icon className={cn('h-8 w-8', iconVariants[variant])} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          {title}
        </h3>
        <p className="text-gray-600 leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}