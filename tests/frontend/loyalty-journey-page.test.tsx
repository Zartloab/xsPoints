import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import LoyaltyJourneyPage from '../../client/src/pages/loyalty-journey-page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../../client/src/hooks/use-toast';

// Mock the react-query hooks
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

// Mock Recharts components
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area"></div>,
  XAxis: () => <div data-testid="x-axis"></div>,
  YAxis: () => <div data-testid="y-axis"></div>,
  Tooltip: () => <div data-testid="tooltip"></div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie"></div>,
  Legend: () => <div data-testid="legend"></div>,
  Cell: () => <div data-testid="cell"></div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar"></div>,
}));

// Mock react-helmet
vi.mock('react-helmet', () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => <div data-testid="helmet">{children}</div>,
}));

// Sample test data
const mockJourneyData = {
  userId: 1,
  username: 'testuser',
  membershipTier: 'STANDARD',
  stats: {
    totalTransactions: 10,
    totalPointsConverted: 50000,
    totalFeesPaid: 250,
    estimatedSavings: 500,
    monthlyActivity: 5000,
  },
  favoritePrograms: [
    { program: 'QANTAS', transactionCount: 5, pointsProcessed: 25000 },
    { program: 'XPOINTS', transactionCount: 8, pointsProcessed: 40000 },
    { program: 'GYG', transactionCount: 3, pointsProcessed: 15000 },
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
      date: '2025-01-15T00:00:00.000Z',
      description: 'Converted 10000 QANTAS to 15000 XPOINTS',
    },
    {
      title: 'Points Milestone',
      description: 'Converted 50000 points. 50% to next milestone of 100000',
      progress: 0.5,
    },
  ],
  recentTransactions: [
    {
      id: 1,
      fromProgram: 'QANTAS',
      toProgram: 'XPOINTS',
      amountFrom: 10000,
      amountTo: 15000,
      timestamp: '2025-03-15T00:00:00.000Z',
      feeApplied: 0,
      status: 'completed',
    },
    {
      id: 2,
      fromProgram: 'XPOINTS',
      toProgram: 'GYG',
      amountFrom: 5000,
      amountTo: 4000,
      timestamp: '2025-03-20T00:00:00.000Z',
      feeApplied: 0,
      status: 'completed',
    },
  ],
};

describe('LoyaltyJourneyPage Component', () => {
  let queryClient: QueryClient;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    
    // Mock successful data fetch
    vi.mocked(QueryClientProvider).mockImplementation(({ children }) => <>{children}</>);
    vi.spyOn(require('@tanstack/react-query'), 'useQuery').mockReturnValue({
      data: mockJourneyData,
      isLoading: false,
      error: null,
    });
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  it('should render the loyalty journey page correctly with data', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <LoyaltyJourneyPage />
        </ToastProvider>
      </QueryClientProvider>
    );
    
    // Check that the page title is rendered
    expect(screen.getByText('Your Loyalty Journey')).toBeInTheDocument();
    
    // Check that the tabs are rendered
    expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /milestones/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /conversion trends/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /programs/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /wallet value/i })).toBeInTheDocument();
    
    // Check that the stats are displayed
    expect(screen.getByText('Total Transactions')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Points Converted')).toBeInTheDocument();
    expect(screen.getByText('50,000')).toBeInTheDocument();
    
    // Check for recent transactions
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('QANTAS → XPOINTS')).toBeInTheDocument();
    expect(screen.getByText('XPOINTS → GYG')).toBeInTheDocument();
  });
  
  it('should show loading state when data is loading', async () => {
    vi.spyOn(require('@tanstack/react-query'), 'useQuery').mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });
    
    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <LoyaltyJourneyPage />
        </ToastProvider>
      </QueryClientProvider>
    );
    
    expect(screen.getByText('Loading your loyalty journey...')).toBeInTheDocument();
  });
  
  it('should show error toast when data fetch fails', async () => {
    const mockError = new Error('Failed to fetch journey data');
    
    vi.spyOn(require('@tanstack/react-query'), 'useQuery').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
    });
    
    const mockToast = vi.fn();
    vi.mock('../../client/src/hooks/use-toast', () => ({
      useToast: () => ({ toast: mockToast }),
      ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    }));
    
    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <LoyaltyJourneyPage />
        </ToastProvider>
      </QueryClientProvider>
    );
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Error loading journey data',
        variant: 'destructive',
      }));
    });
  });
  
  it('should switch tabs when a tab is clicked', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <LoyaltyJourneyPage />
        </ToastProvider>
      </QueryClientProvider>
    );
    
    // Default tab should be overview
    expect(screen.getByText('Favorite Programs')).toBeInTheDocument();
    
    // Click on milestones tab
    fireEvent.click(screen.getByRole('tab', { name: /milestones/i }));
    
    // Check that milestones content is shown
    expect(screen.getByText('Your Loyalty Milestones')).toBeInTheDocument();
    expect(screen.getByText('Track your achievements and progress')).toBeInTheDocument();
    
    // Click on trends tab
    fireEvent.click(screen.getByRole('tab', { name: /conversion trends/i }));
    
    // Check that trends content is shown
    expect(screen.getByText('Conversion Trends')).toBeInTheDocument();
    expect(screen.getByText('Monthly point conversion activity')).toBeInTheDocument();
  });
  
  it('should display membership tier information correctly', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <LoyaltyJourneyPage />
        </ToastProvider>
      </QueryClientProvider>
    );
    
    // Go to the milestones tab
    fireEvent.click(screen.getByRole('tab', { name: /milestones/i }));
    
    // Check for tier information
    expect(screen.getByText('Current Membership Level: STANDARD')).toBeInTheDocument();
    expect(screen.getByText('Standard Benefits')).toBeInTheDocument();
    expect(screen.getByText('Silver Benefits (Next Tier)')).toBeInTheDocument();
    expect(screen.getByText('Basic conversion rates')).toBeInTheDocument();
  });
  
  it('should display wallet balances correctly', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <LoyaltyJourneyPage />
        </ToastProvider>
      </QueryClientProvider>
    );
    
    // Go to the wallets tab
    fireEvent.click(screen.getByRole('tab', { name: /wallet value/i }));
    
    // Check for wallet information
    expect(screen.getByText('Wallet Value Distribution')).toBeInTheDocument();
    expect(screen.getByText('Dollar value of your loyalty point balances')).toBeInTheDocument();
    
    // Should show all wallet balances
    expect(screen.getByText('QANTAS')).toBeInTheDocument();
    expect(screen.getByText('XPOINTS')).toBeInTheDocument();
    expect(screen.getByText('GYG')).toBeInTheDocument();
    
    // Should show balance amounts
    expect(screen.getByText('5,000 points')).toBeInTheDocument();
    expect(screen.getByText('10,000 points')).toBeInTheDocument();
    expect(screen.getByText('2,000 points')).toBeInTheDocument();
  });
  
  it('should display program usage data correctly', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <LoyaltyJourneyPage />
        </ToastProvider>
      </QueryClientProvider>
    );
    
    // Go to the programs tab
    fireEvent.click(screen.getByRole('tab', { name: /programs/i }));
    
    // Check for program information
    expect(screen.getByText('Program Usage')).toBeInTheDocument();
    expect(screen.getByText('Breakdown of your loyalty program activity')).toBeInTheDocument();
    
    // Should show all programs
    expect(screen.getAllByText('QANTAS').length).toBeGreaterThan(0);
    expect(screen.getAllByText('XPOINTS').length).toBeGreaterThan(0);
    expect(screen.getAllByText('GYG').length).toBeGreaterThan(0);
    
    // Should show program recommendations
    expect(screen.getByText('Program Recommendations')).toBeInTheDocument();
    expect(screen.getByText('Personalized suggestions based on your activity')).toBeInTheDocument();
  });
});