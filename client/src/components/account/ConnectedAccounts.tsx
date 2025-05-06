import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { Wallet } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import ProgramIcon from '../loyaltyprograms/ProgramIcon';
import { Pencil, Trash, ShoppingCart, Plane, Tag, MoreHorizontal } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export default function ConnectedAccounts() {
  const { user } = useAuth();
  
  const { data: wallets, isLoading } = useQuery<Wallet[]>({
    queryKey: ['/api/wallets'],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });
  
  // Get only connected wallets (with account numbers)
  const connectedWallets = wallets?.filter(wallet => 
    wallet.accountNumber && wallet.program !== 'XPOINTS'
  ) || [];

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-700 mb-4">Connected Programs</h3>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : connectedWallets.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-gray-200 rounded-lg">
          <p className="text-sm text-gray-500">No loyalty programs connected yet.</p>
          <p className="text-xs text-gray-400 mt-1">Use the form to link your accounts.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {connectedWallets.map((wallet) => (
            <div key={wallet.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <ProgramIcon program={wallet.program} className="w-10 h-10" />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">
                      {wallet.program === 'QANTAS' ? 'Qantas Frequent Flyer' : 'Guzman y Gomez Loyalty'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {/* Display partially masked account number */}
                      {wallet.accountNumber ? 
                        `XXXX-XXXX-${wallet.accountNumber.slice(-4)}` : 
                        'No account number'
                      }
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="text-gray-400 hover:text-gray-500">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button className="text-gray-400 hover:text-red-500">
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Available Programs</h3>
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                <ShoppingCart className="text-white h-4 w-4" />
              </div>
              <div className="ml-2 text-xs text-gray-700">Woolworths Rewards</div>
            </div>
            
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <Plane className="text-white h-4 w-4" />
              </div>
              <div className="ml-2 text-xs text-gray-700">Virgin Velocity</div>
            </div>
            
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                <Tag className="text-white h-4 w-4" />
              </div>
              <div className="ml-2 text-xs text-gray-700">Flybuys</div>
            </div>
            
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                <MoreHorizontal className="text-white h-4 w-4" />
              </div>
              <div className="ml-2 text-xs text-gray-700">More coming soon</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
