import { useState, useMemo } from 'react';
import { LoyaltyProgram } from '@shared/schema';
import { translatePoints, type PointTranslation } from '@/lib/points-translator';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Plane, Utensils, Hotel, ShoppingBag, Ticket, PiggyBank, ChevronRight, Trophy, Gamepad2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// Map reward types to icons
const rewardIcons = {
  'flight': <Plane className="h-4 w-4" />,
  'dining': <Utensils className="h-4 w-4" />,
  'hotel': <Hotel className="h-4 w-4" />,
  'shopping': <ShoppingBag className="h-4 w-4" />,
  'experience': <Ticket className="h-4 w-4" />,
};

interface MobilePointsTranslatorProps {
  className?: string;
  selectedProgram?: LoyaltyProgram;
  pointsBalance?: number;
}

export default function MobilePointsTranslator({ 
  className = '', 
  selectedProgram = 'XPOINTS',
  pointsBalance = 10000 
}: MobilePointsTranslatorProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | 'flight' | 'hotel' | 'dining' | 'shopping' | 'experience' | 'gamification'>('all');
  
  // Convert the points to reward options
  const translations = useMemo(() => {
    return translatePoints(pointsBalance, selectedProgram);
  }, [pointsBalance, selectedProgram]);
  
  // Get translations filtered by the selected category
  const filteredTranslations = useMemo(() => {
    if (activeCategory === 'all') return translations;
    return translations.filter(reward => reward.type === activeCategory);
  }, [translations, activeCategory]);
  
  // Get the estimated cash value of the points
  const estimatedCashValue = useMemo(() => {
    if (translations.length === 0) return 0;
    
    // We can estimate this based on the highest value reward's cash value ratio
    const bestValuedReward = translations[0]; // Already sorted by highest value
    return bestValuedReward ? Math.round(pointsBalance * (bestValuedReward.cashValue / bestValuedReward.pointsRequired)) : 0;
  }, [translations, pointsBalance]);
  
  // Get rewards that require more points than the current balance
  const upcomingRewards = useMemo(() => {
    const highestPointsInBalance = translations.length > 0 ? translations[0].pointsRequired : 0;
    const targetPoints = highestPointsInBalance * 2;
    
    const upcomingByType: Record<string, PointTranslation> = {};
    const allRewards = translatePoints(targetPoints, selectedProgram);
    
    allRewards.forEach(reward => {
      if (reward.pointsRequired <= pointsBalance) return;
      
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
    return Math.min(percentage, 100);
  };

  const renderRewardCard = (reward: PointTranslation) => {
    const icon = rewardIcons[reward.type] || <PiggyBank className="h-4 w-4" />;
    
    return (
      <Card key={`${reward.type}-${reward.description}`} className="mb-3">
        <CardHeader className="pb-2 px-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
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
        <CardContent className="pb-2 px-3 pt-0">
          <div className="text-xs text-muted-foreground">
            ${(reward.cashValue / reward.pointsRequired).toFixed(3)} per point
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
        <CardHeader className="pb-1 px-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              {icon}
              <span>{reward.description}</span>
            </CardTitle>
            <div className="text-xs font-medium">
              ${reward.cashValue.toLocaleString()}
            </div>
          </div>
          <CardDescription className="text-xs">
            {reward.pointsRequired.toLocaleString()} points required
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-3 px-3 pt-0">
          <div className="text-xs text-muted-foreground mb-1">
            Need {pointsNeeded.toLocaleString()} more points
          </div>
          <Progress value={progress} className="h-1.5" />
          <div className="text-xs text-muted-foreground mt-1">
            {progress.toFixed(0)}% there
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`bg-white rounded-lg ${className}`}>
      <div className="p-3 border-b">
        <h3 className="text-base font-medium">Points Translator</h3>
        <p className="text-xs text-muted-foreground">
          See what your {pointsBalance.toLocaleString()} {selectedProgram} points are worth
        </p>
      </div>
      
      <div className="p-3">
        <div className="mb-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Estimated value</span>
            <span className="text-xl font-bold">${estimatedCashValue.toLocaleString()}</span>
          </div>
        </div>
        
        <Tabs defaultValue="all" value={activeCategory} onValueChange={(value) => setActiveCategory(value as any)}>
          <TabsList className="grid grid-cols-4 mb-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="flight">Travel</TabsTrigger>
            <TabsTrigger value="dining">Lifestyle</TabsTrigger>
            <TabsTrigger value="gamification">
              <Trophy className="h-3 w-3" />
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            {filteredTranslations.length > 0 ? (
              <>
                <h4 className="text-xs font-medium mb-2">What you can get with your points:</h4>
                <div className="max-h-[320px] overflow-y-auto pr-1 -mr-1">
                  {filteredTranslations.map(renderRewardCard)}
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-muted-foreground">
                  You need more points to access rewards. Keep earning!
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="flight">
            <Accordion type="single" collapsible className="mb-2">
              <AccordionItem value="flights">
                <AccordionTrigger className="py-2 text-xs">Flights</AccordionTrigger>
                <AccordionContent>
                  {translations.filter(r => r.type === 'flight').length > 0 ? (
                    translations.filter(r => r.type === 'flight').map(renderRewardCard)
                  ) : (
                    <p className="text-xs text-muted-foreground py-2">
                      Need more points for flight rewards
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="hotels">
                <AccordionTrigger className="py-2 text-xs">Hotels</AccordionTrigger>
                <AccordionContent>
                  {translations.filter(r => r.type === 'hotel').length > 0 ? (
                    translations.filter(r => r.type === 'hotel').map(renderRewardCard)
                  ) : (
                    <p className="text-xs text-muted-foreground py-2">
                      Need more points for hotel rewards
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
          
          <TabsContent value="dining">
            <Accordion type="single" collapsible className="mb-2">
              <AccordionItem value="dining">
                <AccordionTrigger className="py-2 text-xs">Dining</AccordionTrigger>
                <AccordionContent>
                  {translations.filter(r => r.type === 'dining').length > 0 ? (
                    translations.filter(r => r.type === 'dining').map(renderRewardCard)
                  ) : (
                    <p className="text-xs text-muted-foreground py-2">
                      Need more points for dining rewards
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="shopping">
                <AccordionTrigger className="py-2 text-xs">Shopping</AccordionTrigger>
                <AccordionContent>
                  {translations.filter(r => r.type === 'shopping').length > 0 ? (
                    translations.filter(r => r.type === 'shopping').map(renderRewardCard)
                  ) : (
                    <p className="text-xs text-muted-foreground py-2">
                      Need more points for shopping rewards
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="experiences">
                <AccordionTrigger className="py-2 text-xs">Experiences</AccordionTrigger>
                <AccordionContent>
                  {translations.filter(r => r.type === 'experience').length > 0 ? (
                    translations.filter(r => r.type === 'experience').map(renderRewardCard)
                  ) : (
                    <p className="text-xs text-muted-foreground py-2">
                      Need more points for experience rewards
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
          
          <TabsContent value="gamification">
            <h4 className="text-xs font-medium mb-2">Fun ways to earn more xPoints:</h4>
            <div className="space-y-3">
              {/* Daily Check-in Card */}
              <Card className="overflow-hidden border-green-100 bg-green-50">
                <CardHeader className="pb-1 px-3 flex flex-row items-center gap-2">
                  <div className="p-1.5 rounded-full bg-green-100 text-green-600">
                    <Trophy className="h-3 w-3" />
                  </div>
                  <div>
                    <CardTitle className="text-xs">Daily Check-in Streak</CardTitle>
                    <CardDescription className="text-xs">Log in every day</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pb-3 px-3 pt-1">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs">
                      <span>Daily: <span className="font-semibold">50 pts</span></span>
                      <span>5-day streak: <span className="font-semibold">+100</span></span>
                    </div>
                    <Progress value={40} className="h-1.5" />
                    <div className="text-xs text-muted-foreground">Current streak: 2 days</div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Challenge Missions Card */}
              <Card className="overflow-hidden border-purple-100 bg-purple-50">
                <CardHeader className="pb-1 px-3 flex flex-row items-center gap-2">
                  <div className="p-1.5 rounded-full bg-purple-100 text-purple-600">
                    <Gamepad2 className="h-3 w-3" />
                  </div>
                  <div>
                    <CardTitle className="text-xs">Challenge Missions</CardTitle>
                    <CardDescription className="text-xs">Complete tasks for bonuses</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pb-3 px-3 pt-1">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="text-xs">Link 3 accounts <span className="text-green-600 font-medium">(2/3)</span></div>
                      <div className="font-semibold text-xs">500 pts</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs">First conversion</div>
                      <div className="font-semibold text-xs">250 pts</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs">Refer a friend</div>
                      <div className="font-semibold text-xs">1,000 pts</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Exchange Boost Events Card */}
              <Card className="overflow-hidden border-blue-100 bg-blue-50">
                <CardHeader className="pb-1 px-3 flex flex-row items-center gap-2">
                  <div className="p-1.5 rounded-full bg-blue-100 text-blue-600">
                    <PiggyBank className="h-3 w-3" />
                  </div>
                  <div>
                    <CardTitle className="text-xs">Boost Events</CardTitle>
                    <CardDescription className="text-xs">Limited-time bonuses</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pb-3 px-3 pt-1">
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-medium">Happy Hour Friday</div>
                        <div className="text-xs text-muted-foreground">Every Friday, 5-7 PM</div>
                      </div>
                      <div className="text-xs font-semibold">+15%</div>
                    </div>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-medium">Double Points Weekend</div>
                        <div className="text-xs text-muted-foreground">First weekend/month</div>
                      </div>
                      <div className="text-xs font-semibold">+100%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        
        {upcomingRewards.length > 0 && (
          <div className="mt-3">
            <h4 className="text-xs font-medium mb-2">Almost there! Keep earning for:</h4>
            {upcomingRewards.slice(0, 2).map(renderUpcomingRewardCard)}
          </div>
        )}
      </div>
      
      <CardFooter className="bg-slate-50 p-3 flex justify-between border-t">
        <Button variant="ghost" size="sm" className="text-xs px-2 py-1 h-auto">
          How it works
        </Button>
        <Button variant="outline" size="sm" className="text-xs flex items-center gap-1 px-2 py-1 h-auto">
          <span>All rewards</span>
          <ChevronRight className="h-3 w-3" />
        </Button>
      </CardFooter>
    </div>
  );
}