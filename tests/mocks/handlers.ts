import { rest } from 'msw';
import { LoyaltyProgram, MembershipTier } from '@shared/schema';

// Mock data
const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  pointsConverted: 25000,
  feesPaid: 50,
  monthlyPoints: 8000,
  tier: 'SILVER' as MembershipTier
};

const mockWallets = [
  {
    id: 1,
    userId: 1,
    program: 'QANTAS' as LoyaltyProgram,
    balance: 25000,
    accountNumber: 'QF123456',
    accountName: 'Test User',
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    userId: 1,
    program: 'GYG' as LoyaltyProgram,
    balance: 5000,
    accountNumber: 'GYG789012',
    accountName: 'Test User',
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    userId: 1,
    program: 'XPOINTS' as LoyaltyProgram,
    balance: 10000,
    accountNumber: null,
    accountName: null,
    createdAt: new Date().toISOString()
  }
];

const mockTransactions = [
  {
    id: 1,
    userId: 1,
    fromProgram: 'QANTAS' as LoyaltyProgram,
    toProgram: 'XPOINTS' as LoyaltyProgram,
    fromAmount: 10000,
    toAmount: 5000,
    fee: 0,
    status: 'COMPLETED',
    timestamp: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 2,
    userId: 1,
    fromProgram: 'XPOINTS' as LoyaltyProgram,
    toProgram: 'GYG' as LoyaltyProgram,
    fromAmount: 2000,
    toAmount: 2500,
    fee: 0,
    status: 'COMPLETED',
    timestamp: new Date().toISOString()
  }
];

const mockExchangeRates = [
  {
    id: 1,
    fromProgram: 'QANTAS' as LoyaltyProgram,
    toProgram: 'XPOINTS' as LoyaltyProgram,
    rate: '0.5',
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    fromProgram: 'XPOINTS' as LoyaltyProgram,
    toProgram: 'GYG' as LoyaltyProgram,
    rate: '1.25',
    updatedAt: new Date().toISOString()
  },
  {
    id: 3,
    fromProgram: 'GYG' as LoyaltyProgram,
    toProgram: 'XPOINTS' as LoyaltyProgram,
    rate: '0.8',
    updatedAt: new Date().toISOString()
  }
];

const mockTradeOffers = [
  {
    id: 1,
    createdBy: 2,
    fromProgram: 'VELOCITY' as LoyaltyProgram,
    toProgram: 'AMEX' as LoyaltyProgram,
    fromAmount: 15000,
    toAmount: 12000,
    status: 'OPEN',
    createdAt: new Date().toISOString()
  }
];

export const handlers = [
  // Auth handlers
  rest.get('/api/user', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockUser));
  }),
  
  rest.post('/api/login', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockUser));
  }),
  
  rest.post('/api/logout', (req, res, ctx) => {
    return res(ctx.status(200));
  }),
  
  rest.post('/api/register', (req, res, ctx) => {
    return res(ctx.status(201), ctx.json(mockUser));
  }),
  
  // Wallet handlers
  rest.get('/api/wallets', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockWallets));
  }),
  
  rest.post('/api/wallet/link', (req, res, ctx) => {
    const { program, accountNumber, accountName } = req.body as any;
    const wallet = {
      id: mockWallets.length + 1,
      userId: 1,
      program,
      balance: 0,
      accountNumber,
      accountName,
      createdAt: new Date().toISOString()
    };
    
    return res(ctx.status(201), ctx.json(wallet));
  }),
  
  // Transaction handlers
  rest.get('/api/transactions', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockTransactions));
  }),
  
  rest.post('/api/convert', (req, res, ctx) => {
    const { fromProgram, toProgram, amount } = req.body as any;
    
    // Find exchange rates
    const fromRate = mockExchangeRates.find(r => 
      r.fromProgram === fromProgram && r.toProgram === 'XPOINTS');
    const toRate = mockExchangeRates.find(r => 
      r.fromProgram === 'XPOINTS' && r.toProgram === toProgram);
    
    if (!fromRate || !toRate) {
      return res(ctx.status(400), ctx.json({ message: 'Invalid conversion path' }));
    }
    
    const xpointsAmount = amount * parseFloat(fromRate.rate);
    const toAmount = xpointsAmount * parseFloat(toRate.rate);
    
    const transaction = {
      id: mockTransactions.length + 1,
      userId: 1,
      fromProgram,
      toProgram,
      fromAmount: amount,
      toAmount,
      fee: 0,
      status: 'COMPLETED',
      timestamp: new Date().toISOString()
    };
    
    return res(ctx.status(200), ctx.json({ transaction }));
  }),
  
  // Exchange rate handlers
  rest.get('/api/exchange-rates', (req, res, ctx) => {
    const from = req.url.searchParams.get('from');
    const to = req.url.searchParams.get('to');
    
    if (from && to) {
      const rate = mockExchangeRates.find(r => r.fromProgram === from && r.toProgram === to);
      if (rate) {
        return res(ctx.status(200), ctx.json(rate));
      }
      return res(ctx.status(404), ctx.json({ message: 'Rate not found' }));
    }
    
    return res(ctx.status(200), ctx.json(mockExchangeRates));
  }),
  
  // Trading handlers
  rest.get('/api/trades', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockTradeOffers));
  }),
  
  rest.get('/api/trades/my-offers', (req, res, ctx) => {
    // Return only offers created by the user
    const myOffers = mockTradeOffers.filter(offer => offer.createdBy === mockUser.id);
    return res(ctx.status(200), ctx.json(myOffers));
  }),
  
  rest.post('/api/trades', (req, res, ctx) => {
    const { fromProgram, toProgram, fromAmount, toAmount } = req.body as any;
    
    const offer = {
      id: mockTradeOffers.length + 1,
      createdBy: mockUser.id,
      fromProgram,
      toProgram,
      fromAmount,
      toAmount,
      status: 'OPEN',
      createdAt: new Date().toISOString()
    };
    
    return res(ctx.status(201), ctx.json(offer));
  }),
  
  rest.post('/api/trades/:id/accept', (req, res, ctx) => {
    const { id } = req.params;
    
    return res(ctx.status(200), ctx.json({ 
      message: 'Trade accepted successfully',
      tradeId: id
    }));
  })
];