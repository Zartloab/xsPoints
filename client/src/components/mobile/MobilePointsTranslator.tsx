import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, Award, ChevronRight } from 'lucide-react';
import { LoyaltyProgram } from '@shared/schema';
import { getPointTranslations, PointTranslation, getBestValueRedemptions } from '@/lib/points-translator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MobilePointsTranslatorProps {
  selectedProgram?: LoyaltyProgram;
  pointsBalance?: number;
}

const MobilePointsTranslator: React.FC<MobilePointsTranslatorProps> = ({ 
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
      <Card key={reward.title} className={`mb-3 border ${canAfford ? 'border-green-200' : 'border-gray-200'}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">{reward.icon}</div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-sm">{reward.title}</h3>
                <Badge variant={canAfford ? 'outline' : 'secondary'} className={`ml-1 ${canAfford ? 'bg-green-50 text-green-700 border-green-200' : ''}`}>
                  {reward.points.toLocaleString()}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{reward.description}</p>
              
              {!canAfford && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progress</span>
                    <span>{Math.round((pointsBalance / reward.points) * 100)}%</span>
                  </div>
                  <Progress 
                    value={(pointsBalance / reward.points) * 100} 
                    className="h-2"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Need {(reward.points - pointsBalance).toLocaleString()} more
                  </div>
                </div>
              )}
              
              {canAfford && (
                <div className="flex items-center mt-2 text-green-600 text-xs font-medium">
                  <Award className="h-3 w-3 mr-1" />
                  <span>You can redeem this!</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Points Translator</h2>
        
        <Select value={selectedProgram} onValueChange={handleProgramChange}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Program" />
          </SelectTrigger>
          <SelectContent>
            {programs.map((program) => (
              <SelectItem key={program} value={program}>{program}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="bg-muted/30 p-4 rounded-md">
        <p className="text-sm text-muted-foreground mb-1">Your balance</p>
        <div className="text-2xl font-bold">{pointsBalance.toLocaleString()} points</div>
      </div>
      
      {walletsLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="recommendations">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="all">All Options</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recommendations" className="mt-4">
            {bestValueRedemptions.length > 0 ? (
              <div className="space-y-1">
                {bestValueRedemptions.map(renderRewardCard)}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <PlusCircle className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>Earn more points to unlock redemption options</p>
                <Button className="mt-3" variant="outline">Earn Points</Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="all" className="mt-4">
            <ScrollArea className="whitespace-nowrap pb-2 mb-4">
              <div className="flex gap-2">
                <Button 
                  variant={selectedCategory === null ? "default" : "outline"} 
                  size="sm"
                  onClick={() => handleCategorySelect(null)}
                >
                  All
                </Button>
                
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleCategorySelect(category.id)}
                    className="flex items-center gap-1"
                  >
                    <span>{category.icon}</span>
                    <span>{category.name}</span>
                  </Button>
                ))}
              </div>
            </ScrollArea>
            
            <div className="space-y-1">
              {filteredTranslations.map(renderRewardCard)}
            </div>
          </TabsContent>
        </Tabs>
      )}
      
      <div className="flex justify-center mt-6">
        <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs">
          View detailed redemption guide
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

export default MobilePointsTranslator;