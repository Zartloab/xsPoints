import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../client/src/lib/queryClient';
import { AuthProvider, useAuth } from '../../client/src/hooks/use-auth';

// Wrap the hook with necessary providers
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>{children}</AuthProvider>
  </QueryClientProvider>
);

describe('useAuth Hook', () => {
  beforeEach(() => {
    // Reset the queryClient before each test
    queryClient.clear();
    
    // Mock the fetch API to return the expected user data
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url === '/api/user') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User'
          })
        });
      }
      
      if (url === '/api/login') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User'
          })
        });
      }
      
      if (url === '/api/logout') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({})
        });
      }
      
      return Promise.reject(new Error(`Unknown URL: ${url}`));
    });
  });
  
  it('fetches user data on initial load', async () => {
    const { result, waitFor } = renderHook(() => useAuth(), { wrapper });
    
    // Initially, user should be null and isLoading should be true
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBeTruthy();
    
    // Wait for the user data to be loaded
    await waitFor(() => expect(result.current.isLoading).toBeFalsy());
    
    // After loading, user should be defined and isLoading should be false
    expect(result.current.user).toBeDefined();
    expect(result.current.user?.username).toBe('testuser');
    expect(result.current.isLoading).toBeFalsy();
  });
  
  it('handles login correctly', async () => {
    const { result, waitFor } = renderHook(() => useAuth(), { wrapper });
    
    // Wait for the initial loading to complete
    await waitFor(() => expect(result.current.isLoading).toBeFalsy());
    
    // Perform login action
    await act(async () => {
      await result.current.loginMutation.mutateAsync({
        username: 'testuser',
        password: 'password'
      });
    });
    
    // Check if the user data is updated correctly
    expect(result.current.user).toBeDefined();
    expect(result.current.user?.username).toBe('testuser');
  });
  
  it('handles logout correctly', async () => {
    const { result, waitFor } = renderHook(() => useAuth(), { wrapper });
    
    // Wait for the initial loading to complete
    await waitFor(() => expect(result.current.isLoading).toBeFalsy());
    
    // Perform logout action
    await act(async () => {
      await result.current.logoutMutation.mutateAsync();
    });
    
    // After logout, user should be null
    expect(result.current.user).toBeNull();
  });
});