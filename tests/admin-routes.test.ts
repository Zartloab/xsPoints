import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setupAuth, ensureAdmin } from '../server/auth';
import express, { Request, Response, NextFunction } from 'express';
import { User } from '../shared/schema';

// Mock storage
vi.mock('../server/storage', () => ({
  storage: {
    getUserByUsername: vi.fn(),
    getUser: vi.fn(),
  },
}));

// Mock session
vi.mock('express-session', () => {
  return () => (req: any, res: any, next: any) => {
    req.session = {};
    next();
  };
});

// Mock passport
vi.mock('passport', () => ({
  default: {
    initialize: vi.fn(() => (req: any, res: any, next: any) => next()),
    session: vi.fn(() => (req: any, res: any, next: any) => next()),
    authenticate: vi.fn(() => (req: any, res: any, next: any) => next()),
    use: vi.fn(),
    serializeUser: vi.fn((fn) => fn),
    deserializeUser: vi.fn((fn) => fn),
  },
}));

describe('Admin Authentication Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = vi.fn();

  beforeEach(() => {
    mockRequest = {
      isAuthenticated: vi.fn(),
      user: undefined,
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    nextFunction = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should deny access when user is not authenticated', () => {
    mockRequest.isAuthenticated = vi.fn().mockReturnValue(false);

    ensureAdmin(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Not authenticated' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should deny access when user is not an admin', () => {
    mockRequest.isAuthenticated = vi.fn().mockReturnValue(true);
    mockRequest.user = { username: 'regular-user' } as User;

    ensureAdmin(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Not authorized, admin access required' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should allow access when user is an admin', () => {
    mockRequest.isAuthenticated = vi.fn().mockReturnValue(true);
    mockRequest.user = { username: 'admin' } as User;

    ensureAdmin(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });
});