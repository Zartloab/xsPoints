import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Gamepad2, PiggyBank, ShoppingBag, Gift, Calendar, Medal, Star } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useIsMobile } from '@/hooks/use-mobile';

export default function GamificationPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
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
    { id: 2, name: 'Complete your first conversion', reward: 250, isCompleted: false },
    { id: 3, name: 'Convert 1,000 points', reward: 100, isCompleted: true },
    { id: 4, name: 'Refer a friend', reward: 1000, isCompleted: false },
    { id: 5, name: 'Complete profile', reward: 50, isCompleted: true },
    { id: 6, name: 'Install mobile app', reward: 200, isCompleted: false },
    { id: 7, name: 'Follow on social media', reward: 50, isCompleted: false },
    { id: 8, name: 'Trade with another user', reward: 300, isCompleted: false },
  ];
  
  const boostEvents = [
    { 
      id: 1, 
      name: 'Happy Hour Friday', 
      description: 'Every Friday, 5-7 PM', 
      bonus: '+15%', 
      isActive: false,
      nextDate: 'May 10, 2025'
    },
    { 
      id: 2, 
      name: 'Double Points Weekend', 
      description: 'First weekend of each month', 
      bonus: '+100%', 
      isActive: false,
      nextDate: 'June 7-8, 2025'
    },
    { 
      id: 3, 
      name: 'Loyalty Anniversary Boost', 
      description: 'On your membership anniversary', 
      bonus: '+50%', 
      isActive: false,
      nextDate: 'July 23, 2025'
    },
  ];
  
  const partnerPromotions = [
    { 
      id: 1, 
      name: 'Shop at Starbucks', 
      description: 'Until June 30, 2025', 
      bonus: '3x points', 
      logo: '☕'
    },
    { 
      id: 2, 
      name: 'Book with Airbnb', 
      description: 'For stays before Aug 31, 2025', 
      bonus: '2x points', 
      logo: '🏠'
    },
    { 
      id: 3, 
      name: 'Qantas Flights', 
      description: 'International routes only', 
      bonus: '2.5x points', 
      logo: '✈️'
    },
  ];
  
  if (!user) {
    return (
      <div className="container max-w-5xl mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-center text-center py-12">
          <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sign in to access Earn</h1>
          <p className="text-muted-foreground mb-4">Sign in or create an account to start earning bonus points and rewards</p>
          <Button size="lg" asChild>
            <a href="/auth">Sign In or Register</a>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-5xl mx-auto py-6 px-4">
      <header className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Earn xPoints</h1>
        <p className="text-muted-foreground">Complete activities and challenges to earn bonus xPoints</p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="daily" value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="daily" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Daily Rewards</span>
              </TabsTrigger>
              <TabsTrigger value="challenges" className="flex items-center gap-2">
                <Medal className="h-4 w-4" />
                <span>Challenges</span>
              </TabsTrigger>
              <TabsTrigger value="boosts" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                <span>Boost Events</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="daily">
              <Card className="mb-6">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-green-600" />
                    <span>Daily Check-in Streak</span>
                  </CardTitle>
                  <CardDescription>
                    Log in every day to maintain your streak and earn bonus points
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <div className="text-lg font-semibold">Day {currentStreak} of {maxStreak}</div>
                        <div className="text-sm text-muted-foreground">Keep your streak going for bigger bonuses!</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">50 xPoints</div>
                        <div className="text-sm text-muted-foreground">daily reward</div>
                      </div>
                    </div>
                    
                    <Progress value={streakProgress} className="h-2" />
                    
                    <div className="grid grid-cols-5 gap-2 mt-2">
                      {[1, 2, 3, 4, 5].map((day) => (
                        <div 
                          key={day} 
                          className={`flex flex-col items-center p-3 rounded-lg border ${day <= currentStreak ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}
                        >
                          <div className="font-semibold text-sm">Day {day}</div>
                          <div className={`text-xs ${day <= currentStreak ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {day < currentStreak ? '✓ Claimed' : day === currentStreak ? 'Today' : `+${day * 50} pts`}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4">
                      <Button className="w-full" size="lg">
                        Claim Daily Reward
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="bg-slate-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Weekly Bonus</CardTitle>
                    <CardDescription>Log in 5 days in a row for a special bonus</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="font-bold text-2xl">+100 xPoints</div>
                    <Progress value={40} className="mt-2 h-2" />
                    <p className="text-sm text-muted-foreground mt-2">40% complete - 3 more days to go</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-slate-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Monthly Rewards</CardTitle>
                    <CardDescription>Log in 20 days this month for big rewards</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="font-bold text-2xl">+500 xPoints</div>
                    <Progress value={25} className="mt-2 h-2" />
                    <p className="text-sm text-muted-foreground mt-2">25% complete - 15 more days to go</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="challenges">
              <Card className="mb-6">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Gamepad2 className="h-5 w-5 text-purple-600" />
                    <span>Challenge Missions</span>
                  </CardTitle>
                  <CardDescription>
                    Complete special tasks to earn bonus xPoints
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Your progress</div>
                      <div className="text-lg font-semibold">{challengesCompleted} of {totalChallenges} challenges completed</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Total available</div>
                      <div className="text-lg font-bold">2,450 xPoints</div>
                    </div>
                  </div>
                  
                  <Progress value={challengeProgress} className="h-2 mb-6" />
                  
                  <div className="space-y-4">
                    {challenges.map((challenge) => (
                      <div 
                        key={challenge.id} 
                        className={`p-4 rounded-lg border flex justify-between items-center ${
                          challenge.isCompleted 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            challenge.isCompleted 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {challenge.isCompleted ? <Trophy className="h-4 w-4" /> : <Medal className="h-4 w-4" />}
                          </div>
                          <div>
                            <div className="font-medium">
                              {challenge.name}
                              {challenge.progress && <span className="text-green-600 ml-2 font-medium">({challenge.progress})</span>}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {challenge.isCompleted ? 'Completed' : 'In progress'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{challenge.reward} pts</div>
                          {challenge.isCompleted ? (
                            <div className="text-xs text-green-600">Claimed</div>
                          ) : (
                            <Button variant="outline" size="sm" className="mt-1">Claim</Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="boosts">
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <PiggyBank className="h-5 w-5 text-blue-600" />
                      <span>Exchange Boost Events</span>
                    </CardTitle>
                    <CardDescription>
                      Limited-time bonuses on point conversions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-6">
                    <div className="space-y-4">
                      {boostEvents.map((event) => (
                        <div 
                          key={event.id} 
                          className={`p-4 rounded-lg border flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 ${
                            event.isActive 
                              ? 'bg-blue-50 border-blue-200' 
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              event.isActive 
                                ? 'bg-blue-100 text-blue-600' 
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              <Calendar className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-medium">{event.name}</div>
                              <div className="text-sm text-muted-foreground">{event.description}</div>
                            </div>
                          </div>
                          <div className="sm:text-right flex justify-between sm:block">
                            <div className="font-semibold text-blue-600">{event.bonus}</div>
                            <div className="text-sm text-muted-foreground">{event.isActive ? 'Active now!' : `Next: ${event.nextDate}`}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5 text-amber-600" />
                      <span>Partner Promotions</span>
                    </CardTitle>
                    <CardDescription>
                      Earn bonus points with our partners
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-6">
                    <div className="space-y-4">
                      {partnerPromotions.map((promo) => (
                        <div 
                          key={promo.id} 
                          className="p-4 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 text-xl rounded-full bg-amber-100 flex items-center justify-center h-10 w-10">
                              {promo.logo}
                            </div>
                            <div>
                              <div className="font-medium">{promo.name}</div>
                              <div className="text-sm text-muted-foreground">{promo.description}</div>
                            </div>
                          </div>
                          <div className="sm:text-right flex justify-between sm:block">
                            <div className="font-semibold text-amber-600">{promo.bonus}</div>
                            <Button variant="outline" size="sm">View Details</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Your Rewards</CardTitle>
              <CardDescription>Track your earnings and bonuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">Total earned this month</div>
                  <div className="text-3xl font-bold">1,250 xPoints</div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="text-sm font-medium mb-2">Breakdown</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Daily check-ins</span>
                      <span className="font-medium">350 pts</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Completed challenges</span>
                      <span className="font-medium">250 pts</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Exchange bonuses</span>
                      <span className="font-medium">450 pts</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Partner promotions</span>
                      <span className="font-medium">200 pts</span>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="text-sm font-medium mb-2">Recent Activity</div>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span>Daily check-in</span>
                        <span className="font-medium text-green-600">+50 pts</span>
                      </div>
                      <div className="text-xs text-muted-foreground">Today</div>
                    </div>
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span>Completed profile</span>
                        <span className="font-medium text-green-600">+50 pts</span>
                      </div>
                      <div className="text-xs text-muted-foreground">Yesterday</div>
                    </div>
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span>Convert 1,000 points</span>
                        <span className="font-medium text-green-600">+100 pts</span>
                      </div>
                      <div className="text-xs text-muted-foreground">May 7, 2025</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t flex justify-center">
              <Button variant="outline" className="w-full">View All Activity</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}