import React from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowUpDown, Wallet, TrendingUp, AreaChart, 
  BookOpen, BarChart4, Award, FileText 
} from 'lucide-react';
import { motion } from 'framer-motion';

const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description, 
  href, 
  color 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
  href: string; 
  color: string;
}) => {
  return (
    <Link href={href}>
      <motion.div 
        whileTap={{ scale: 0.95 }}
        className="cursor-pointer"
      >
        <Card className="overflow-hidden">
          <div className={`h-2 ${color}`} />
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-full ${color.replace('bg-', 'bg-opacity-20 text-')}`}>
                <Icon size={20} />
              </div>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
};

const MobileHomePage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  return (
    <div className="pb-4 px-4">
      {/* Welcome Section */}
      <section className="py-4">
        <h1 className="text-2xl font-bold">Welcome back, {user?.firstName || user?.username || 'User'}</h1>
        <p className="text-muted-foreground">Manage and optimize your loyalty points</p>
      </section>

      {/* Quick Actions */}
      <section className="mb-6">
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="secondary" 
            size="lg" 
            className="h-16"
            onClick={() => toast({ title: "Coming Soon", description: "Mobile payment feature is coming soon." })}
          >
            <div className="flex flex-col items-center">
              <ArrowUpDown className="h-5 w-5 mb-1" />
              <span className="text-xs">Convert Points</span>
            </div>
          </Button>
          <Button 
            variant="secondary" 
            size="lg" 
            className="h-16"
            onClick={() => toast({ title: "Coming Soon", description: "Mobile wallet feature is coming soon." })}
          >
            <div className="flex flex-col items-center">
              <Wallet className="h-5 w-5 mb-1" />
              <span className="text-xs">Add Wallet</span>
            </div>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Features</h2>
        <div className="grid gap-3">
          <FeatureCard 
            icon={BarChart4}
            title="Explorer" 
            description="View live exchange rates and market data" 
            href="/explorer"
            color="bg-blue-500"
          />
          <FeatureCard 
            icon={ArrowUpDown}
            title="Trading" 
            description="Trade loyalty points with other users" 
            href="/trading"
            color="bg-purple-500"
          />
          <FeatureCard 
            icon={BookOpen}
            title="Tutorial" 
            description="Learn how to use the platform" 
            href="/tutorial"
            color="bg-emerald-500"
          />
          <FeatureCard 
            icon={FileText}
            title="Merchant" 
            description="Business tools and analytics" 
            href="/merchant"
            color="bg-amber-500"
          />
        </div>
      </section>

      {/* Account Status */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Account Status</h2>
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Membership Tier</p>
                <div className="flex items-center gap-2">
                  <Award className="text-yellow-500" size={18} />
                  <p className="font-semibold">{user?.membershipTier || 'STANDARD'}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => toast({ title: "Mobile Profile", description: "Mobile profile view is coming soon." })}>
                View Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Activity Feed (Placeholder) */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
        <div className="text-center py-6 text-muted-foreground">
          <AreaChart className="mx-auto h-12 w-12 opacity-20 mb-2" />
          <p>Your recent transactions will appear here</p>
          <Button 
            variant="link" 
            onClick={() => toast({ title: "Mobile History", description: "Transaction history is coming soon to mobile." })}
          >
            View All Transactions
          </Button>
        </div>
      </section>
    </div>
  );
};

export default MobileHomePage;