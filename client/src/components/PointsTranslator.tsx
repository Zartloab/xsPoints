import { useState, useMemo } from 'react';
import { LoyaltyProgram } from '@shared/schema';
import { translatePoints, type PointTranslation } from '@/lib/points-translator';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Plane, Utensils, Hotel, ShoppingBag, Ticket, PiggyBank, Trophy, Gamepad2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Map reward types to icons
const rewardIcons = {
  'flight': <Plane className="h-4 w-4" />,
  'dining': <Utensils className="h-4 w-4" />,
  'hotel': <Hotel className="h-4 w-4" />,
  'shopping': <ShoppingBag className="h-4 w-4" />,
  'experience': <Ticket className="h-4 w-4" />,
};

interface PointsTranslatorProps {
  className?: string;
  selectedProgram?: LoyaltyProgram;
  pointsBalance?: number;
}

export default function PointsTranslator({ 
  className = '', 
  selectedProgram = 'XPOINTS',
  pointsBalance = 10000 
}: PointsTranslatorProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'flight' | 'hotel' | 'dining' | 'shopping' | 'experience'>('all');
  
  // Convert the points to reward options
  const translations = useMemo(() => {
    return translatePoints(pointsBalance, selectedProgram);
  }, [pointsBalance, selectedProgram]);
  
  // Get translations filtered by the selected category
  const filteredTranslations = useMemo(() => {
    if (activeTab === 'all') return translations;
    return translations.filter(reward => reward.type === activeTab);
  }, [translations, activeTab]);
  
  // Get the estimated cash value of the points
  const estimatedCashValue = useMemo(() => {
    if (translations.length === 0) return 0;
    
    // We can estimate this based on the highest value reward's cash value ratio
    // or use the first standardized reward which is closest to the points balance
    const bestValuedReward = translations[0]; // Already sorted by highest value
    return bestValuedReward ? Math.round(pointsBalance * (bestValuedReward.cashValue / bestValuedReward.pointsRequired)) : 0;
  }, [translations, pointsBalance]);
  
  // Get rewards that require more points than the current balance
  const upcomingRewards = useMemo(() => {
    // We'll use the highest point reward from each category that's just out of reach
    const highestPointsInBalance = translations.length > 0 ? translations[0].pointsRequired : 0;
    
    // Find rewards that need up to 2x current balance
    const targetPoints = highestPointsInBalance * 2;
    
    // Map of reward types to the highest value reward of that type within range
    const upcomingByType: Record<string, PointTranslation> = {};
    
    const allRewards = translatePoints(targetPoints, selectedProgram);
    
    // Find the first reward of each type that's not affordable yet
    allRewards.forEach(reward => {
      // Skip rewards we can already afford
      if (reward.pointsRequired <= pointsBalance) return;
      
      // Keep only the first (highest value) upcoming reward per type
      if (!upcomingByType[reward.type]) {
        upcomingByType[reward.type] = reward;
      }
    });
    
    return Object.values(upcomingByType).sort((a, b) => a.pointsRequired - b.pointsRequired);
  }, [pointsBalance, selectedProgram, translations]);
  
  // Calculate percentage progress towards rewards
  const getProgressPercentage = (requiredPoints: number) => {
    if (requiredPoints <= 0) return 0;
    const percentage = (pointsBalance / requiredPoints) * 100;
    return Math.min(percentage, 100); // Cap at 100%
  };

  const renderRewardCard = (reward: PointTranslation) => {
    const icon = rewardIcons[reward.type] || <PiggyBank className="h-4 w-4" />;
    
    return (
      <Card key={`${reward.type}-${reward.description}`} className="mb-3">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              {icon}
              <span>{reward.description}</span>
            </CardTitle>
            <div className="text-sm font-medium">
              ${reward.cashValue.toLocaleString()}
            </div>
          </div>
          <CardDescription className="text-xs">
            {reward.pointsRequired.toLocaleString()} points
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="text-sm text-muted-foreground">
            {(reward.cashValue / reward.pointsRequired).toFixed(3)} per point
          </div>
        </CardContent>
      </Card>
    );
  };
  
  const renderUpcomingRewardCard = (reward: PointTranslation) => {
    const icon = rewardIcons[reward.type] || <PiggyBank className="h-4 w-4" />;
    const pointsNeeded = reward.pointsRequired - pointsBalance;
    const progress = getProgressPercentage(reward.pointsRequired);
    
    return (
      <Card key={`upcoming-${reward.type}-${reward.description}`} className="mb-3">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              {icon}
              <span>{reward.description}</span>
            </CardTitle>
            <div className="text-sm font-medium">
              ${reward.cashValue.toLocaleString()}
            </div>
          </div>
          <CardDescription className="text-xs">
            {reward.pointsRequired.toLocaleString()} points required
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="text-sm text-muted-foreground mb-1">
            You need {pointsNeeded.toLocaleString()} more points
          </div>
          <Progress value={progress} className="h-2" />
          <div className="text-xs text-muted-foreground mt-1">
            {progress.toFixed(0)}% of the way there
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-4 border-b">
        <h3 className="text-lg font-medium">Points Translator</h3>
        <p className="text-sm text-muted-foreground">
          See what your {pointsBalance.toLocaleString()} {selectedProgram} points are worth
        </p>
      </div>
      
      <div className="p-4">
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Estimated value</span>
            <span className="text-2xl font-bold">${estimatedCashValue.toLocaleString()}</span>
          </div>
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid grid-cols-6 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="flight" className="flex items-center gap-1">
              <Plane className="h-3 w-3" />
              <span className="hidden sm:inline">Flights</span>
            </TabsTrigger>
            <TabsTrigger value="hotel" className="flex items-center gap-1">
              <Hotel className="h-3 w-3" />
              <span className="hidden sm:inline">Hotels</span>
            </TabsTrigger>
            <TabsTrigger value="dining" className="flex items-center gap-1">
              <Utensils className="h-3 w-3" />
              <span className="hidden sm:inline">Dining</span>
            </TabsTrigger>
            <TabsTrigger value="shopping" className="flex items-center gap-1">
              <ShoppingBag className="h-3 w-3" />
              <span className="hidden sm:inline">Shopping</span>
            </TabsTrigger>
            <TabsTrigger value="experience" className="flex items-center gap-1">
              <Ticket className="h-3 w-3" />
              <span className="hidden sm:inline">Experiences</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            {filteredTranslations.length > 0 ? (
              <>
                <h4 className="text-sm font-medium mb-2">What you can get with your points:</h4>
                {filteredTranslations.map(renderRewardCard)}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  You need more points to access rewards. Keep earning!
                </p>
              </div>
            )}
          </TabsContent>
          
          {['flight', 'hotel', 'dining', 'shopping', 'experience'].map(tab => (
            <TabsContent key={tab} value={tab}>
              {filteredTranslations.length > 0 ? (
                <>
                  <h4 className="text-sm font-medium mb-2">Available {tab} rewards:</h4>
                  {filteredTranslations.map(renderRewardCard)}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    You don't have enough points for {tab} rewards yet.
                  </p>
                </div>
              )}
            </TabsContent>
          ))}
          

        </Tabs>
        
        {upcomingRewards.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-2">Almost there! Keep earning points for:</h4>
            {upcomingRewards.slice(0, 3).map(renderUpcomingRewardCard)}
          </div>
        )}
      </div>
      
      <CardFooter className="bg-slate-50 p-4 flex justify-between">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm">
                How it works
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Point values are estimated based on typical redemption rates and can vary based on travel seasons, availability, and promotions.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <Button variant="outline" size="sm">View all rewards</Button>
      </CardFooter>
    </div>
  );
}