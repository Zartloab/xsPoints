import React from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, TooltipProps } from 'recharts';
import { 
  ValueType, 
  NameType
} from 'recharts/types/component/DefaultTooltipContent';

interface SparklineProps {
  data: Array<{ date: string; rate: number }>;
  color?: string;
  height?: number;
  showTooltip?: boolean;
  className?: string;
}

const CustomTooltip = ({ 
  active, 
  payload, 
  label 
}: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 rounded-md shadow-md border text-xs">
        <p className="font-medium">{`${new Date(label).toLocaleDateString()}`}</p>
        <p className="text-primary font-semibold">
          Rate: {Number(payload[0].value).toFixed(6)}
        </p>
      </div>
    );
  }

  return null;
};

export const Sparkline: React.FC<SparklineProps> = ({ 
  data, 
  color = '#3b82f6', 
  height = 40,
  showTooltip = true,
  className = ''
}) => {
  if (!data || data.length === 0) {
    return <div style={{ height: `${height}px` }} className={`w-full bg-gray-100 rounded animate-pulse ${className}`} />;
  }
  
  try {
    // Determine if trend is positive
    const firstRate = data[0]?.rate || 0;
    const lastRate = data[data.length - 1]?.rate || 0;
    const isPositive = lastRate >= firstRate;
    
    // Use provided color or default to green for positive, red for negative
    const fillColor = color || (isPositive ? '#10b981' : '#ef4444');
    
    // Create unique ID for gradient to prevent conflicts with multiple sparklines
    const gradientId = `colorRate-${Math.random().toString(36).substring(2, 9)}`;
    
    return (
      <div style={{ height: `${height}px` }} className={className}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={fillColor} stopOpacity={0.4} />
                <stop offset="95%" stopColor={fillColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="rate"
              stroke={fillColor}
              strokeWidth={1.5}
              fillOpacity={1}
              fill={`url(#${gradientId})`}
              animationDuration={750}
              isAnimationActive={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  } catch (error) {
    console.error("Error rendering sparkline:", error);
    return <div style={{ height: `${height}px` }} className={`w-full bg-gray-100 rounded ${className}`} />;
  }
};