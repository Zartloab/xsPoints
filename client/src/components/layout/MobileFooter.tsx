import React from 'react';
import { Link } from 'wouter';

export default function MobileFooter() {
  return (
    <div className="md:hidden px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-center">
      <div className="flex justify-center space-x-4">
        <Link href="/privacy" className="text-gray-500 hover:text-gray-900">
          Privacy
        </Link>
        <Link href="/terms" className="text-gray-500 hover:text-gray-900">
          Terms
        </Link>
        <Link href="/rate-verification" className="text-gray-500 hover:text-gray-900">
          Rate Verification
        </Link>
        <Link href="/support" className="text-gray-500 hover:text-gray-900">
          Support
        </Link>
      </div>
      <div className="mt-1 text-gray-400">
        © 2023 xPoints Exchange
      </div>
    </div>
  );
}