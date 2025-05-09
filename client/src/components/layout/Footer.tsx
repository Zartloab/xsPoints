import React from 'react';
import { Link } from 'wouter';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 hidden md:block">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <p className="ml-2 text-sm text-gray-500">© 2023 xPoints Exchange. All rights reserved.</p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-gray-500 hover:text-gray-900">
                <span className="text-sm">Privacy</span>
              </Link>
              <Link href="/terms" className="text-gray-500 hover:text-gray-900">
                <span className="text-sm">Terms</span>
              </Link>
              <Link href="/support" className="text-gray-500 hover:text-gray-900">
                <span className="text-sm">Support</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
