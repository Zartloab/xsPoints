import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Redirect } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LoyaltyProgram } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Banner } from '@/components/ui/banner';
import { Coins, BookOpen, DollarSign, Share2, Gift, Utensils, Plane, MapPin, Ticket } from 'lucide-react';

// Define the types for contextual stories
interface ContextualStory {
  category: string;
  description: string;
  examples: string[];
}

interface StorytellerResponse {
  stories: ContextualStory[];
  dollarValue: string;
}

export default function StorytellerPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State for form inputs
  const [program, setProgram] = useState<LoyaltyProgram>('XPOINTS');
  const [points, setPoints] = useState<string>('1000');
  
  // State for loading and results
  const [isLoading, setIsLoading] = useState(false);
  const [storyResult, setStoryResult] = useState<StorytellerResponse | null>(null);
  
  // State for share dialog
  const [isShareOpen, setIsShareOpen] = useState(false);
  
  // If not logged in, redirect to auth page
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  // Get icon for story category
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'travel':
        return <Plane className="h-5 w-5" />;
      case 'dining':
        return <Utensils className="h-5 w-5" />;
      case 'shopping':
        return <Gift className="h-5 w-5" />;
      case 'experiences':
        return <MapPin className="h-5 w-5" />;
      case 'entertainment':
        return <Ticket className="h-5 w-5" />;
      case 'accommodations':
        return <MapPin className="h-5 w-5" />;
      default:
        return <Gift className="h-5 w-5" />;
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      // Validate input
      const pointsNumber = Number(points);
      if (isNaN(pointsNumber) || pointsNumber <= 0) {
        toast({
          title: "Invalid points",
          description: "Please enter a valid positive number of points",
          variant: "destructive",
        });
        return;
      }
      
      // Call API to get storyteller data
      const response = await apiRequest("POST", "/api/storyteller", {
        points: pointsNumber,
        program
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate stories");
      }
      
      const data = await response.json();
      setStoryResult(data);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate contextual stories",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle share functionality
  const handleShare = () => {
    setIsShareOpen(true);
  };
  
  return (
    <div className="container mx-auto py-6">
      <Banner
        title="Contextual Point Value Storyteller"
        subtitle="Discover what your loyalty points are actually worth in real-world terms"
        backgroundImage="/images/backgrounds/storyteller.png"
        overlayOpacity={0.6}
        pattern="waves"
        height="md"
      >
        <div className="flex flex-wrap gap-3 mt-2">
          <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full flex items-center">
            <Plane className="h-4 w-4 mr-1.5" />
            <span className="text-sm">Travel</span>
          </div>
          <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full flex items-center">
            <Utensils className="h-4 w-4 mr-1.5" />
            <span className="text-sm">Dining</span>
          </div>
          <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full flex items-center">
            <Gift className="h-4 w-4 mr-1.5" />
            <span className="text-sm">Shopping</span>
          </div>
          <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full flex items-center">
            <Ticket className="h-4 w-4 mr-1.5" />
            <span className="text-sm">Experiences</span>
          </div>
        </div>
      </Banner>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Tell me about my points</CardTitle>
            <CardDescription>
              Enter your points amount and select a program to see what they're worth
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="program">Loyalty Program</Label>
                <Select 
                  value={program} 
                  onValueChange={(value) => setProgram(value as LoyaltyProgram)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a loyalty program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="XPOINTS">xPoints</SelectItem>
                    <SelectItem value="QANTAS">Qantas</SelectItem>
                    <SelectItem value="VELOCITY">Velocity</SelectItem>
                    <SelectItem value="GYG">Go Your Go</SelectItem>
                    <SelectItem value="AMEX">American Express</SelectItem>
                    <SelectItem value="FLYBUYS">Flybuys</SelectItem>
                    <SelectItem value="HILTON">Hilton Honors</SelectItem>
                    <SelectItem value="MARRIOTT">Marriott Bonvoy</SelectItem>
                    <SelectItem value="AIRBNB">Airbnb</SelectItem>
                    <SelectItem value="DELTA">Delta SkyMiles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="points">Points Amount</Label>
                <Input
                  id="points"
                  type="number"
                  min="1"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  placeholder="Enter points amount"
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                    Generating...
                  </>
                ) : (
                  <>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Tell The Story
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {/* Result display */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Point Value Stories</CardTitle>
              <CardDescription>
                Contextual examples of what your points are worth in real life
              </CardDescription>
            </div>
            {storyResult && (
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!storyResult && !isLoading && (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <BookOpen className="h-12 w-12 mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No stories yet</h3>
                <p>Enter your points and program to generate contextual stories</p>
              </div>
            )}
            
            {storyResult && (
              <div className="space-y-6">
                <div className="flex items-center justify-center bg-blue-50 dark:bg-blue-950 p-4 rounded-lg mb-4">
                  <DollarSign className="h-6 w-6 text-blue-500 mr-2" />
                  <span className="text-lg">
                    Your <strong>{points} {program}</strong> points are worth approximately <strong className="text-blue-600 dark:text-blue-400">{storyResult.dollarValue}</strong>
                  </span>
                </div>
                
                <Tabs defaultValue={storyResult.stories[0]?.category.toLowerCase()}>
                  <TabsList className="w-full flex overflow-x-auto">
                    {storyResult.stories.map((story) => (
                      <TabsTrigger 
                        key={story.category} 
                        value={story.category.toLowerCase()}
                        className="flex items-center"
                      >
                        {getCategoryIcon(story.category)}
                        <span className="ml-1">{story.category}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {storyResult.stories.map((story) => (
                    <TabsContent key={story.category} value={story.category.toLowerCase()}>
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            {getCategoryIcon(story.category)}
                            <span className="ml-2">{story.category}</span>
                          </CardTitle>
                          <CardDescription>
                            {story.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {story.examples.map((example, index) => (
                              <li key={index} className="flex items-start">
                                <div className="bg-blue-100 dark:bg-blue-900 text-blue-500 rounded-full p-1 mr-2 mt-0.5">
                                  <Coins className="h-4 w-4" />
                                </div>
                                <span>{example}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Share dialog */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Value Stories</DialogTitle>
            <DialogDescription>
              Share the real-world value of your {points} {program} points
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p>Your {points} {program} points are worth approximately {storyResult?.dollarValue}</p>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `I discovered my ${points} ${program} points are worth ${storyResult?.dollarValue}! Check out what I can get with them on xPoints Exchange.`
                  );
                  toast({
                    title: "Copied!",
                    description: "Text copied to clipboard",
                  });
                }}
              >
                Copy Text
              </Button>
              
              <Button className="flex-1">
                <Share2 className="h-4 w-4 mr-1" />
                Share Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}