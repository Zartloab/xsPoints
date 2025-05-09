import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Gamepad2, PiggyBank, ShoppingBag, Gift, Calendar, Medal, Star, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function MobileGamificationPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'daily' | 'challenges' | 'boosts'>('daily');
  
  // Simulated data for demonstration purposes
  const currentStreak = 2;
  const maxStreak = 5;
  const streakProgress = (currentStreak / maxStreak) * 100;
  
  // These will eventually come from the backend
  const challengesCompleted = 2;
  const totalChallenges = 8;
  const challengeProgress = (challengesCompleted / totalChallenges) * 100;
  
  const challenges = [
    { id: 1, name: 'Link 3 accounts', progress: '2/3', reward: 500, isCompleted: false },
    { id: 2, name: 'Complete conversion', reward: 250, isCompleted: false },
    { id: 3, name: 'Convert 1,000 points', reward: 100, isCompleted: true },
    { id: 4, name: 'Refer a friend', reward: 1000, isCompleted: false },
    { id: 5, name: 'Complete profile', reward: 50, isCompleted: true },
  ];
  
  const boostEvents = [
    { 
      id: 1, 
      name: 'Happy Hour Friday', 
      description: 'Every Friday, 5-7 PM', 
      bonus: '+15%', 
      isActive: false,
      nextDate: 'May 10'
    },
    { 
      id: 2, 
      name: 'Double Points Weekend', 
      description: 'First weekend/month', 
      bonus: '+100%', 
      isActive: false,
      nextDate: 'June 7-8'
    },
    { 
      id: 3, 
      name: 'Anniversary Boost', 
      description: 'On your anniversary', 
      bonus: '+50%', 
      isActive: false,
      nextDate: 'July 23'
    },
  ];
  
  const partnerPromotions = [
    { 
      id: 1, 
      name: 'Shop at Starbucks', 
      description: 'Until June 30', 
      bonus: '3x points', 
      logo: '☕'
    },
    { 
      id: 2, 
      name: 'Book with Airbnb', 
      description: 'Stays before Aug 31', 
      bonus: '2x points', 
      logo: '🏠'
    },
  ];
  
  if (!user) {
    return (
      <div className="p-4 flex flex-col items-center justify-center text-center py-8">
        <Trophy className="h-10 w-10 text-muted-foreground mb-3" />
        <h1 className="text-xl font-bold mb-2">Sign in to access Earn</h1>
        <p className="text-muted-foreground mb-4 text-sm">Sign in to start earning bonus points</p>
        <Button asChild>
          <a href="/auth">Sign In or Register</a>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <header className="mb-4">
        <h1 className="text-2xl font-bold mb-1">Earn xPoints</h1>
        <p className="text-sm text-muted-foreground">Complete activities to earn bonus points</p>
      </header>
      
      <Card className="mb-4">
        <CardHeader className="pb-2 px-4">
          <CardTitle className="text-base">Your Rewards</CardTitle>
        </CardHeader>
        <CardContent className="pb-4 px-4">
          <div className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground">This month</div>
              <div className="text-2xl font-bold">1,250 xPoints</div>
            </div>
            
            <div className="flex justify-between text-xs py-2 border-t">
              <span>Daily check-ins</span>
              <span className="font-medium">350 pts</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Challenges</span>
              <span className="font-medium">250 pts</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Exchange bonuses</span>
              <span className="font-medium">450 pts</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Partner promotions</span>
              <span className="font-medium">200 pts</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="daily" value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="daily" className="text-xs">
            Daily
          </TabsTrigger>
          <TabsTrigger value="challenges" className="text-xs">
            Challenges
          </TabsTrigger>
          <TabsTrigger value="boosts" className="text-xs">
            Boosts
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="daily">
          <Card className="mb-4">
            <CardHeader className="pb-2 px-4 flex flex-row items-center gap-2">
              <div className="p-1.5 rounded-full bg-green-100 text-green-600">
                <Trophy className="h-3 w-3" />
              </div>
              <div>
                <CardTitle className="text-sm">Daily Check-in Streak</CardTitle>
                <CardDescription className="text-xs">Log in every day</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pb-4 px-4">
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-sm font-medium">Day {currentStreak} of {maxStreak}</div>
                    <div className="text-xs text-muted-foreground">Keep your streak going!</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">50 xPoints</div>
                    <div className="text-xs text-muted-foreground">daily</div>
                  </div>
                </div>
                
                <Progress value={streakProgress} className="h-1.5" />
                
                <div className="grid grid-cols-5 gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((day) => (
                    <div 
                      key={day} 
                      className={`flex flex-col items-center p-1 rounded-lg border text-center ${day <= currentStreak ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}
                    >
                      <div className="font-medium text-xs">Day {day}</div>
                      <div className={`text-[10px] ${day <= currentStreak ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {day < currentStreak ? '✓' : day === currentStreak ? 'Today' : `+${day * 50}`}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-2">
                  <Button className="w-full" size="sm">
                    Claim Daily Reward
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-slate-50">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-xs">Weekly Bonus</CardTitle>
              </CardHeader>
              <CardContent className="py-1 px-3">
                <div className="font-bold text-sm">+100 xPoints</div>
                <Progress value={40} className="mt-1 mb-1 h-1" />
                <p className="text-[10px] text-muted-foreground">3 more days to go</p>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-50">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-xs">Monthly Rewards</CardTitle>
              </CardHeader>
              <CardContent className="py-1 px-3">
                <div className="font-bold text-sm">+500 xPoints</div>
                <Progress value={25} className="mt-1 mb-1 h-1" />
                <p className="text-[10px] text-muted-foreground">15 more days to go</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="challenges">
          <div className="mb-3">
            <div className="flex justify-between items-end mb-1">
              <div className="text-xs text-muted-foreground">Your progress</div>
              <div className="text-xs text-muted-foreground">Total: <span className="font-medium">2,450 pts</span></div>
            </div>
            <div className="text-sm font-medium mb-1">{challengesCompleted} of {totalChallenges} completed</div>
            <Progress value={challengeProgress} className="h-1.5" />
          </div>
          
          <div className="space-y-3">
            {challenges.map((challenge) => (
              <Card 
                key={challenge.id} 
                className={challenge.isCompleted ? 'border-green-200' : 'border-slate-200'}
              >
                <CardContent className="p-3 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded-full ${
                      challenge.isCompleted 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {challenge.isCompleted ? <Trophy className="h-3 w-3" /> : <Medal className="h-3 w-3" />}
                    </div>
                    <div>
                      <div className="text-xs font-medium">
                        {challenge.name}
                        {challenge.progress && <span className="text-green-600 ml-1 text-xs">({challenge.progress})</span>}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {challenge.isCompleted ? 'Completed' : 'In progress'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium">{challenge.reward} pts</div>
                    {challenge.isCompleted ? (
                      <div className="text-[10px] text-green-600">Claimed</div>
                    ) : (
                      <Button variant="outline" size="sm" className="h-6 text-xs px-2 py-0 mt-1">Claim</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-1 mt-2">
              <span>View All Challenges</span>
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="boosts">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                <PiggyBank className="h-3 w-3 text-blue-600" />
                <span>Boost Events</span>
              </h3>
              <div className="space-y-3">
                {boostEvents.map((event) => (
                  <Card 
                    key={event.id} 
                    className={event.isActive ? 'border-blue-200' : 'border-slate-200'}
                  >
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xs font-medium">{event.name}</div>
                          <div className="text-[10px] text-muted-foreground">{event.description}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-medium text-blue-600">{event.bonus}</div>
                          <div className="text-[10px] text-muted-foreground">{event.isActive ? 'Active now!' : `Next: ${event.nextDate}`}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                <ShoppingBag className="h-3 w-3 text-amber-600" />
                <span>Partner Promotions</span>
              </h3>
              <div className="space-y-3">
                {partnerPromotions.map((promo) => (
                  <Card key={promo.id} className="border-slate-200">
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className="text-lg">{promo.logo}</div>
                          <div>
                            <div className="text-xs font-medium">{promo.name}</div>
                            <div className="text-[10px] text-muted-foreground">{promo.description}</div>
                          </div>
                        </div>
                        <div className="text-xs font-medium text-amber-600">{promo.bonus}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-1">
                  <span>View All Promotions</span>
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}