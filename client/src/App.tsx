import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Laptop, Smartphone } from "lucide-react";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/profile-page";
import TokenizationPage from "@/pages/tokenization-page";
import MerchantPage from "@/pages/merchant-page";
import ExplorerPage from "@/pages/explorer-page";
import TradingPage from "@/pages/trading-page";
import TutorialPage from "@/pages/tutorial-page";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { usePreferredLayout } from "@/hooks/use-mobile";
import MobileLayout from "@/components/layout/MobileLayout";

function Router() {
  const { useMobileLayout } = usePreferredLayout();

  const routes = (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/tokenization" component={TokenizationPage} />
      <ProtectedRoute path="/merchant" component={MerchantPage} />
      <ProtectedRoute path="/explorer" component={ExplorerPage} />
      <ProtectedRoute path="/trading" component={TradingPage} />
      <ProtectedRoute path="/tutorial" component={TutorialPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );

  // For mobile view, wrap routes in the mobile layout
  if (useMobileLayout) {
    return <MobileLayout>{routes}</MobileLayout>;
  }

  // For desktop view, just return the routes
  return routes;
}

function LayoutToggle() {
  const { isMobile, preferMobile, toggleLayoutPreference } = usePreferredLayout();
  
  // Only show toggle on desktop
  if (isMobile) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        variant="outline"
        size="icon"
        onClick={toggleLayoutPreference}
        title={preferMobile ? "Switch to Desktop View" : "Switch to Mobile View"}
      >
        {preferMobile ? <Laptop size={18} /> : <Smartphone size={18} />}
      </Button>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
          <LayoutToggle />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
