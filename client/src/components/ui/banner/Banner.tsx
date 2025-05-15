import React from 'react';
import { cn } from '@/lib/utils';

interface BannerProps {
  title: string;
  subtitle?: string;
  gradientColors?: string[];
  backgroundImage?: string;
  overlayOpacity?: number;
  pattern?: 'dots' | 'grid' | 'waves' | 'none';
  align?: 'left' | 'center' | 'right';
  textColor?: string;
  height?: 'sm' | 'md' | 'lg';
  actionButton?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

const Banner: React.FC<BannerProps> = ({
  title,
  subtitle,
  gradientColors = ['from-blue-600', 'to-blue-400'],
  backgroundImage,
  overlayOpacity = 0.4,
  pattern = 'dots',
  align = 'left',
  textColor = 'text-white',
  height = 'md',
  actionButton,
  className,
  children,
}) => {
  const heightClasses = {
    sm: 'py-6',
    md: 'py-10',
    lg: 'py-16',
  };
  
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };
  
  const patternStyles = {
    dots: {
      backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)',
      backgroundSize: '20px 20px',
    },
    grid: {
      backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
      backgroundSize: '20px 20px',
    },
    waves: {
      backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'20\' viewBox=\'0 0 100 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M21.184 20c.357-.13.72-.264 1.088-.402l1.768-.661C33.64 15.347 39.647 14 50 14c10.271 0 15.362 1.222 24.629 4.928.955.383 1.869.74 2.75 1.072h6.225c-2.51-.73-5.139-1.691-8.233-2.928C65.888 13.278 60.562 12 50 12c-10.626 0-16.855 1.397-26.66 5.063l-1.767.662c-2.475.923-4.66 1.674-6.724 2.275h6.335zm0-20C13.258 2.892 8.077 4 0 4V2c5.744 0 9.951-.574 14.85-2h6.334zM77.38 0C85.239 2.966 90.502 4 100 4V2c-6.842 0-11.386-.542-16.396-2h-6.225zM0 14c8.44 0 13.718-1.21 22.272-4.402l1.768-.661C33.64 5.347 39.647 4 50 4c10.271 0 15.362 1.222 24.629 4.928C84.112 12.722 89.438 14 100 14v-2c-10.271 0-15.362-1.222-24.629-4.928C65.888 3.278 60.562 2 50 2 39.374 2 33.145 3.397 23.34 7.063l-1.767.662C13.223 10.84 8.163 12 0 12v2z\' fill=\'rgba(255, 255, 255, 0.1)\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
      backgroundSize: '100px 20px',
    },
    none: {},
  };
  
  // Prepare styles based on whether we have a background image or gradient
  const backgroundStyles = backgroundImage
    ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { };

  return (
    <div 
      className={cn(
        'relative overflow-hidden rounded-xl mb-6',
        !backgroundImage && `bg-gradient-to-r ${gradientColors.join(' ')}`,
        heightClasses[height],
        className
      )}
      style={{
        ...backgroundStyles,
        ...(pattern !== 'none' ? patternStyles[pattern] : {})
      }}
    >
      {/* Gradient or image overlay */}
      <div 
        className={cn(
          "absolute inset-0",
          !backgroundImage && "bg-gradient-to-r from-black/10 to-transparent",
          backgroundImage && "bg-black"
        )}
        style={{ opacity: backgroundImage ? overlayOpacity : undefined }}
      ></div>
      
      {/* Add gradient overlay on top of the image/pattern for better text readability */}
      {backgroundImage && (
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-black/20"></div>
      )}
      
      <div className={cn(
        'relative z-10 container mx-auto px-4 flex flex-col h-full',
        alignClasses[align],
        align === 'center' ? 'items-center' : '',
        align === 'right' ? 'items-end' : '',
      )}>
        <div className={cn(
          'flex flex-col',
          align === 'center' ? 'items-center' : '',
          align === 'right' ? 'items-end' : '',
        )}>
          <h1 className={cn('text-2xl md:text-3xl lg:text-4xl font-bold mb-2', textColor)}>
            {title}
          </h1>
          
          {subtitle && (
            <p className={cn('text-sm md:text-base opacity-90 max-w-xl', textColor)}>
              {subtitle}
            </p>
          )}
          
          {actionButton && (
            <div className="mt-4">
              {actionButton}
            </div>
          )}
          
          {children && (
            <div className="mt-4">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Banner;