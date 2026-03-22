'use client';

import { useState } from 'react';

interface EntryFormProps {
  onSubmit: (data: {
    accountCode: string;
    currencyCode?: string;
    countryCode?: string;
    positionType?: number;
    value: number;
  }) => void;
  loading?: boolean;
}

export function DdrEntryForm({ onSubmit, loading }: EntryFormProps) {
  const [accountCode, setAccountCode] = useState('');
  const [currencyCode, setCurrencyCode] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [positionType, setPositionType] = useState('');
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      accountCode,
      currencyCode: currencyCode || undefined,
      countryCode: countryCode || undefined,
      positionType: positionType ? parseInt(positionType) : undefined,
      value: parseFloat(value),
    });
    setValue('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg border">
      <h3 className="font-semibold text-gray-700 mb-3">Novo Lançamento</h3>
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Conta *</label>
          <input
            type="text"
            value={accountCode}
            onChange={(e) => setAccountCode(e.target.value)}
            placeholder="111000"
            maxLength={6}
            required
            className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Moeda (Elem. 83)</label>
          <input
            type="text"
            value={currencyCode}
            onChange={(e) => setCurrencyCode(e.target.value)}
            placeholder="220"
            maxLength={3}
            className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">País (Elem. 81)</label>
          <input
            type="text"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            placeholder="US"
            maxLength={2}
            className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Posição (Elem. 84)</label>
          <select
            value={positionType}
            onChange={(e) => setPositionType(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">-</option>
            <option value="1">1 - País</option>
            <option value="2">2 - Exterior</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Valor (R$) *</label>
          <input
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0.00"
            required
            className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            Adicionar
          </button>
        </div>
      </div>
    </form>
  );
}
