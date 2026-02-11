'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Props {
  adminName: string;
  adminRole: string;
  canManageUsers: boolean;
}

export default function MobileNav({ adminName, adminRole, canManageUsers }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const roleDisplay = adminRole === 'super_admin' ? 'Super Admin' : adminRole === 'admin' ? 'Admin' : 'Viewer';

  return (
    <nav className="md:hidden bg-white shadow-sm">
      <div className="px-4 py-3">
        <div className="flex justify-between items-center">
          <img src="/cognitive-kin-logo.svg" alt="Cognitive Kin" className="h-8 w-auto" />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {isOpen && (
        <div className="border-t border-gray-200 py-2 px-4 space-y-1">
          <div className="py-2 px-3 text-sm text-gray-600 font-medium border-b border-gray-100 mb-2">
            {adminName} ({roleDisplay})
          </div>
          {canManageUsers && (
            <Link
              href="/admin/users"
              className="block py-2.5 px-3 text-purple-600 font-semibold rounded hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              Manage Users
            </Link>
          )}
          <Link
            href="/admin/settings"
            className="block py-2.5 px-3 text-gray-700 font-medium rounded hover:bg-gray-50"
            onClick={() => setIsOpen(false)}
          >
            Settings
          </Link>
          <Link
            href="/admin/help"
            className="block py-2.5 px-3 text-gray-700 font-medium rounded hover:bg-gray-50"
            onClick={() => setIsOpen(false)}
          >
            Help
          </Link>
          <form action="/api/admin/auth/logout" method="POST" className="pt-2 border-t border-gray-100 mt-2">
            <button
              type="submit"
              className="w-full text-left py-2.5 px-3 text-blue-600 font-medium rounded hover:bg-gray-50"
            >
              Logout
            </button>
          </form>
        </div>
      )}
    </nav>
  );
}
