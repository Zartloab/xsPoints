import { Router, Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { LoyaltyProgram } from '@shared/schema';

// API key validation middleware
function validateApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key is required' });
  }
  
  // In a production environment, we would validate the API key against a database
  // For now, we'll accept any non-empty API key for development
  if (typeof apiKey !== 'string' || apiKey.length < 8) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  next();
}

// Rate limiting middleware (simple implementation)
const requestCounts = new Map<string, { count: number, resetTime: number }>();
function rateLimit(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;
  const now = Date.now();
  const limit = 100; // requests per window
  const windowMs = 60 * 60 * 1000; // 1 hour
  
  const current = requestCounts.get(apiKey) || { count: 0, resetTime: now + windowMs };
  
  // Reset counter if the window has passed
  if (now > current.resetTime) {
    current.count = 0;
    current.resetTime = now + windowMs;
  }
  
  current.count++;
  requestCounts.set(apiKey, current);
  
  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', limit.toString());
  res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - current.count).toString());
  res.setHeader('X-RateLimit-Reset', Math.ceil(current.resetTime / 1000).toString());
  
  if (current.count > limit) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  
  next();
}

// Create API router
const apiRouter = Router();

// Apply API key validation and rate limiting to all API routes
apiRouter.use(validateApiKey);
apiRouter.use(rateLimit);

// API endpoints
apiRouter.get('/exchange-rates', async (req, res) => {
  try {
    const from = req.query.from as LoyaltyProgram;
    const to = req.query.to as LoyaltyProgram;
    
    if (from && to) {
      const rate = await storage.getExchangeRate(from, to);
      if (!rate) {
        return res.status(404).json({ error: 'Exchange rate not found' });
      }
      return res.json(rate);
    }
    
    // Get all exchange rates
    const rates = [];
    const programs: LoyaltyProgram[] = ['QANTAS', 'GYG', 'XPOINTS', 'VELOCITY', 'AMEX', 'FLYBUYS', 'HILTON', 'MARRIOTT', 'AIRBNB', 'DELTA'];
    
    for (const fromProgram of programs) {
      for (const toProgram of programs) {
        if (fromProgram !== toProgram) {
          const rate = await storage.getExchangeRate(fromProgram, toProgram);
          if (rate) {
            rates.push(rate);
          }
        }
      }
    }
    
    return res.json(rates);
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tier benefits
apiRouter.get('/tier-benefits/:tier', async (req, res) => {
  try {
    const tierSchema = z.enum(['STANDARD', 'SILVER', 'GOLD', 'PLATINUM']);
    const result = tierSchema.safeParse(req.params.tier);
    
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid tier' });
    }
    
    const benefits = await storage.getTierBenefits(result.data);
    if (!benefits) {
      return res.status(404).json({ error: 'Tier benefits not found' });
    }
    
    return res.json(benefits);
  } catch (error) {
    console.error('Error fetching tier benefits:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get market trends (mock data for now)
apiRouter.get('/market-trends', (req, res) => {
  try {
    const daysStr = req.query.days;
    const days = daysStr ? parseInt(daysStr as string) : 30;
    
    if (isNaN(days) || days < 1 || days > 365) {
      return res.status(400).json({ error: 'Days parameter must be between 1 and 365' });
    }
    
    const trends = generateMarketTrends(days);
    return res.json(trends);
  } catch (error) {
    console.error('Error fetching market trends:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to generate mock market trends
function generateMarketTrends(days: number) {
  const trends = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const baseXpoints = 0.5 + Math.random() * 0.2; // 0.5-0.7
    const baseQantas = 0.8 + Math.random() * 0.4; // 0.8-1.2
    const baseGyg = 1.2 + Math.random() * 0.6; // 1.2-1.8
    
    trends.push({
      timestamp: date.toISOString(),
      xpointsRate: Number(baseXpoints.toFixed(4)),
      qantasRate: Number(baseQantas.toFixed(4)),
      gygRate: Number(baseGyg.toFixed(4)),
      volume: Math.floor(50000 + Math.random() * 200000)
    });
  }
  
  return trends;
}

// API documentation
apiRouter.get('/', (req, res) => {
  res.json({
    name: 'xPoints Exchange API',
    version: '1.0.0',
    description: 'API for accessing xPoints Exchange data',
    endpoints: [
      {
        path: '/api/v1/exchange-rates',
        method: 'GET',
        description: 'Get all exchange rates or specific rate by from/to query parameters',
        params: [
          { name: 'from', type: 'string', description: 'Source loyalty program (optional)' },
          { name: 'to', type: 'string', description: 'Destination loyalty program (optional)' }
        ]
      },
      {
        path: '/api/v1/tier-benefits/:tier',
        method: 'GET',
        description: 'Get benefits for a specific membership tier',
        params: [
          { name: 'tier', type: 'string', description: 'Membership tier (STANDARD, SILVER, GOLD, PLATINUM)' }
        ]
      },
      {
        path: '/api/v1/market-trends',
        method: 'GET',
        description: 'Get market trend data for exchange rates',
        params: [
          { name: 'days', type: 'number', description: 'Number of days of data to return (default: 30, max: 365)' }
        ]
      }
    ],
    authentication: 'API key required in X-API-Key header'
  });
});

export default apiRouter;