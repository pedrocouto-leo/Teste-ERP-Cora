'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../../lib/api-client';

export default function NovoContaReceberPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [clientId, setClientId] = useState('');
  const [titleNumber, setTitleNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [originalAmount, setOriginalAmount] = useState('');
  const [description, setDescription] = useState('');
  const [nfNumber, setNfNumber] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post<{ data: { id: string } }>('/contas-receber/titles', {
        clientId: clientId || undefined,
        titleNumber,
        issueDate,
        dueDate,
        originalAmount: parseFloat(originalAmount),
        description: description || undefined,
        nfNumber: nfNumber || undefined,
      });
      router.push(`/dashboard/contas-receber/${res.data.id}`);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar título');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-700 mb-1"
        >
          &larr; Voltar
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Novo Título a Receber</h1>
        <p className="text-gray-500 mt-1">Registrar um novo título no contas a receber</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ID do Cliente
          </label>
          <input
            type="text"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="UUID do cliente"
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número do Título *
          </label>
          <input
            type="text"
            value={titleNumber}
            onChange={(e) => setTitleNumber(e.target.value)}
            required
            placeholder="Ex: NF-001"
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Emissão *
            </label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Vencimento *
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valor Original (R$) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={originalAmount}
            onChange={(e) => setOriginalAmount(e.target.value)}
            required
            placeholder="0,00"
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descrição
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Descrição do título..."
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número NF
          </label>
          <input
            type="text"
            value={nfNumber}
            onChange={(e) => setNfNumber(e.target.value)}
            placeholder="Ex: 12345"
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Criar Título'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
