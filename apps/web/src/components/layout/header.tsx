'use client';

import { useAuth } from '@/contexts/auth-context';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Sistema de Gestão Financeira
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <>
            <span className="text-sm text-gray-600">{user.name}</span>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-red-600 transition"
            >
              Sair
            </button>
          </>
        )}
      </div>
    </header>
  );
}
