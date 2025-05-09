import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../client/src/lib/queryClient';
import ConversionForm from '../../client/src/components/transaction/ConversionForm';
import { AuthProvider } from '../../client/src/hooks/use-auth';

// Mock the required providers
vi.mock('../../client/src/hooks/use-auth', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    user: { id: 1, username: 'testuser' },
    isLoading: false,
    error: null
  })
}));

// Mock the toast component
vi.mock('../../client/src/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('ConversionForm Component', () => {
  beforeEach(() => {
    // Reset the queryClient before each test
    queryClient.clear();
  });

  it('renders the conversion form correctly', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ConversionForm userWallets={[
            { id: 1, userId: 1, program: 'QANTAS', balance: 10000, accountNumber: 'QF123456', accountName: 'Test User', createdAt: new Date() },
            { id: 2, userId: 1, program: 'XPOINTS', balance: 5000, accountNumber: null, accountName: null, createdAt: new Date() }
          ]} />
        </AuthProvider>
      </QueryClientProvider>
    );

    // Check for form elements
    expect(screen.getByText(/Convert Points/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/From/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/To/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Amount/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Convert/i })).toBeInTheDocument();
  });

  it('validates form inputs correctly', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ConversionForm userWallets={[
            { id: 1, userId: 1, program: 'QANTAS', balance: 10000, accountNumber: 'QF123456', accountName: 'Test User', createdAt: new Date() },
            { id: 2, userId: 1, program: 'XPOINTS', balance: 5000, accountNumber: null, accountName: null, createdAt: new Date() }
          ]} />
        </AuthProvider>
      </QueryClientProvider>
    );

    // Try to submit without selecting programs
    const submitButton = screen.getByRole('button', { name: /Convert/i });
    fireEvent.click(submitButton);

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/Please select a source program/i)).toBeInTheDocument();
      expect(screen.getByText(/Please select a destination program/i)).toBeInTheDocument();
      expect(screen.getByText(/Please enter an amount/i)).toBeInTheDocument();
    });
  });

  it('calculates conversion rate correctly', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ConversionForm userWallets={[
            { id: 1, userId: 1, program: 'QANTAS', balance: 10000, accountNumber: 'QF123456', accountName: 'Test User', createdAt: new Date() },
            { id: 2, userId: 1, program: 'GYG', balance: 5000, accountNumber: 'GYG789012', accountName: 'Test User', createdAt: new Date() },
            { id: 3, userId: 1, program: 'XPOINTS', balance: 5000, accountNumber: null, accountName: null, createdAt: new Date() }
          ]} />
        </AuthProvider>
      </QueryClientProvider>
    );

    // Select source and destination programs
    const fromSelect = screen.getByLabelText(/From/i);
    const toSelect = screen.getByLabelText(/To/i);
    const amountInput = screen.getByLabelText(/Amount/i);

    fireEvent.change(fromSelect, { target: { value: 'QANTAS' } });
    fireEvent.change(toSelect, { target: { value: 'GYG' } });
    fireEvent.change(amountInput, { target: { value: '5000' } });

    // Should show the conversion results
    await waitFor(() => {
      expect(screen.getByText(/Conversion Summary/i)).toBeInTheDocument();
    });
  });
});