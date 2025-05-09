import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Award, CheckCircle, Info } from 'lucide-react';
import { MembershipTier } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { Separator } from '@/components/ui/separator';

// Map tier names to colors and icons
const tierInfo: Record<MembershipTier, { color: string, bgColor: string, progressColor: string }> = {
  STANDARD: { 
    color: 'text-gray-700', 
    bgColor: 'bg-gray-100',
    progressColor: 'bg-gray-500'
  },
  SILVER: { 
    color: 'text-gray-600', 
    bgColor: 'bg-gray-200',
    progressColor: 'bg-gray-400'
  },
  GOLD: { 
    color: 'text-amber-600', 
    bgColor: 'bg-amber-100',
    progressColor: 'bg-amber-500'
  },
  PLATINUM: { 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-100',
    progressColor: 'bg-blue-500'
  }
};

// Tier thresholds and benefits
const tierThresholds = {
  STANDARD: 0,
  SILVER: 10000,
  GOLD: 25000,
  PLATINUM: 50000
};

// Benefits by tier
const tierBenefits: Record<MembershipTier, string[]> = {
  STANDARD: [
    'No conversion fees up to 10,000 points per month',
    'Basic support',
    'Standard exchange rates',
    'Access to all loyalty programs'
  ],
  SILVER: [
    'No conversion fees up to 20,000 points per month',
    'Priority email support',
    'Reduced fees (0.4% on conversions above monthly limit)',
    'Access to exclusive promotions'
  ],
  GOLD: [
    'No conversion fees up to 50,000 points per month',
    '24/7 priority support',
    'Reduced fees (0.3% on conversions above monthly limit)',
    'Premium exchange rates',
    'Early access to new features'
  ],
  PLATINUM: [
    'Unlimited fee-free conversions',
    'Dedicated account manager',
    'Best exchange rates guaranteed',
    'Free account linking verification',
    'VIP event invitations',
    'Custom conversion solutions'
  ]
};

const tierNames: Record<MembershipTier, string> = {
  STANDARD: 'Standard',
  SILVER: 'Silver',
  GOLD: 'Gold',
  PLATINUM: 'Platinum'
};

interface TierCardProps {
  tier: MembershipTier;
  isCurrentTier: boolean;
  isExpandedView?: boolean;
}

const TierCard: React.FC<TierCardProps> = ({ tier, isCurrentTier, isExpandedView = false }) => {
  return (
    <Card className={`transition-all ${isCurrentTier ? 'border-primary shadow-md' : 'opacity-80'}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <div className={`flex items-center gap-2 ${tierInfo[tier].color}`}>
            <Award className="h-5 w-5" />
            <span>{tierNames[tier]}</span>
          </div>
          
          {isCurrentTier && (
            <Badge variant="outline" className="bg-primary/10 text-primary">
              Current
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        <div className="mb-3">
          <div className="text-muted-foreground mb-1 text-xs">Monthly Points Required</div>
          <div className="font-semibold">{tier === 'STANDARD' ? 'None' : `${tierThresholds[tier].toLocaleString()}+`}</div>
        </div>
        
        <Separator className="my-3" />
        
        <div className="space-y-2">
          <div className="font-medium mb-2">Benefits</div>
          {tierBenefits[tier].map((benefit, index) => (
            <div key={index} className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-xs">{benefit}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const MembershipTierCard: React.FC = () => {
  const { user } = useAuth();
  const currentTier = user?.membershipTier || 'STANDARD';
  
  // Fetch user stats to show progress towards next tier
  const { data: userStats, isLoading } = useQuery({
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
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="text-xl">Membership Tiers</span>
          {user && (
            <div className="flex items-center">
              <Badge className={`${tierInfo[currentTier].bgColor} ${tierInfo[currentTier].color} border-0`}>
                {tierNames[currentTier]} Member
              </Badge>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {user && nextTier && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-medium">
                Progress to {tierNames[nextTier]}
              </div>
              <div className="text-sm text-muted-foreground">
                {monthlyPoints.toLocaleString()} / {nextTierThreshold.toLocaleString()} points
              </div>
            </div>
            <Progress 
              value={progressPercentage} 
              className={`h-2 ${tierInfo[nextTier].progressColor}`}
            />
            <div className="text-xs text-muted-foreground mt-1">
              {(nextTierThreshold - monthlyPoints).toLocaleString()} more points needed this month
            </div>
          </div>
        )}
        
        {user && currentTier === 'PLATINUM' && (
          <div className="mb-6 bg-blue-50 p-3 rounded-md border border-blue-100">
            <div className="flex items-center gap-2 text-blue-700">
              <Award className="h-5 w-5" />
              <span className="font-medium">You've reached our highest tier!</span>
            </div>
            <p className="text-sm text-blue-600 mt-1">
              Enjoy all the premium benefits of Platinum membership.
            </p>
          </div>
        )}
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tierOrder.map((tier) => (
            <TierCard 
              key={tier} 
              tier={tier} 
              isCurrentTier={tier === currentTier}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MembershipTierCard;