import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Award,
  CheckCircle,
  ChevronRight
} from 'lucide-react';
import { MembershipTier } from '@shared/schema';

// Map tier names to colors
const tierInfo: Record<MembershipTier, { color: string, bgColor: string, progressColor: string, borderColor: string }> = {
  STANDARD: { 
    color: 'text-gray-700', 
    bgColor: 'bg-gray-100',
    progressColor: 'bg-gray-500',
    borderColor: 'border-gray-200'
  },
  SILVER: { 
    color: 'text-gray-600', 
    bgColor: 'bg-gray-200',
    progressColor: 'bg-gray-400',
    borderColor: 'border-gray-300'
  },
  GOLD: { 
    color: 'text-amber-600', 
    bgColor: 'bg-amber-100',
    progressColor: 'bg-amber-500',
    borderColor: 'border-amber-200'
  },
  PLATINUM: { 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-100',
    progressColor: 'bg-blue-500',
    borderColor: 'border-blue-200'
  }
};

// Tier thresholds and benefits
const tierThresholds = {
  STANDARD: 0,
  SILVER: 10000,
  GOLD: 25000,
  PLATINUM: 50000
};

// Benefits by tier (most important 3 benefits)
const tierTopBenefits: Record<MembershipTier, string[]> = {
  STANDARD: [
    'No conversion fees up to 10,000 points/month',
    'Access to all loyalty programs',
    'Standard exchange rates'
  ],
  SILVER: [
    'No conversion fees up to 20,000 points/month',
    'Priority email support',
    'Reduced fees (0.4%)'
  ],
  GOLD: [
    'No conversion fees up to 50,000 points/month',
    'Premium exchange rates',
    'Early access to new features'
  ],
  PLATINUM: [
    'Unlimited fee-free conversions',
    'Best exchange rates guaranteed',
    'VIP event invitations'
  ]
};

const tierNames: Record<MembershipTier, string> = {
  STANDARD: 'Standard',
  SILVER: 'Silver',
  GOLD: 'Gold',
  PLATINUM: 'Platinum'
};

interface MobileMembershipTierProps {
  onViewAllTiers?: () => void;
}

const MobileMembershipTier: React.FC<MobileMembershipTierProps> = ({ onViewAllTiers }) => {
  const { user } = useAuth();
  const currentTier = user?.membershipTier || 'STANDARD';
  
  // Fetch user stats to show progress towards next tier
  const { data: userStats, isLoading } = useQuery<{
    pointsConverted: number;
    feesPaid: number;
    monthlyPoints: number;
    tier: MembershipTier;
  }>({
    queryKey: ['/api/user-stats'],
    enabled: !!user,
  });

  const tierOrder: MembershipTier[] = ['STANDARD', 'SILVER', 'GOLD', 'PLATINUM'];
  const currentTierIndex = tierOrder.indexOf(currentTier);
  const nextTier = currentTierIndex < tierOrder.length - 1 ? tierOrder[currentTierIndex + 1] : null;
  
  // Calculate progress percentage towards next tier
  const monthlyPoints = userStats?.monthlyPoints || 0;
  const nextTierThreshold = nextTier ? tierThresholds[nextTier] : Infinity;
  const currentTierThreshold = tierThresholds[currentTier];
  
  const progressPercentage = nextTier 
    ? Math.min(100, Math.round(((monthlyPoints - currentTierThreshold) / (nextTierThreshold - currentTierThreshold)) * 100))
    : 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your Membership</h2>
        <Button variant="ghost" size="sm" onClick={onViewAllTiers} className="flex items-center text-sm font-medium">
          View all tiers <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      <Card className={`border ${tierInfo[currentTier].borderColor}`}>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tierInfo[currentTier].bgColor}`}>
                <Award className={`h-5 w-5 ${tierInfo[currentTier].color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Tier</p>
                <p className={`font-semibold ${tierInfo[currentTier].color}`}>{tierNames[currentTier]}</p>
              </div>
            </div>
            <Badge className={`${tierInfo[currentTier].bgColor} ${tierInfo[currentTier].color} border-0`}>
              Active
            </Badge>
          </div>
          
          {nextTier && (
            <div className="mb-4">
              <div className="flex justify-between items-center text-sm mb-1.5">
                <div className="font-medium">Progress to {tierNames[nextTier]}</div>
                <div className="text-muted-foreground text-xs">
                  {monthlyPoints.toLocaleString()} / {nextTierThreshold.toLocaleString()}
                </div>
              </div>
              <Progress 
                value={progressPercentage} 
                className={`h-2 ${tierInfo[nextTier].progressColor}`}
              />
              <div className="text-xs text-muted-foreground mt-1">
                {(nextTierThreshold - monthlyPoints).toLocaleString()} more points needed
              </div>
            </div>
          )}
          
          {currentTier === 'PLATINUM' && (
            <div className="mb-4 bg-blue-50 p-3 rounded-md">
              <div className="flex items-center gap-2 text-blue-700">
                <Award className="h-4 w-4" />
                <span className="font-medium text-sm">Highest tier reached!</span>
              </div>
            </div>
          )}
          
          <Separator className="my-3" />
          
          <div>
            <p className="font-medium text-sm mb-2">Your Benefits</p>
            <div className="space-y-2">
              {tierTopBenefits[currentTier].map((benefit, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-xs">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileMembershipTier;