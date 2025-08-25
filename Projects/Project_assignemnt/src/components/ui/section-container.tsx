import { cn } from '@/lib/utils';

interface SectionContainerProps {
  children: React.ReactNode;
  className?: string;
  background?: 'white' | 'gray' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
}

export function SectionContainer({ 
  children, 
  className = '', 
  background = 'white',
  size = 'lg'
}: SectionContainerProps) {
  const backgrounds = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    gradient: 'bg-gradient-to-br from-blue-50 via-white to-indigo-50'
  };

  const sizes = {
    sm: 'py-12 md:py-16',
    md: 'py-16 md:py-20', 
    lg: 'py-16 md:py-24'
  };

  return (
    <section className={cn(
      'w-full',
      backgrounds[background],
      sizes[size],
      className
    )}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  );
}