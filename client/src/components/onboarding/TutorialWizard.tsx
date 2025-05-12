import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  Zap,
  RefreshCw,
  Star,
  DollarSign,
  TrendingUp,
  Repeat,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Import all animations
import {
  WelcomeAnimation,
  DashboardAnimation, 
  NavigationAnimation,
  ConversionAnimation,
  ExchangeRatesAnimation,
  TryConversionAnimation, 
  MarketplaceAnimation,
  CreateOfferAnimation,
  AcceptTradeAnimation,
  TokenizationConceptAnimation,
  TokenizingAnimation,
  UsingTokensAnimation,
  DailyCheckInAnimation,
  ChallengesAnimation,
  BoostsAnimation,
  ExplorerOverviewAnimation,
  TranslatorAnimation,
  TrendsAnimation,
  TiersOverviewAnimation,
  BenefitsAnimation,
  UpgradeAnimation
} from './animations';

export type TutorialStep = {
  id: string;
  title: string;
  description: string;
  image?: string;
  animation?: React.ReactNode;
  video?: string;
  actionText?: string;
  actionPath?: string;
  completionTask?: "click" | "form" | "conversion" | "trade" | "manual";
  keywords?: string[];
};

export type TutorialModule = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  pathPattern?: RegExp;
  steps: TutorialStep[];
  completed?: boolean;
  unlocked?: boolean;
};

// Define all tutorials
export const tutorialModules: TutorialModule[] = [
  {
    id: "welcome",
    title: "Welcome to xPoints",
    description: "Get to know the basics of xPoints Exchange",
    icon: <BookOpen className="h-5 w-5" />,
    path: "/",
    pathPattern: /^\/$/, 
    steps: [
      {
        id: "welcome-1",
        title: "Welcome to xPoints Exchange!",
        description: "xPoints Exchange is a universal loyalty points exchange platform that allows you to convert points between different loyalty programs using xPoints as the base currency.",
        animation: <WelcomeAnimation />,
        actionText: "Continue",
      },
      {
        id: "welcome-2",
        title: "Dashboard Overview",
        description: "Your dashboard shows your current point balances, recent transactions, and quick actions for converting points.",
        animation: <DashboardAnimation />,
        actionText: "Continue",
      },
      {
        id: "welcome-3",
        title: "Navigation Menu",
        description: "Use the main navigation to access different features like point conversion, P2P trading, tokenization, and more.",
        animation: <NavigationAnimation />,
        actionText: "Explore Dashboard",
        actionPath: "/",
        completionTask: "click",
      },
    ],
    unlocked: true,
  },
  {
    id: "conversion",
    title: "Point Conversion",
    description: "Learn how to convert points between programs",
    icon: <Repeat className="h-5 w-5" />,
    path: "/",
    pathPattern: /^\/$/, 
    steps: [
      {
        id: "conversion-1",
        title: "Converting Points",
        description: "Convert your loyalty points from one program to another using xPoints as an intermediary currency.",
        animation: <ConversionAnimation />,
        actionText: "Continue",
      },
      {
        id: "conversion-2",
        title: "Exchange Rates",
        description: "Exchange rates determine how many points you'll receive when converting. Rates are updated in real-time for all supported programs.",
        animation: <ExchangeRatesAnimation />,
        actionText: "Continue",
      },
      {
        id: "conversion-3",
        title: "Try a Conversion",
        description: "Try converting some points between programs. Select your source and destination programs, enter the amount, and confirm.",
        animation: <TryConversionAnimation />,
        actionText: "Try Converting Points",
        completionTask: "conversion",
      },
    ],
  },
  {
    id: "p2p-trading",
    title: "P2P Trading",
    description: "Learn how to trade directly with other users",
    icon: <TrendingUp className="h-5 w-5" />,
    path: "/trading",
    pathPattern: /^\/trading$/, 
    steps: [
      {
        id: "trading-1",
        title: "P2P Trading Marketplace",
        description: "The P2P marketplace allows you to trade your loyalty points directly with other users, often at better rates than standard conversions.",
        animation: <MarketplaceAnimation />,
        actionText: "Continue",
      },
      {
        id: "trading-2",
        title: "Creating a Trade Offer",
        description: "Create a trade offer by specifying which points you want to offer and which ones you want in return, along with the amounts.",
        animation: <CreateOfferAnimation />,
        actionText: "Continue",
      },
      {
        id: "trading-3",
        title: "Accepting Trades",
        description: "Browse the marketplace for trade offers from other users. When you find a good deal, review the details and accept the trade.",
        animation: <AcceptTradeAnimation />,
        actionText: "Visit Trading Page",
        actionPath: "/trading",
        completionTask: "click",
      },
    ],
  },
  {
    id: "tokenization",
    title: "Tokenization",
    description: "Understand how to tokenize your loyalty points",
    icon: <DollarSign className="h-5 w-5" />,
    path: "/tokenization",
    pathPattern: /^\/tokenization$/, 
    steps: [
      {
        id: "tokenization-1",
        title: "What is Tokenization?",
        description: "Tokenization converts your loyalty points into digital tokens that can be traded or used in partner merchants.",
        animation: <TokenizationConceptAnimation />,
        actionText: "Continue",
      },
      {
        id: "tokenization-2",
        title: "Tokenizing Your Points",
        description: "Select the points you want to tokenize, review the conversion rate, and confirm to receive your tokens in your xPoints wallet.",
        animation: <TokenizingAnimation />,
        actionText: "Continue",
      },
      {
        id: "tokenization-3",
        title: "Using Tokenized Points",
        description: "Spend your tokenized points at partner merchants, transfer them to other users, or convert them back to traditional loyalty points.",
        animation: <UsingTokensAnimation />,
        actionText: "Explore Tokenization",
        actionPath: "/tokenization",
        completionTask: "click",
      },
    ],
  },
  {
    id: "earning",
    title: "Earning Points",
    description: "Discover ways to earn additional points",
    icon: <Zap className="h-5 w-5" />,
    path: "/earn",
    pathPattern: /^\/earn$/, 
    steps: [
      {
        id: "earning-1",
        title: "Daily Check-ins",
        description: "Earn free xPoints every day by checking in daily. Consecutive check-ins increase your rewards.",
        animation: <DailyCheckInAnimation />,
        actionText: "Continue",
      },
      {
        id: "earning-2",
        title: "Completing Challenges",
        description: "Earn bonus points by completing challenges like making conversions, referring friends, or participating in special events.",
        animation: <ChallengesAnimation />,
        actionText: "Continue",
      },
      {
        id: "earning-3",
        title: "Time-Limited Boosts",
        description: "Look out for time-limited boosts that offer increased rewards for specific activities.",
        animation: <BoostsAnimation />,
        actionText: "Visit Earn Page",
        actionPath: "/earn",
        completionTask: "click",
      },
    ],
  },
  {
    id: "explorer",
    title: "Market Explorer",
    description: "Explore loyalty program market data",
    icon: <RefreshCw className="h-5 w-5" />,
    path: "/explorer",
    pathPattern: /^\/explorer$/, 
    steps: [
      {
        id: "explorer-1",
        title: "Market Explorer Overview",
        description: "The explorer provides real-time market data on all supported loyalty programs, including exchange rates and trading volumes.",
        animation: <ExplorerOverviewAnimation />,
        actionText: "Continue",
      },
      {
        id: "explorer-2",
        title: "Points Translator",
        description: "The Points Translator helps you understand the real-world value of your points across different reward categories.",
        animation: <TranslatorAnimation />,
        actionText: "Continue",
      },
      {
        id: "explorer-3",
        title: "Market Trends",
        description: "Track historical trends in exchange rates to make more informed decisions on when to convert or trade your points.",
        animation: <TrendsAnimation />,
        actionText: "Visit Explorer",
        actionPath: "/explorer",
        completionTask: "click",
      },
    ],
  },
  {
    id: "membership-tiers",
    title: "Membership Tiers",
    description: "Learn about membership benefits and upgrades",
    icon: <Star className="h-5 w-5" />,
    path: "/profile",
    pathPattern: /^\/profile$/, 
    steps: [
      {
        id: "tiers-1",
        title: "Membership Tiers Overview",
        description: "xPoints Exchange offers four membership tiers: Standard, Silver, Gold, and Platinum. Each tier provides increasing benefits.",
        animation: <TiersOverviewAnimation />,
        actionText: "Continue",
      },
      {
        id: "tiers-2",
        title: "Tier Benefits",
        description: "Higher tiers offer benefits like reduced fees, priority support, exclusive offers, and higher daily earning limits.",
        animation: <BenefitsAnimation />,
        actionText: "Continue",
      },
      {
        id: "tiers-3",
        title: "How to Upgrade",
        description: "Automatically upgrade your tier by maintaining higher monthly point conversion activity or through direct tier purchases.",
        animation: <UpgradeAnimation />,
        actionText: "View Your Profile",
        actionPath: "/profile",
        completionTask: "click",
      },
    ],
  },
];

// Placeholder animation components
const WelcomeAnimation = () => (
  <motion.div 
    className="w-full h-[200px] bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
  >
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="text-center"
    >
      <motion.h2 
        className="text-2xl font-bold text-white mb-2"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        Welcome to xPoints Exchange
      </motion.h2>
      <motion.p
        className="text-white"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        Your Universal Loyalty Points Platform
      </motion.p>
    </motion.div>
  </motion.div>
);

const DashboardAnimation = () => (
  <motion.div 
    className="w-full h-[200px] bg-slate-100 rounded-lg p-4 flex flex-col"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    <motion.div
      className="w-full h-8 bg-slate-200 rounded mb-3"
      initial={{ width: 0 }}
      animate={{ width: "100%" }}
      transition={{ delay: 0.2, duration: 0.5 }}
    />
    <div className="flex gap-3">
      <motion.div
        className="flex-1 h-24 bg-blue-100 rounded"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
      />
      <motion.div
        className="flex-1 h-24 bg-purple-100 rounded"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      />
      <motion.div
        className="flex-1 h-24 bg-amber-100 rounded"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.6, duration: 0.3 }}
      />
    </div>
    <motion.div
      className="w-full h-12 bg-slate-200 rounded mt-auto"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.8, duration: 0.3 }}
    />
  </motion.div>
);

const NavigationAnimation = () => (
  <motion.div 
    className="w-full h-[200px] bg-slate-100 rounded-lg overflow-hidden"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
  >
    <motion.div
      className="w-full h-12 bg-slate-800 flex items-center px-4 gap-4"
      initial={{ y: -20 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      {["Home", "Trading", "Tokenize", "Explorer", "Earn"].map((item, i) => (
        <motion.div 
          key={item}
          className={`h-8 px-3 rounded-md flex items-center justify-center text-xs text-white ${i === 0 ? 'bg-blue-600' : 'bg-slate-700'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 + (i * 0.1), duration: 0.3 }}
        >
          {item}
        </motion.div>
      ))}
    </motion.div>
    <motion.div 
      className="w-full p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7, duration: 0.4 }}
    >
      <motion.div
        className="w-3/4 h-6 bg-slate-300 rounded mb-2"
        initial={{ width: 0 }}
        animate={{ width: "75%" }}
        transition={{ delay: 0.8, duration: 0.4 }}
      />
      <motion.div
        className="w-1/2 h-4 bg-slate-200 rounded"
        initial={{ width: 0 }}
        animate={{ width: "50%" }}
        transition={{ delay: 0.9, duration: 0.4 }}
      />
    </motion.div>
  </motion.div>
);

// Additional animations for other tutorial sections
const ConversionAnimation = () => (
  <motion.div 
    className="w-full h-[200px] bg-slate-100 rounded-lg p-4 flex items-center justify-center"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    <motion.div className="flex items-center gap-3">
      <motion.div 
        className="w-20 h-20 rounded-full bg-blue-200 flex items-center justify-center text-lg font-bold"
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        QFF
      </motion.div>
      <motion.div
        className="flex flex-col items-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <motion.div 
          className="text-2xl"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 1, delay: 0.6 }}
        >
          ↔️
        </motion.div>
        <motion.div 
          className="px-3 py-1 bg-purple-600 text-white text-sm rounded mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.3 }}
        >
          Convert
        </motion.div>
      </motion.div>
      <motion.div 
        className="w-20 h-20 rounded-full bg-violet-200 flex items-center justify-center text-lg font-bold"
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        GYG
      </motion.div>
    </motion.div>
  </motion.div>
);

const ExchangeRatesAnimation = () => (
  <motion.div 
    className="w-full h-[200px] bg-slate-100 rounded-lg p-4"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    <motion.div className="text-center mb-3">
      <motion.div 
        className="text-sm font-medium text-slate-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Current Exchange Rates
      </motion.div>
    </motion.div>
    <motion.div className="space-y-2">
      {[
        { from: "QANTAS", to: "XPOINTS", rate: "1:0.85" },
        { from: "GYG", to: "XPOINTS", rate: "1:1.2" },
        { from: "XPOINTS", to: "VELOCITY", rate: "1:0.95" }
      ].map((item, i) => (
        <motion.div 
          key={i}
          className="flex items-center justify-between bg-white p-2 rounded"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 + (i * 0.1), duration: 0.3 }}
        >
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium">
              {item.from[0]}
            </div>
            <div className="mx-2">→</div>
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-medium">
              {item.to[0]}
            </div>
          </div>
          <motion.div 
            className="font-bold"
            initial={{ scale: 0.8 }}
            animate={{ scale: [0.8, 1.1, 1] }}
            transition={{ delay: 0.5 + (i * 0.1), duration: 0.4 }}
          >
            {item.rate}
          </motion.div>
        </motion.div>
      ))}
    </motion.div>
  </motion.div>
);

const TryConversionAnimation = () => (
  <motion.div 
    className="w-full h-[200px] bg-slate-100 rounded-lg p-4"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    <motion.div 
      className="bg-white p-3 rounded-lg shadow-sm"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      <div className="flex justify-between mb-3">
        <motion.div 
          className="w-24 h-8 bg-blue-50 rounded flex items-center justify-center text-xs"
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          QANTAS
        </motion.div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          →
        </motion.div>
        <motion.div 
          className="w-24 h-8 bg-purple-50 rounded flex items-center justify-center text-xs"
          initial={{ x: 10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          XPOINTS
        </motion.div>
      </div>
      
      <motion.div 
        className="w-full h-10 bg-slate-100 rounded mb-3"
        initial={{ width: "30%" }}
        animate={{ width: "100%" }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <motion.div 
          className="text-xs text-center pt-1 text-slate-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          10,000 points ≈ 8,500 xPoints
        </motion.div>
      </motion.div>
      
      <motion.div 
        className="w-full h-10 bg-blue-600 rounded flex items-center justify-center text-white"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.3 }}
      >
        Convert Points
      </motion.div>
    </motion.div>
  </motion.div>
);

const MarketplaceAnimation = () => (
  <motion.div 
    className="w-full h-[200px] bg-slate-100 rounded-lg p-4"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    <motion.div 
      className="text-sm font-medium text-slate-500 mb-3 text-center"
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      P2P Trading Marketplace
    </motion.div>
    
    <div className="grid grid-cols-2 gap-3">
      {[
        { from: "QANTAS", to: "GYG", rate: "1:1.5", amount: "15,000" },
        { from: "XPOINTS", to: "VELOCITY", rate: "1:0.9", amount: "5,000" }
      ].map((item, i) => (
        <motion.div 
          key={i}
          className="bg-white p-2 rounded shadow-sm"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 + (i * 0.2), duration: 0.4 }}
        >
          <div className="flex justify-between text-xs mb-1">
            <div className="font-medium">{item.from} → {item.to}</div>
            <div className="text-green-600 font-medium">{item.rate}</div>
          </div>
          <div className="text-xs text-slate-500">{item.amount} pts</div>
        </motion.div>
      ))}
    </div>
    
    <motion.div 
      className="w-full h-8 bg-purple-600 rounded flex items-center justify-center text-white text-xs mt-3"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.8, duration: 0.3 }}
    >
      Create Offer +
    </motion.div>
  </motion.div>
);

const CreateOfferAnimation = () => (
  <motion.div 
    className="w-full h-[200px] bg-slate-100 rounded-lg p-4 flex flex-col"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    <motion.div 
      className="text-sm font-medium text-slate-500 mb-2 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      Create Trade Offer
    </motion.div>
    
    <div className="grid grid-cols-2 gap-3 mb-2">
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <div className="text-xs mb-1">You Offer</div>
        <div className="h-8 bg-blue-50 rounded flex items-center px-2 text-xs">QANTAS</div>
      </motion.div>
      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <div className="text-xs mb-1">You Want</div>
        <div className="h-8 bg-yellow-50 rounded flex items-center px-2 text-xs">GYG</div>
      </motion.div>
    </div>
    
    <div className="grid grid-cols-2 gap-3 mb-3">
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      >
        <div className="text-xs mb-1">Amount</div>
        <div className="h-8 bg-white rounded flex items-center px-2 text-xs">10,000</div>
      </motion.div>
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.3 }}
      >
        <div className="text-xs mb-1">Rate</div>
        <div className="h-8 bg-white rounded flex items-center px-2 text-xs">1:1.5</div>
      </motion.div>
    </div>
    
    <motion.div 
      className="w-full h-8 bg-purple-600 rounded flex items-center justify-center text-white text-xs mt-auto"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.8, duration: 0.3 }}
    >
      Create Offer
    </motion.div>
  </motion.div>
);

const AcceptTradeAnimation = () => (
  <motion.div 
    className="w-full h-[200px] bg-slate-100 rounded-lg p-4"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    <motion.div 
      className="bg-white p-3 rounded-lg shadow-sm mb-3"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      <div className="flex justify-between mb-2">
        <div className="text-xs">
          <div className="font-medium">QANTAS → GYG</div>
          <div className="text-slate-500">15,000 points</div>
        </div>
        <div className="text-xs text-right">
          <div className="font-medium text-green-600">Rate: 1:1.5</div>
          <div className="text-slate-500">Receive: 22,500</div>
        </div>
      </div>
      
      <motion.div 
        className="w-full h-6 bg-slate-100 flex items-center justify-center text-xs text-slate-500 rounded"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
      >
        User #1542 • Expires in 5 days
      </motion.div>
    </motion.div>
    
    <motion.div 
      className="flex gap-2"
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.6, duration: 0.3 }}
    >
      <div className="flex-1 h-8 border border-slate-300 rounded flex items-center justify-center text-xs">
        View Details
      </div>
      <motion.div 
        className="flex-1 h-8 bg-green-600 text-white rounded flex items-center justify-center text-xs"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{ 
          scale: [1, 1.05, 1],
          transition: { delay: 0.9, duration: 1, repeat: 1 }
        }}
      >
        Accept Trade
      </motion.div>
    </motion.div>
  </motion.div>
);

// Placeholder animations for other tutorial modules
const TokenizationConceptAnimation = () => (
  <motion.div className="w-full h-[200px] bg-gradient-to-r from-amber-100 to-amber-300 rounded-lg flex items-center justify-center">
    <motion.div
      className="text-center"
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="w-20 h-20 bg-amber-500 rounded-full mx-auto mb-3 flex items-center justify-center"
        animate={{ 
          boxShadow: ["0px 0px 0px rgba(0,0,0,0)", "0px 0px 20px rgba(251,191,36,0.7)", "0px 0px 0px rgba(0,0,0,0)"],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <DollarSign className="h-10 w-10 text-white" />
      </motion.div>
      <motion.p
        className="font-medium"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        Digital Tokens
      </motion.p>
    </motion.div>
  </motion.div>
);

const TokenizingAnimation = () => (
  <motion.div className="w-full h-[200px] bg-slate-100 rounded-lg p-4">
    <div className="space-y-3">
      <motion.div 
        className="bg-white p-2 rounded shadow"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <div className="text-xs mb-1">Select Points to Tokenize</div>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs mr-2">Q</div>
            <div className="text-xs">QANTAS</div>
          </div>
          <div className="text-xs font-medium">5,000 pts</div>
        </div>
      </motion.div>
      
      <motion.div 
        className="flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
      >
        <motion.div 
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          ↓
        </motion.div>
      </motion.div>
      
      <motion.div 
        className="bg-amber-50 p-2 rounded shadow"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.3 }}
      >
        <div className="text-xs mb-1">Tokenized Value</div>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs mr-2">
              <DollarSign className="h-3 w-3" />
            </div>
            <div className="text-xs">xToken</div>
          </div>
          <div className="text-xs font-medium">4,250 tokens</div>
        </div>
      </motion.div>
      
      <motion.div 
        className="w-full h-8 bg-amber-500 text-white rounded flex items-center justify-center text-xs"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.3 }}
      >
        Confirm Tokenization
      </motion.div>
    </div>
  </motion.div>
);

const UsingTokensAnimation = () => (
  <motion.div className="w-full h-[200px] bg-slate-100 rounded-lg p-4">
    <div className="grid grid-cols-3 gap-2">
      <motion.div 
        className="bg-white p-2 rounded shadow flex flex-col items-center justify-center"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mb-1">
          <DollarSign className="h-4 w-4 text-green-600" />
        </div>
        <div className="text-xs text-center">Spend at Merchants</div>
      </motion.div>
      
      <motion.div 
        className="bg-white p-2 rounded shadow flex flex-col items-center justify-center"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mb-1">
          <Repeat className="h-4 w-4 text-blue-600" />
        </div>
        <div className="text-xs text-center">Transfer to Others</div>
      </motion.div>
      
      <motion.div 
        className="bg-white p-2 rounded shadow flex flex-col items-center justify-center"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mb-1">
          <RefreshCw className="h-4 w-4 text-purple-600" />
        </div>
        <div className="text-xs text-center">Convert Back</div>
      </motion.div>
    </div>
    
    <motion.div 
      className="mt-4 p-2 bg-amber-50 rounded text-xs"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6, duration: 0.4 }}
    >
      <div className="font-medium mb-1">Your Token Balance</div>
      <div className="flex justify-between">
        <div>Available</div>
        <div className="font-medium">12,500 xTokens</div>
      </div>
    </motion.div>
  </motion.div>
);

const DailyCheckInAnimation = () => (
  <motion.div className="w-full h-[200px] bg-slate-100 rounded-lg p-4">
    <motion.div 
      className="text-center mb-3"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="text-sm font-medium">Daily Check-in</div>
      <div className="text-xs text-slate-500">Day 3 of 7</div>
    </motion.div>
    
    <motion.div className="flex justify-between mb-4">
      {[1, 2, 3, 4, 5, 6, 7].map((day) => (
        <motion.div 
          key={day}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
            day < 3 ? 'bg-green-100 text-green-600' : 
            day === 3 ? 'bg-blue-600 text-white' : 
            'bg-slate-200 text-slate-500'
          }`}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 + (day * 0.05), duration: 0.3 }}
        >
          {day < 3 ? <CheckCircle2 className="h-4 w-4" /> : day}
        </motion.div>
      ))}
    </motion.div>
    
    <motion.div 
      className="bg-white p-3 rounded-lg shadow text-center"
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.6, duration: 0.4 }}
    >
      <motion.div 
        className="text-lg font-bold text-blue-600"
        animate={{ 
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        +50 xPoints
      </motion.div>
      <div className="text-xs text-slate-500 mt-1">Check in today to claim</div>
    </motion.div>
  </motion.div>
);

const ChallengesAnimation = () => (
  <motion.div className="w-full h-[200px] bg-slate-100 rounded-lg p-3">
    <motion.div 
      className="text-sm font-medium mb-2 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      Challenges
    </motion.div>
    
    <div className="space-y-2">
      {[
        { title: "Make 3 Conversions", progress: 66, reward: 100 },
        { title: "Link a New Account", progress: 0, reward: 200 },
        { title: "Refer a Friend", progress: 0, reward: 500 }
      ].map((challenge, i) => (
        <motion.div 
          key={i}
          className="bg-white p-2 rounded shadow-sm"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 + (i * 0.1), duration: 0.3 }}
        >
          <div className="flex justify-between text-xs mb-1">
            <div>{challenge.title}</div>
            <div className="text-blue-600">+{challenge.reward} pts</div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded overflow-hidden">
            <motion.div 
              className="h-full bg-green-600"
              initial={{ width: 0 }}
              animate={{ width: `${challenge.progress}%` }}
              transition={{ delay: 0.5 + (i * 0.1), duration: 0.5 }}
            />
          </div>
          <div className="text-right text-xs text-slate-500 mt-1">
            {challenge.progress}% complete
          </div>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

const BoostsAnimation = () => (
  <motion.div className="w-full h-[200px] bg-slate-100 rounded-lg p-4">
    <motion.div 
      className="text-sm font-medium mb-3 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      Time-Limited Boosts
    </motion.div>
    
    <motion.div 
      className="bg-gradient-to-r from-purple-100 to-pink-100 p-3 rounded-lg shadow-sm mb-3 border border-purple-200"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      <div className="flex justify-between mb-2">
        <div className="font-medium text-purple-600 text-sm">2X Conversion Reward</div>
        <motion.div 
          className="bg-purple-200 text-purple-700 text-xs px-2 rounded flex items-center"
          animate={{ 
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          ACTIVE
        </motion.div>
      </div>
      <div className="text-xs text-slate-600 mb-2">
        Earn double points on all conversions for the next 2 hours
      </div>
      <div className="w-full bg-white rounded-full h-1.5 overflow-hidden">
        <motion.div 
          className="h-full bg-purple-600"
          initial={{ width: "70%" }}
          animate={{ width: "0%" }}
          transition={{ duration: 20, ease: "linear" }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-500 mt-1">
        <div>01:24:32 remaining</div>
        <div>2X</div>
      </div>
    </motion.div>
    
    <motion.div 
      className="bg-white p-2 rounded shadow-sm opacity-60"
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 0.6 }}
      transition={{ delay: 0.5, duration: 0.3 }}
    >
      <div className="flex justify-between">
        <div className="font-medium text-blue-600 text-sm">Bonus Check-in Reward</div>
        <div className="text-xs text-slate-500">Coming Soon</div>
      </div>
      <div className="text-xs text-slate-600">
        Next weekend: 3X points for daily check-ins
      </div>
    </motion.div>
  </motion.div>
);

const ExplorerOverviewAnimation = () => (
  <motion.div className="w-full h-[200px] bg-slate-100 rounded-lg p-4">
    <motion.div 
      className="bg-white rounded-lg shadow-sm p-3 mb-3"
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      <div className="flex justify-between mb-2">
        <div className="text-sm font-medium">Market Summary</div>
        <div className="text-xs text-slate-500">Last updated: 2m ago</div>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <motion.div 
          className="bg-blue-50 p-1 rounded text-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <div className="text-xs text-slate-500">Programs</div>
          <div className="font-medium">10</div>
        </motion.div>
        
        <motion.div 
          className="bg-green-50 p-1 rounded text-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <div className="text-xs text-slate-500">24h Volume</div>
          <div className="font-medium">1.2M</div>
        </motion.div>
        
        <motion.div 
          className="bg-purple-50 p-1 rounded text-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
        >
          <div className="text-xs text-slate-500">Trades</div>
          <div className="font-medium">384</div>
        </motion.div>
      </div>
    </motion.div>
    
    <motion.div 
      className="flex items-center justify-between bg-white p-2 rounded shadow-sm"
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.7, duration: 0.3 }}
    >
      <div className="text-xs">
        <div className="font-medium">QANTAS / XPOINTS</div>
        <div className="text-green-600">+2.4%</div>
      </div>
      
      <motion.div 
        className="flex-1 h-10 mx-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.4 }}
      >
        <svg width="100%" height="100%" viewBox="0 0 100 30">
          <path 
            d="M0,15 Q10,10 20,18 T40,12 T60,17 T80,5 T100,15" 
            fill="none" 
            stroke="#dbeafe" 
            strokeWidth="2"
          />
          <motion.path 
            d="M0,15 Q10,10 20,18 T40,12 T60,17 T80,5 T100,15" 
            fill="none" 
            stroke="#3b82f6" 
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 1, duration: 1.5, ease: "easeInOut" }}
          />
        </svg>
      </motion.div>
      
      <div className="text-right text-xs">
        <div className="font-medium">0.85</div>
        <div className="text-slate-500">Current Rate</div>
      </div>
    </motion.div>
  </motion.div>
);

const TranslatorAnimation = () => (
  <motion.div className="w-full h-[200px] bg-slate-100 rounded-lg p-4">
    <motion.div 
      className="text-sm font-medium mb-3 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      Points Translator
    </motion.div>
    
    <motion.div 
      className="bg-white p-3 rounded-lg shadow-sm"
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      <div className="flex justify-between mb-3">
        <motion.div 
          className="py-1 px-2 bg-blue-100 text-blue-700 text-xs rounded-full"
          whileHover={{ scale: 1.05 }}
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          Flights
        </motion.div>
        <motion.div 
          className="py-1 px-2 bg-slate-100 text-slate-700 text-xs rounded-full"
          whileHover={{ scale: 1.05 }}
          initial={{ x: -5, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          Hotels
        </motion.div>
        <motion.div 
          className="py-1 px-2 bg-slate-100 text-slate-700 text-xs rounded-full"
          whileHover={{ scale: 1.05 }}
          initial={{ x: 0, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          Gift Cards
        </motion.div>
        <motion.div 
          className="py-1 px-2 bg-slate-100 text-slate-700 text-xs rounded-full"
          whileHover={{ scale: 1.05 }}
          initial={{ x: 5, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
        >
          Cash
        </motion.div>
      </div>
      
      <motion.div 
        className="space-y-2 mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.4 }}
      >
        <div className="flex justify-between text-xs">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center text-[10px] mr-1">Q</div>
            <span>15,000 QANTAS points</span>
          </div>
          <span className="font-medium">SYD → LAX economy</span>
        </div>
        
        <div className="flex justify-between text-xs">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center text-[10px] mr-1">V</div>
            <span>20,000 VELOCITY points</span>
          </div>
          <span className="font-medium">SYD → HKG economy</span>
        </div>
      </motion.div>
      
      <motion.div 
        className="text-center text-xs text-blue-600 font-medium"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.3 }}
      >
        View More Comparisons →
      </motion.div>
    </motion.div>
  </motion.div>
);

const TrendsAnimation = () => (
  <motion.div className="w-full h-[200px] bg-slate-100 rounded-lg p-4">
    <motion.div 
      className="text-sm font-medium mb-3 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      Market Trends
    </motion.div>
    
    <motion.div 
      className="flex justify-between mb-2"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.3 }}
    >
      <motion.div 
        className="py-1 px-2 bg-blue-600 text-white text-xs rounded-full"
        whileHover={{ scale: 1.05 }}
      >
        1W
      </motion.div>
      <motion.div 
        className="py-1 px-2 bg-slate-100 text-slate-700 text-xs rounded-full"
        whileHover={{ scale: 1.05 }}
      >
        1M
      </motion.div>
      <motion.div 
        className="py-1 px-2 bg-slate-100 text-slate-700 text-xs rounded-full"
        whileHover={{ scale: 1.05 }}
      >
        3M
      </motion.div>
      <motion.div 
        className="py-1 px-2 bg-slate-100 text-slate-700 text-xs rounded-full"
        whileHover={{ scale: 1.05 }}
      >
        1Y
      </motion.div>
    </motion.div>
    
    <motion.div 
      className="bg-white rounded p-3 h-[110px] relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4, duration: 0.4 }}
    >
      <div className="absolute top-2 left-2 text-xs font-medium">Qantas → xPoints</div>
      
      <svg width="100%" height="100%" viewBox="0 0 100 70" preserveAspectRatio="none">
        <path 
          d="M0,50 Q10,45 20,47 T40,40 T60,30 T80,38 T100,35" 
          fill="none" 
          stroke="#dbeafe" 
          strokeWidth="2"
        />
        <motion.path 
          d="M0,50 Q10,45 20,47 T40,40 T60,30 T80,38 T100,35" 
          fill="none" 
          stroke="#3b82f6" 
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.6, duration: 1.5, ease: "easeInOut" }}
        />
        
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.3 }}
        >
          <circle cx="60" cy="30" r="3" fill="#3b82f6" />
          <text x="60" y="20" textAnchor="middle" fill="#3b82f6" fontSize="8">0.92</text>
        </motion.g>
      </svg>
    </motion.div>
  </motion.div>
);

const TiersOverviewAnimation = () => (
  <motion.div className="w-full h-[200px] bg-slate-100 rounded-lg p-4">
    <motion.div 
      className="text-sm font-medium mb-3 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      Membership Tiers
    </motion.div>
    
    <div className="flex justify-between">
      {[
        { name: "Standard", color: "bg-slate-200", progress: 100 },
        { name: "Silver", color: "bg-slate-300", progress: 60 },
        { name: "Gold", color: "bg-amber-200", progress: 0 },
        { name: "Platinum", color: "bg-indigo-200", progress: 0 }
      ].map((tier, i) => (
        <motion.div 
          key={tier.name}
          className={`w-16 h-20 ${tier.color} rounded flex flex-col items-center justify-center ${i === 1 ? 'border-2 border-blue-500' : ''}`}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 + (i * 0.1), duration: 0.4 }}
        >
          <div className="text-xs font-medium">{tier.name}</div>
          {i === 1 && (
            <motion.div 
              className="bg-blue-600 text-white text-[8px] px-1 rounded mt-1"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7, duration: 0.3 }}
            >
              CURRENT
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
    
    <motion.div 
      className="w-full bg-slate-200 h-2 rounded-full mt-4 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6, duration: 0.3 }}
    >
      <motion.div 
        className="h-full bg-blue-600"
        initial={{ width: 0 }}
        animate={{ width: "38%" }}
        transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
      />
    </motion.div>
    
    <motion.div 
      className="flex justify-between text-xs text-slate-500 mt-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1, duration: 0.3 }}
    >
      <div>5,000 pts</div>
      <div>15,000 pts to Gold</div>
    </motion.div>
  </motion.div>
);

const BenefitsAnimation = () => (
  <motion.div className="w-full h-[200px] bg-slate-100 rounded-lg p-4">
    <motion.div 
      className="text-sm font-medium mb-2 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      Silver Tier Benefits
    </motion.div>
    
    <div className="space-y-2">
      {[
        { benefit: "Reduced fees (0.8%)", icon: <DollarSign className="h-3 w-3" /> },
        { benefit: "Priority support", icon: <Star className="h-3 w-3" /> },
        { benefit: "Higher daily earnings", icon: <TrendingUp className="h-3 w-3" /> }
      ].map((item, i) => (
        <motion.div 
          key={i}
          className="flex items-center bg-white p-2 rounded"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 + (i * 0.1), duration: 0.3 }}
        >
          <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2">
            {item.icon}
          </div>
          <div className="text-xs">{item.benefit}</div>
        </motion.div>
      ))}
    </div>
    
    <motion.div 
      className="mt-3 p-2 bg-amber-50 rounded border border-amber-100"
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.7, duration: 0.4 }}
    >
      <div className="text-xs font-medium mb-1">Next Tier: Gold</div>
      <div className="text-xs">
        Convert 15,000+ points monthly to unlock 0.5% fees, 2x daily check-in rewards, and exclusive offers
      </div>
    </motion.div>
  </motion.div>
);

const UpgradeAnimation = () => (
  <motion.div className="w-full h-[200px] bg-slate-100 rounded-lg p-4">
    <motion.div 
      className="text-sm font-medium mb-3 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      How to Upgrade Your Tier
    </motion.div>
    
    <div className="space-y-3">
      <motion.div 
        className="bg-white p-2 rounded-lg shadow-sm"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <div className="font-medium text-xs mb-1">Automatic Upgrades</div>
        <div className="text-xs text-slate-600">
          Convert more points monthly:
        </div>
        <div className="text-xs flex justify-between mt-1">
          <span>• Silver: 5,000+ pts</span>
          <span>• Gold: 20,000+ pts</span>
        </div>
        <div className="text-xs flex justify-between">
          <span>• Platinum: 50,000+ pts</span>
          <span></span>
        </div>
      </motion.div>
      
      <motion.div 
        className="bg-gradient-to-r from-amber-50 to-amber-100 p-2 rounded-lg shadow-sm"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <div className="font-medium text-xs mb-1">Direct Upgrade</div>
        <div className="text-xs text-slate-600">
          Purchase tier upgrades with xPoints:
        </div>
        <div className="flex justify-between mt-1">
          <motion.div 
            className="py-1 px-2 bg-amber-500 text-white text-[10px] rounded flex items-center"
            whileHover={{ scale: 1.05 }}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6, duration: 0.2 }}
          >
            <Star className="h-3 w-3 mr-1" /> Gold: 10,000 pts
          </motion.div>
          <motion.div 
            className="py-1 px-2 bg-indigo-500 text-white text-[10px] rounded flex items-center"
            whileHover={{ scale: 1.05 }}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.7, duration: 0.2 }}
          >
            <Star className="h-3 w-3 mr-1" /> Platinum: 30,000 pts
          </motion.div>
        </div>
      </motion.div>
    </div>
  </motion.div>
);

// Main tutorial wizard component
const TutorialWizard: React.FC = () => {
  const [location] = useLocation();
  const { user } = useAuth();
  const [showWizard, setShowWizard] = useState(false);
  const [activeModule, setActiveModule] = useState<TutorialModule | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [allModules, setAllModules] = useState<TutorialModule[]>(() => {
    // Initialize with first module unlocked
    return tutorialModules.map((module, index) => ({
      ...module,
      unlocked: index === 0 ? true : false,
      completed: false
    }));
  });

  // Function to save progress to local storage
  const saveProgressToLocalStorage = (modules: TutorialModule[], completed: string[]) => {
    if (user) {
      localStorage.setItem(`tutorial-progress-${user.id}`, JSON.stringify({
        modules,
        completed
      }));
    }
  };

  // Load saved progress
  useEffect(() => {
    if (user) {
      const savedProgress = localStorage.getItem(`tutorial-progress-${user.id}`);
      if (savedProgress) {
        try {
          const { modules, completed } = JSON.parse(savedProgress);
          setAllModules(modules);
          setCompletedModules(completed);
        } catch (error) {
          console.error("Failed to parse saved tutorial progress:", error);
        }
      }
    }
  }, [user]);

  // Detect if we should show the tutorial based on current path
  useEffect(() => {
    const moduleForCurrentPath = allModules.find(module => 
      (module.pathPattern && module.pathPattern.test(location)) || 
      module.path === location
    );
    
    if (moduleForCurrentPath && !completedModules.includes(moduleForCurrentPath.id)) {
      setActiveModule(moduleForCurrentPath);
      setCurrentStep(0);
      setShowWizard(true);
    } else {
      setShowWizard(false);
    }
  }, [location, allModules, completedModules]);

  // Handle next step
  const handleNextStep = () => {
    if (!activeModule) return;
    
    if (currentStep < activeModule.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Complete this module
      const updatedModules = allModules.map(module => {
        if (module.id === activeModule.id) {
          return { ...module, completed: true };
        }
        // Unlock the next module
        const currentIndex = allModules.findIndex(m => m.id === activeModule.id);
        if (currentIndex >= 0 && currentIndex + 1 < allModules.length && module.id === allModules[currentIndex + 1].id) {
          return { ...module, unlocked: true };
        }
        return module;
      });
      
      setAllModules(updatedModules);
      setCompletedModules(prev => [...prev, activeModule.id]);
      saveProgressToLocalStorage(updatedModules, [...completedModules, activeModule.id]);
      setShowWizard(false);
      
      // Update user tutorial progress on the server
      apiRequest("POST", "/api/user/tutorial-progress", { 
        moduleId: activeModule.id,
        completed: true
      }).catch(err => console.error("Failed to update tutorial progress:", err));
    }
  };

  // Handle manual completion of a step
  const completeStep = (moduleId: string, stepId: string) => {
    const moduleIndex = allModules.findIndex(m => m.id === moduleId);
    if (moduleIndex === -1) return;
    
    const stepIndex = allModules[moduleIndex].steps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) return;
    
    // If this is the last step, complete the module
    if (stepIndex === allModules[moduleIndex].steps.length - 1) {
      const updatedModules = allModules.map((module, idx) => {
        if (idx === moduleIndex) {
          return { ...module, completed: true };
        }
        // Unlock the next module
        if (idx === moduleIndex + 1) {
          return { ...module, unlocked: true };
        }
        return module;
      });
      
      setAllModules(updatedModules);
      setCompletedModules(prev => [...prev, moduleId]);
      saveProgressToLocalStorage(updatedModules, [...completedModules, moduleId]);
      
      // Update user tutorial progress on the server
      apiRequest("POST", "/api/user/tutorial-progress", { 
        moduleId,
        completed: true
      }).catch(err => console.error("Failed to update tutorial progress:", err));
    }
  };

  // Open a specific tutorial module
  const openTutorial = (moduleId: string) => {
    const module = allModules.find(m => m.id === moduleId);
    if (module && module.unlocked) {
      setActiveModule(module);
      setCurrentStep(0);
      setShowWizard(true);
    }
  };

  // Calculate overall tutorial progress
  const calculateOverallProgress = () => {
    return Math.round((completedModules.length / allModules.length) * 100);
  };

  const currentModuleProgress = () => {
    if (!activeModule) return 0;
    return Math.round(((currentStep + 1) / activeModule.steps.length) * 100);
  };

  return (
    <>
      {/* Tutorial Dialog */}
      <Dialog open={showWizard} onOpenChange={setShowWizard}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {activeModule?.steps[currentStep]?.title || "Tutorial"}
            </DialogTitle>
            <DialogDescription>
              {activeModule?.steps[currentStep]?.description || "Learn how to use xPoints Exchange"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              {activeModule?.steps[currentStep]?.animation}
            </div>
            
            <Progress value={currentModuleProgress()} className="mb-2" />
            <div className="flex justify-between text-xs text-slate-500">
              <div>Step {currentStep + 1} of {activeModule?.steps.length}</div>
              <div>{activeModule?.title}</div>
            </div>
          </div>
          
          <DialogFooter className="flex justify-between">
            {currentStep > 0 ? (
              <Button variant="outline" onClick={() => setCurrentStep(prev => prev - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setShowWizard(false)}>
                <X className="h-4 w-4 mr-1" /> Close
              </Button>
            )}
            
            <Button onClick={handleNextStep}>
              {currentStep < (activeModule?.steps.length || 1) - 1 ? (
                <>Next <ChevronRight className="h-4 w-4 ml-1" /></>
              ) : (
                <>Complete <CheckCircle2 className="h-4 w-4 ml-1" /></>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Tutorial Button */}
      <div className="fixed bottom-20 right-6 z-50">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <Button 
            variant="default" 
            className="h-12 w-12 rounded-full p-0 shadow-lg"
            onClick={() => setShowWizard(true)}
          >
            <BookOpen className="h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </>
  );
};

// Tutorial Launcher Component for home page
export const TutorialLauncher: React.FC = () => {
  const [showDialog, setShowDialog] = useState(false);
  const { user } = useAuth();
  const [modules, setModules] = useState<TutorialModule[]>(tutorialModules);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>("all");
  
  // Load saved progress
  useEffect(() => {
    if (user) {
      const savedProgress = localStorage.getItem(`tutorial-progress-${user.id}`);
      if (savedProgress) {
        try {
          const { modules, completed } = JSON.parse(savedProgress);
          setModules(modules);
          setCompletedModules(completed);
        } catch (error) {
          console.error("Failed to parse saved tutorial progress:", error);
        }
      }
    }
  }, [user]);

  // Calculate overall progress
  const calculateOverallProgress = () => {
    return Math.round((completedModules.length / modules.length) * 100);
  };

  // Open a specific tutorial
  const openTutorial = (moduleId: string) => {
    // Logic to trigger the tutorial wizard
    // Will be implemented by the parent component
  };

  // Filter modules based on selected tab
  const getFilteredModules = () => {
    if (selectedTab === "all") return modules;
    if (selectedTab === "completed") return modules.filter(m => completedModules.includes(m.id));
    if (selectedTab === "incomplete") return modules.filter(m => !completedModules.includes(m.id) && m.unlocked);
    return modules;
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-lg">Tutorials & Guides</h3>
        <Button 
          variant="outline" 
          size="sm"
          className="text-sm"
          onClick={() => setShowDialog(true)}
        >
          <Play className="h-4 w-4 mr-2" /> View All
        </Button>
      </div>
      
      <div className="space-y-2">
        {modules.slice(0, 3).map((module) => (
          <div 
            key={module.id}
            className={`p-3 rounded-lg border ${module.unlocked ? 'cursor-pointer hover:bg-slate-50' : 'opacity-60 cursor-not-allowed'}`}
            onClick={() => module.unlocked ? openTutorial(module.id) : null}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center mr-3">
                  {module.icon}
                </div>
                <div>
                  <div className="font-medium">{module.title}</div>
                  <div className="text-xs text-slate-500">{module.description}</div>
                </div>
              </div>
              {completedModules.includes(module.id) ? (
                <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Completed
                </Badge>
              ) : module.unlocked ? (
                <ChevronRight className="h-5 w-5 text-slate-400" />
              ) : (
                <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-500">
                  Locked
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Complete Tutorial Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Tutorials & Learning Center</DialogTitle>
            <DialogDescription>
              Learn how to use xPoints Exchange with our step-by-step tutorials.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-1">
                <div className="text-sm font-medium">Your Progress</div>
                <Progress value={calculateOverallProgress()} className="w-[200px]" />
                <div className="text-xs text-slate-500">
                  {completedModules.length} of {modules.length} tutorials completed
                </div>
              </div>
              <div>
                <Badge className="bg-blue-600 hover:bg-blue-700">
                  {calculateOverallProgress()}% complete
                </Badge>
              </div>
            </div>
            
            <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Tutorials</TabsTrigger>
                <TabsTrigger value="incomplete">In Progress</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              
              <TabsContent value={selectedTab} className="space-y-3">
                {getFilteredModules().map((module) => (
                  <div 
                    key={module.id}
                    className={`p-3 rounded-lg border ${module.unlocked ? 'cursor-pointer hover:bg-slate-50' : 'opacity-60 cursor-not-allowed'}`}
                    onClick={() => module.unlocked ? openTutorial(module.id) : null}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mr-3">
                          {module.icon}
                        </div>
                        <div>
                          <div className="font-medium">{module.title}</div>
                          <div className="text-sm text-slate-500">{module.description}</div>
                          <div className="text-xs text-slate-400 mt-1">
                            {module.steps.length} steps • {module.path === location ? 'Current page' : ''}
                          </div>
                        </div>
                      </div>
                      
                      {completedModules.includes(module.id) ? (
                        <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Completed
                        </Badge>
                      ) : module.unlocked ? (
                        <Button variant="ghost" size="sm">
                          <Play className="h-4 w-4 mr-1" /> Start
                        </Button>
                      ) : (
                        <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-500">
                          Locked
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TutorialWizard;