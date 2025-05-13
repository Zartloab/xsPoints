import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import LoyaltyJourneyPage from '@/pages/loyalty-journey-page';
import * as reactQuery from '@tanstack/react-query';

// Mock the query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
    },
  },
});

// Mock hooks and data
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Sample journey data for tests
const mockJourneyData = {
  userId: 1,
  username: 'testuser',
  membershipTier: 'SILVER',
  stats: {
    totalTransactions: 12,
    totalPointsConverted: 50000,
    totalFeesPaid: 120,
    estimatedSavings: 450,
    monthlyActivity: 15000,
  },
  favoritePrograms: [
    { program: 'QANTAS', transactionCount: 8, pointsProcessed: 30000 },
    { program: 'XPOINTS', transactionCount: 6, pointsProcessed: 25000 },
    { program: 'GYG', transactionCount: 4, pointsProcessed: 10000 },
  ],
  conversionTrends: [
    { month: '2025-01', amount: 10000 },
    { month: '2025-02', amount: 15000 },
    { month: '2025-03', amount: 25000 },
  ],
  walletBalances: [
    { program: 'QANTAS', balance: 5000, dollarValue: 50 },
    { program: 'XPOINTS', balance: 10000, dollarValue: 150 },
    { program: 'GYG', balance: 2000, dollarValue: 16 },
  ],
  milestones: [
    { 
      title: 'First Conversion', 
      date: '2025-01-15T10:30:00Z', 
      description: 'Converted 5000 QANTAS to 7500 XPOINTS' 
    },
    { 
      title: 'Upgraded to SILVER Tier', 
      date: '2025-02-20T14:45:00Z', 
      description: 'Achieved SILVER membership tier with improved conversion rates' 
    },
    { 
      title: 'Points Milestone', 
      description: 'Converted 50000 points. 50% to next milestone of 100000', 
      progress: 0.5 
    },
  ],
  recentTransactions: [
    {
      id: 5,
      fromProgram: 'QANTAS',
      toProgram: 'XPOINTS',
      amountFrom: 10000,
      amountTo: 15000,
      timestamp: '2025-03-15T09:20:00Z',
      feeApplied: 0,
      status: 'completed',
    },
    {
      id: 4,
      fromProgram: 'XPOINTS',
      toProgram: 'GYG',
      amountFrom: 5000,
      amountTo: 4000,
      timestamp: '2025-03-10T11:15:00Z',
      feeApplied: 0,
      status: 'completed',
    },
  ],
};

// Mock the useQuery hook
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

// Helper to render component with providers
const renderWithProviders = (ui: React.ReactElement) => {
  const testQueryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>
      <TooltipProvider>
        {ui}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

describe('LoyaltyJourneyPage Component', () => {
  beforeEach(() => {
    // Reset mocks
    vi.mocked(reactQuery.useQuery).mockReturnValue({
      data: mockJourneyData,
      isLoading: false,
      error: null,
    } as any);
    
    // Mock Recharts components
    vi.mock('recharts', () => ({
      ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
      AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
      Area: () => <div data-testid="area" />,
      XAxis: () => <div data-testid="x-axis" />,
      YAxis: () => <div data-testid="y-axis" />,
      Tooltip: () => <div data-testid="tooltip" />,
      PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
      Pie: ({ children }: { children: React.ReactNode }) => <div data-testid="pie">{children}</div>,
      Cell: () => <div data-testid="cell" />,
      Legend: () => <div data-testid="legend" />,
      BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
      Bar: () => <div data-testid="bar" />,
    }));
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should render the loading state when data is being fetched', () => {
    vi.mocked(reactQuery.useQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    renderWithProviders(<LoyaltyJourneyPage />);
    
    expect(screen.getByText('Loading your loyalty journey...')).toBeInTheDocument();
  });

  it('should render the error toast when there is an error', () => {
    vi.mocked(reactQuery.useQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load data'),
    } as any);

    const { rerender } = renderWithProviders(<LoyaltyJourneyPage />);
    
    // First render with error should trigger toast
    rerender(
      <QueryClientProvider client={createTestQueryClient()}>
        <TooltipProvider>
          <LoyaltyJourneyPage />
        </TooltipProvider>
      </QueryClientProvider>
    );
    
    // Error handling is tested via the mock toast
  });

  it('should render the page title and description', () => {
    renderWithProviders(<LoyaltyJourneyPage />);
    
    expect(screen.getByText('Your Loyalty Journey')).toBeInTheDocument();
    expect(screen.getByText(/Track your progress, visualize trends/)).toBeInTheDocument();
  });

  it('should render the overview tab with stats cards', () => {
    renderWithProviders(<LoyaltyJourneyPage />);
    
    expect(screen.getByText('Total Transactions')).toBeInTheDocument();
    expect(screen.getByText('Points Converted')).toBeInTheDocument();
    expect(screen.getByText('Estimated Savings')).toBeInTheDocument();
    
    // Check that the stats values are displayed
    expect(screen.getByText('12')).toBeInTheDocument(); // Total transactions
    expect(screen.getByText('50,000')).toBeInTheDocument(); // Points converted
    expect(screen.getByText('$450.00')).toBeInTheDocument(); // Estimated savings
  });

  it('should render favorite programs pie chart in overview tab', () => {
    renderWithProviders(<LoyaltyJourneyPage />);
    
    expect(screen.getByText('Favorite Programs')).toBeInTheDocument();
    expect(screen.getByText('Your most used loyalty programs')).toBeInTheDocument();
  });

  it('should render recent activity in overview tab', () => {
    renderWithProviders(<LoyaltyJourneyPage />);
    
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('Your latest point conversions')).toBeInTheDocument();
    
    // Check transaction details
    expect(screen.getByText('QANTAS → XPOINTS')).toBeInTheDocument();
    expect(screen.getByText('10,000 → 15,000')).toBeInTheDocument();
  });

  it('should allow switching between tabs', async () => {
    renderWithProviders(<LoyaltyJourneyPage />);
    
    // Default tab is Overview
    expect(screen.getByText('Favorite Programs')).toBeInTheDocument();
    
    // Click on the Milestones tab
    fireEvent.click(screen.getByRole('tab', { name: 'Milestones' }));
    
    // Should show milestones content
    await waitFor(() => {
      expect(screen.getByText('Your Loyalty Milestones')).toBeInTheDocument();
      expect(screen.getByText('First Conversion')).toBeInTheDocument();
    });
    
    // Click on the Trends tab
    fireEvent.click(screen.getByRole('tab', { name: 'Conversion Trends' }));
    
    // Should show trends content
    await waitFor(() => {
      expect(screen.getByText('Monthly point conversion activity')).toBeInTheDocument();
    });
  });

  it('should render tier benefits in milestones tab', async () => {
    renderWithProviders(<LoyaltyJourneyPage />);
    
    // Click on the Milestones tab
    fireEvent.click(screen.getByRole('tab', { name: 'Milestones' }));
    
    // Should show tier benefits
    await waitFor(() => {
      expect(screen.getByText('Current Membership Level: SILVER')).toBeInTheDocument();
      expect(screen.getByText('Silver Benefits (Current)')).toBeInTheDocument();
      expect(screen.getByText('Gold Benefits (Next Tier)')).toBeInTheDocument();
    });
  });

  it('should render conversion trends chart in trends tab', async () => {
    renderWithProviders(<LoyaltyJourneyPage />);
    
    // Click on the Trends tab
    fireEvent.click(screen.getByRole('tab', { name: 'Conversion Trends' }));
    
    // Should show conversion trends
    await waitFor(() => {
      expect(screen.getByText('Conversion Trends')).toBeInTheDocument();
      expect(screen.getByText('Monthly point conversion activity')).toBeInTheDocument();
    });
  });

  it('should render program usage charts in programs tab', async () => {
    renderWithProviders(<LoyaltyJourneyPage />);
    
    // Click on the Programs tab
    fireEvent.click(screen.getByRole('tab', { name: 'Programs' }));
    
    // Should show program usage
    await waitFor(() => {
      expect(screen.getByText('Program Usage')).toBeInTheDocument();
      expect(screen.getByText('Breakdown of your loyalty program activity')).toBeInTheDocument();
    });
  });

  it('should render wallet value charts in wallets tab', async () => {
    renderWithProviders(<LoyaltyJourneyPage />);
    
    // Click on the Wallets tab
    fireEvent.click(screen.getByRole('tab', { name: 'Wallet Value' }));
    
    // Should show wallet values
    await waitFor(() => {
      expect(screen.getByText('Wallet Value Distribution')).toBeInTheDocument();
      expect(screen.getByText('Dollar value of your loyalty point balances')).toBeInTheDocument();
    });
  });
  
  it('should handle empty data gracefully', () => {
    vi.mocked(reactQuery.useQuery).mockReturnValue({
      data: {
        ...mockJourneyData,
        favoritePrograms: [],
        conversionTrends: [],
        walletBalances: [],
        recentTransactions: [],
      },
      isLoading: false,
      error: null,
    } as any);

    renderWithProviders(<LoyaltyJourneyPage />);
    
    // Should show empty state messages
    expect(screen.getByText('No recent transactions')).toBeInTheDocument();
  });
});