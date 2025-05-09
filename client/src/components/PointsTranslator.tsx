import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, Award } from 'lucide-react';
import { LoyaltyProgram } from '@shared/schema';
import { getPointTranslations, PointTranslation, getBestValueRedemptions } from '@/lib/points-translator';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useAuth } from '@/hooks/use-auth';

interface PointsTranslatorProps {
  className?: string;
  selectedProgram?: LoyaltyProgram;
  pointsBalance?: number;
}

const PointsTranslator: React.FC<PointsTranslatorProps> = ({ 
  className,
  selectedProgram: propSelectedProgram,
  pointsBalance: propPointsBalance
}) => {
  // State for selected loyalty program and category
  const [selectedProgram, setSelectedProgram] = useState<LoyaltyProgram>(propSelectedProgram || 'XPOINTS');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Update selectedProgram if prop changes
  useEffect(() => {
    if (propSelectedProgram) {
      setSelectedProgram(propSelectedProgram);
    }
  }, [propSelectedProgram]);
  
  // Get user wallets to show available points
  const { user } = useAuth();
  const { data: wallets, isLoading: walletsLoading } = useQuery({
    queryKey: ['/api/wallets'],
    enabled: !!user,
  });
  
  // Get the current balance for the selected program
  const userWallet = wallets?.find(wallet => wallet.program === selectedProgram);
  const pointsBalance = propPointsBalance !== undefined ? propPointsBalance : userWallet?.balance || 0;
  
  // Get all translations for the selected program
  const translations = getPointTranslations(selectedProgram);
  
  // Get the best value redemptions
  const bestValueRedemptions = getBestValueRedemptions(selectedProgram, pointsBalance);
  
  // Filter translations by selected category
  const filteredTranslations = selectedCategory 
    ? translations.filter(item => item.category === selectedCategory) 
    : translations;
  
  // List of available categories
  const categories = [
    { id: 'travel', name: 'Travel', icon: '✈️' },
    { id: 'dining', name: 'Dining', icon: '🍽️' },
    { id: 'shopping', name: 'Shopping', icon: '🛍️' },
    { id: 'entertainment', name: 'Entertainment', icon: '🎬' },
    { id: 'services', name: 'Services', icon: '🔧' },
  ];
  
  // Programs for the dropdown
  const programs: LoyaltyProgram[] = [
    'QANTAS', 'GYG', 'XPOINTS', 'VELOCITY', 'AMEX', 
    'FLYBUYS', 'HILTON', 'MARRIOTT', 'AIRBNB', 'DELTA'
  ];
  
  const handleProgramChange = (value: string) => {
    setSelectedProgram(value as LoyaltyProgram);
  };
  
  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
  };
  
  // Render a single reward card
  const renderRewardCard = (reward: PointTranslation) => {
    const canAfford = pointsBalance >= reward.points;
    
    return (
      <Card key={reward.title} className={`border ${canAfford ? 'border-green-200' : 'border-gray-200'}`}>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <div className="text-2xl">{reward.icon}</div>
              <div>
                <h3 className="font-semibold">{reward.title}</h3>
                <p className="text-xs text-muted-foreground">{reward.description}</p>
              </div>
            </div>
            <Badge variant={canAfford ? 'outline' : 'secondary'} className={canAfford ? 'bg-green-50 text-green-700 border-green-200' : ''}>
              {reward.points.toLocaleString()} points
            </Badge>
          </div>
          
          {!canAfford && (
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span>Your balance</span>
                <span>{pointsBalance.toLocaleString()} / {reward.points.toLocaleString()}</span>
              </div>
              <Progress 
                value={(pointsBalance / reward.points) * 100} 
                className="h-2"
              />
              <div className="text-xs text-muted-foreground mt-1">
                Need {(reward.points - pointsBalance).toLocaleString()} more points
              </div>
            </div>
          )}
          
          {canAfford && (
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center text-green-600 text-xs font-medium">
                <Award className="h-3 w-3 mr-1" />
                <span>You can redeem this!</span>
              </div>
              <Button size="sm" variant="outline" className="h-7 text-xs">
                See details
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Points Translator</CardTitle>
            <CardDescription>See what your points are worth in real-world value</CardDescription>
          </div>
          
          <div className="min-w-[180px]">
            <Select value={selectedProgram} onValueChange={handleProgramChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select program" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((program) => (
                  <SelectItem key={program} value={program}>{program}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {walletsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="recommendations">
            <TabsList className="mb-4">
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              <TabsTrigger value="all">All Redemption Options</TabsTrigger>
            </TabsList>
            
            <TabsContent value="recommendations" className="mt-0">
              <div className="mb-4 bg-muted/30 p-4 rounded-md">
                <h3 className="font-medium mb-2">Your {selectedProgram} Balance</h3>
                <div className="text-2xl font-bold mb-1">{pointsBalance.toLocaleString()} points</div>
                <p className="text-sm text-muted-foreground">
                  Here are the best value redemption options for your points
                </p>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {bestValueRedemptions.map(renderRewardCard)}
                
                {bestValueRedemptions.length === 0 && (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    <PlusCircle className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>Earn more points to unlock redemption options</p>
                    <Button className="mt-3" variant="outline">Earn Points</Button>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="all" className="mt-0">
              <div className="mb-4">
                <div className="flex gap-2 mb-3 overflow-x-auto pb-1 -mx-1 px-1">
                  <Button 
                    variant={selectedCategory === null ? "default" : "outline"} 
                    size="sm"
                    onClick={() => handleCategorySelect(null)}
                  >
                    All Categories
                  </Button>
                  
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleCategorySelect(category.id)}
                      className="flex items-center space-x-1 whitespace-nowrap"
                    >
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                    </Button>
                  ))}
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredTranslations.map(renderRewardCard)}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default PointsTranslator;