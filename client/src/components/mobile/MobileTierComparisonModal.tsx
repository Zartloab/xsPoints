import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogClose 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Award, CheckCircle, X } from 'lucide-react';
import { MembershipTier } from '@shared/schema';

// Tier thresholds
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

// Map tier names to colors
const tierInfo: Record<MembershipTier, { color: string, bgColor: string }> = {
  STANDARD: { color: 'text-gray-700', bgColor: 'bg-gray-100' },
  SILVER: { color: 'text-gray-600', bgColor: 'bg-gray-200' },
  GOLD: { color: 'text-amber-600', bgColor: 'bg-amber-100' },
  PLATINUM: { color: 'text-blue-700', bgColor: 'bg-blue-100' }
};

const tierNames: Record<MembershipTier, string> = {
  STANDARD: 'Standard',
  SILVER: 'Silver',
  GOLD: 'Gold',
  PLATINUM: 'Platinum'
};

interface MobileTierComparisonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTier: MembershipTier;
}

const MobileTierComparisonModal: React.FC<MobileTierComparisonModalProps> = ({
  open,
  onOpenChange,
  currentTier
}) => {
  const tierOrder: MembershipTier[] = ['STANDARD', 'SILVER', 'GOLD', 'PLATINUM'];
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex justify-between items-center">
            <DialogTitle>Membership Tiers</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        
        <Tabs defaultValue={currentTier} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="flex w-full justify-between">
            {tierOrder.map(tier => (
              <TabsTrigger 
                key={tier} 
                value={tier}
                className={`flex-1 ${tier === currentTier ? 'font-medium' : ''}`}
              >
                {tierNames[tier]}
                {tier === currentTier && (
                  <Badge variant="outline" className="ml-1.5 bg-primary/10 text-primary text-[10px] px-1.5">
                    Current
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <div className="overflow-y-auto flex-1 py-4">
            {tierOrder.map(tier => (
              <TabsContent key={tier} value={tier} className="mt-0 h-full">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${tierInfo[tier].bgColor}`}>
                      <Award className={`h-6 w-6 ${tierInfo[tier].color}`} />
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold ${tierInfo[tier].color}`}>
                        {tierNames[tier]} Tier
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {tier === 'STANDARD' 
                          ? 'Base membership' 
                          : `${tierThresholds[tier].toLocaleString()}+ points monthly`}
                      </p>
                    </div>
                  </div>
                  
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3">Benefits</h4>
                      <div className="space-y-3">
                        {tierBenefits[tier].map((benefit, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2 text-sm">How to reach this tier</h4>
                    <p className="text-sm text-muted-foreground">
                      {tier === 'STANDARD' 
                        ? 'All users start at Standard tier.'
                        : `Convert at least ${tierThresholds[tier].toLocaleString()} loyalty points in a month to reach ${tierNames[tier]} tier.`}
                    </p>
                    
                    {tier !== 'STANDARD' && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Tier upgrades are calculated at the end of each month based on your total converted points.
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default MobileTierComparisonModal;