import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import MainLayout from "@/components/layout/MainLayout";
import { usePreferredLayout } from "@/hooks/use-mobile";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();
  const { useMobileLayout } = usePreferredLayout();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // If using mobile layout, we don't need to wrap components with MainLayout
  // since MobileLayout is already applied at the router level
  if (useMobileLayout) {
    return <Route path={path} component={Component} />;
  }

  // For desktop view, we wrap each component with MainLayout
  return (
    <Route path={path}>
      {(params) => (
        <MainLayout>
          <Component {...params} />
        </MainLayout>
      )}
    </Route>
  );
}
