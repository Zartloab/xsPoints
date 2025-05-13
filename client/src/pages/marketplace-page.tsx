import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  ShoppingBag, 
  Tag, 
  Plane, 
  Hotel, 
  Coffee, 
  ShoppingCart, 
  Gift, 
  TicketCheck, 
  Star, 
  Clock, 
  ChevronRight 
} from 'lucide-react';

// Types for marketplace
interface Partner {
  id: number;
  name: string;
  logo: string;
  category: string;
  featured: boolean;
  description: string;
}

interface Reward {
  id: number;
  partnerId: number;
  title: string;
  description: string;
  pointsCost: number;
  dollarValue: number;
  category: string;
  image: string;
  exclusive: boolean;
  featured: boolean;
  expiresAt?: string;
  limitedQuantity?: boolean;
}

// Mock data for marketplace items
const PARTNERS: Partner[] = [
  {
    id: 1,
    name: "JetBlue Airways",
    logo: "https://placehold.co/100x100/2563eb/FFFFFF.png?text=JB",
    category: "travel",
    featured: true,
    description: "Redeem your xPoints for flights, upgrades, and travel perks."
  },
  {
    id: 2,
    name: "LuxuryStay Hotels",
    logo: "https://placehold.co/100x100/6366f1/FFFFFF.png?text=LS",
    category: "hotels",
    featured: true,
    description: "Premium hotel stays and room upgrades available with xPoints."
  },
  {
    id: 3,
    name: "Daily Grind Coffee",
    logo: "https://placehold.co/100x100/8b5cf6/FFFFFF.png?text=DG",
    category: "dining",
    featured: false,
    description: "Coffee, pastries and more at your favorite local spots."
  },
  {
    id: 4,
    name: "Fashion Forward",
    logo: "https://placehold.co/100x100/ec4899/FFFFFF.png?text=FF",
    category: "retail",
    featured: true,
    description: "The latest fashion trends available with your xPoints."
  },
  {
    id: 5,
    name: "Tech Universe",
    logo: "https://placehold.co/100x100/f97316/FFFFFF.png?text=TU",
    category: "retail",
    featured: false,
    description: "Latest gadgets and tech accessories."
  },
  {
    id: 6,
    name: "Ticket Master",
    logo: "https://placehold.co/100x100/f59e0b/FFFFFF.png?text=TM",
    category: "entertainment",
    featured: false,
    description: "Concerts, movies and event tickets for xPoints."
  }
];

const REWARDS: Reward[] = [
  {
    id: 1,
    partnerId: 1,
    title: "Domestic Flight Voucher",
    description: "Redeem for any economy domestic flight. No blackout dates.",
    pointsCost: 25000,
    dollarValue: 350,
    category: "travel",
    image: "https://placehold.co/300x200/2563eb/FFFFFF.png?text=Flight+Voucher",
    exclusive: true,
    featured: true,
    expiresAt: "2025-12-31",
    limitedQuantity: false
  },
  {
    id: 2,
    partnerId: 2,
    title: "One Night Luxury Stay",
    description: "Free night at any LuxuryStay hotel worldwide.",
    pointsCost: 30000,
    dollarValue: 400,
    category: "hotels",
    image: "https://placehold.co/300x200/6366f1/FFFFFF.png?text=Hotel+Stay",
    exclusive: false,
    featured: true,
    expiresAt: "2025-12-31",
    limitedQuantity: false
  },
  {
    id: 3,
    partnerId: 3,
    title: "Coffee Subscription",
    description: "One month of daily coffee at any Daily Grind location.",
    pointsCost: 8000,
    dollarValue: 100,
    category: "dining",
    image: "https://placehold.co/300x200/8b5cf6/FFFFFF.png?text=Coffee+Sub",
    exclusive: false,
    featured: false,
    expiresAt: undefined,
    limitedQuantity: false
  },
  {
    id: 4,
    partnerId: 4,
    title: "$100 Shopping Voucher",
    description: "Gift card for Fashion Forward online or in-store.",
    pointsCost: 10000,
    dollarValue: 100,
    category: "retail",
    image: "https://placehold.co/300x200/ec4899/FFFFFF.png?text=Shopping+Voucher",
    exclusive: false,
    featured: true,
    expiresAt: undefined,
    limitedQuantity: false
  },
  {
    id: 5,
    partnerId: 5,
    title: "Premium Headphones",
    description: "Noise-cancelling Bluetooth headphones.",
    pointsCost: 15000,
    dollarValue: 200,
    category: "retail",
    image: "https://placehold.co/300x200/f97316/FFFFFF.png?text=Headphones",
    exclusive: true,
    featured: false,
    expiresAt: undefined,
    limitedQuantity: true
  },
  {
    id: 6,
    partnerId: 6,
    title: "Concert Tickets",
    description: "Two tickets to a concert of your choice.",
    pointsCost: 20000,
    dollarValue: 250,
    category: "entertainment",
    image: "https://placehold.co/300x200/f59e0b/FFFFFF.png?text=Concert+Tickets",
    exclusive: false,
    featured: false,
    expiresAt: "2025-06-30",
    limitedQuantity: true
  },
  {
    id: 7,
    partnerId: 1,
    title: "Airport Lounge Access",
    description: "One-time airport lounge access at any major airport.",
    pointsCost: 5000,
    dollarValue: 50,
    category: "travel",
    image: "https://placehold.co/300x200/2563eb/FFFFFF.png?text=Lounge+Access",
    exclusive: false,
    featured: false,
    expiresAt: "2025-12-31",
    limitedQuantity: false
  },
  {
    id: 8,
    partnerId: 2,
    title: "Spa Package",
    description: "Full day spa package at any LuxuryStay hotel.",
    pointsCost: 12000,
    dollarValue: 150,
    category: "hotels",
    image: "https://placehold.co/300x200/6366f1/FFFFFF.png?text=Spa+Package",
    exclusive: true,
    featured: false,
    expiresAt: "2025-12-31",
    limitedQuantity: false
  }
];

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'travel':
      return <Plane className="h-5 w-5" />;
    case 'hotels':
      return <Hotel className="h-5 w-5" />;
    case 'dining':
      return <Coffee className="h-5 w-5" />;
    case 'retail':
      return <ShoppingCart className="h-5 w-5" />;
    case 'entertainment':
      return <TicketCheck className="h-5 w-5" />;
    default:
      return <Gift className="h-5 w-5" />;
  }
};

const PartnerCard: React.FC<{ partner: Partner }> = ({ partner }) => {
  return (
    <Card className="overflow-hidden h-full transition-all hover:shadow-md border-0 shadow-sm">
      <CardContent className="p-0">
        <div className="h-1.5 bg-gradient-to-r from-primary to-blue-400"></div>
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
              <img src={partner.logo} alt={partner.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg">{partner.name}</h3>
                {partner.featured && <Badge variant="secondary" className="text-xs">Featured Partner</Badge>}
              </div>
              <p className="text-muted-foreground text-sm">{partner.description}</p>
              <div className="flex items-center mt-2 text-xs text-primary">
                {getCategoryIcon(partner.category)}
                <span className="ml-1 capitalize">{partner.category}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 p-4 border-t">
        <Button variant="outline" size="sm" className="w-full">
          View Rewards
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

const RewardCard: React.FC<{ reward: Reward }> = ({ reward }) => {
  const partner = PARTNERS.find(p => p.id === reward.partnerId);
  const pointValueRatio = (reward.dollarValue / reward.pointsCost * 100).toFixed(2);
  
  return (
    <Card className="overflow-hidden h-full transition-all hover:shadow-md hover:-translate-y-1 duration-300 border-0 shadow-sm">
      <div className="relative h-40 overflow-hidden">
        <img src={reward.image} alt={reward.title} className="w-full h-full object-cover" />
        {reward.exclusive && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-primary text-white">xPoints Exclusive</Badge>
          </div>
        )}
        {reward.featured && (
          <div className="absolute top-2 left-2">
            <Badge variant="secondary">Featured</Badge>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
            <img src={partner?.logo} alt={partner?.name} className="w-full h-full object-cover" />
          </div>
          <span className="text-sm text-muted-foreground">{partner?.name}</span>
        </div>
        <h3 className="font-semibold mb-1">{reward.title}</h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{reward.description}</p>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-primary">{reward.pointsCost.toLocaleString()} xPoints</div>
            <div className="text-xs text-muted-foreground">Value: ${reward.dollarValue}</div>
          </div>
          <div className="bg-blue-50 px-2 py-1 rounded text-xs text-blue-600 font-medium">
            {pointValueRatio}% value
          </div>
        </div>
        {(reward.expiresAt || reward.limitedQuantity) && (
          <div className="mt-3 flex items-center text-xs text-amber-600">
            <Clock className="h-3 w-3 mr-1" />
            <span>{reward.expiresAt ? `Expires: ${new Date(reward.expiresAt).toLocaleDateString()}` : 'Limited quantity'}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button size="sm" className="w-full bg-primary hover:bg-blue-700">
          Redeem
        </Button>
      </CardFooter>
    </Card>
  );
};

const MarketplacePage: React.FC = () => {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // Get user's xPoints balance
  const { data: wallets = [] } = useQuery<any[]>({
    queryKey: ['/api/wallets'],
    enabled: !!user,
  });
  
  const xPointsWallet = wallets.find((w: any) => w.program === 'XPOINTS');
  const xPointsBalance = xPointsWallet?.balance || 0;
  
  // Filter rewards based on selected category and search term
  const filteredRewards = REWARDS.filter(reward => {
    // Apply category filter
    if (activeCategory !== "all" && reward.category !== activeCategory) {
      return false;
    }
    
    // Apply search filter
    if (searchTerm && !reward.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !reward.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  // Get featured partners
  const featuredPartners = PARTNERS.filter(partner => partner.featured);
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-100 via-blue-50 to-white rounded-2xl p-8 mb-8 border border-blue-200 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">xPoints Marketplace</h1>
            <p className="text-gray-600 mb-4 max-w-2xl">
              Redeem your xPoints for exclusive rewards from our partner network. Enjoy premium travel, dining, shopping experiences and more.
            </p>
            <div className="flex items-center space-x-4">
              <div className="bg-white rounded-lg shadow-sm p-4 border border-blue-100">
                <div className="text-sm font-medium text-gray-500 mb-1">Your Balance</div>
                <div className="text-2xl font-bold text-primary">{xPointsBalance.toLocaleString()} xPoints</div>
                <div className="text-xs text-gray-500">≈ ${(xPointsBalance * 0.01).toFixed(2)} value</div>
              </div>
              <Button className="bg-primary hover:bg-blue-700">
                <ShoppingBag className="mr-2 h-4 w-4" />
                View My Rewards
              </Button>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm mt-4 md:mt-0">
              <div className="text-sm font-medium text-gray-900 mb-2">Exclusive Offers</div>
              <div className="flex items-center text-sm">
                <Star className="h-4 w-4 text-yellow-500 mr-2" />
                <span>Get up to 1.5x value with xPoints Exclusive offers</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              type="text" 
              placeholder="Search rewards..." 
              className="pl-10 border-blue-100" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <Button variant="outline" className="border-blue-100">
              <Tag className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>
        
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Categories</TabsTrigger>
            <TabsTrigger value="travel">Travel</TabsTrigger>
            <TabsTrigger value="hotels">Hotels</TabsTrigger>
            <TabsTrigger value="dining">Dining</TabsTrigger>
            <TabsTrigger value="retail">Retail</TabsTrigger>
            <TabsTrigger value="entertainment">Entertainment</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Featured Partners */}
      <section className="mb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Featured Partners</h2>
          <Button variant="outline" size="sm" className="border-blue-100">
            View All Partners
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredPartners.map((partner) => (
            <PartnerCard key={partner.id} partner={partner} />
          ))}
        </div>
      </section>
      
      {/* Featured Rewards */}
      {filteredRewards.some(r => r.featured) && (
        <section className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Featured Rewards</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredRewards
              .filter(r => r.featured)
              .map((reward) => (
                <RewardCard key={reward.id} reward={reward} />
              ))}
          </div>
        </section>
      )}
      
      {/* All Rewards */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">All Rewards</h2>
          <div className="text-sm text-gray-500">
            Showing {filteredRewards.length} {filteredRewards.length === 1 ? 'reward' : 'rewards'}
          </div>
        </div>
        
        {filteredRewards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredRewards.map((reward) => (
              <RewardCard key={reward.id} reward={reward} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg">
            <div className="bg-gray-100 p-3 rounded-full mb-4">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No rewards found</h3>
            <p className="text-gray-500 text-center max-w-md">
              We couldn't find any rewards matching your search criteria. Try adjusting your filters or search term.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default MarketplacePage;