'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '../../../lib/api-client';

interface ReceivableTitle {
  id: string;
  titleNumber: string;
  installment: string | null;
  issueDate: string;
  dueDate: string;
  originalAmount: number;
  netAmount: number;
  receivedAmount: number;
  balance: number;
  status: string;
  description: string | null;
  nfNumber: string | null;
  client: {
    name: string;
    cpfCnpj: string;
  } | null;
}

const STATUS_LABELS: Record<string, string> = {
  '': 'Todos',
  OPEN: 'Em Aberto',
  PARTIAL: 'Parcial',
  PAID: 'Recebido',
  OVERDUE: 'Vencido',
  NEGOTIATED: 'Negociado',
  CANCELLED: 'Cancelado',
};

const STATUS_BADGE: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-700',
  PARTIAL: 'bg-yellow-100 text-yellow-700',
  PAID: 'bg-green-100 text-green-700',
  OVERDUE: 'bg-red-100 text-red-700',
  NEGOTIATED: 'bg-purple-100 text-purple-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function ContasReceberListPage() {
  const [titles, setTitles] = useState<ReceivableTitle[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchTitles = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { limit: 50 };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get<{ data: ReceivableTitle[] }>('/contas-receber/titles', params);
      setTitles(res.data);
    } catch (err) {
      console.error('Erro ao carregar contas a receber:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTitles();
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contas a Receber</h1>
          <p className="text-gray-500 mt-1">Gerencie os títulos a receber</p>
        </div>
        <Link
          href="/dashboard/contas-receber/novo"
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
        >
          Novo Título
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className={`px-3 py-1.5 text-xs rounded-md border ${
              statusFilter === value
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : titles.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Nenhum título encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nº Título</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor Original</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Recebido</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saldo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {titles.map((title) => (
                  <tr key={title.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono text-gray-900">
                      {title.titleNumber}
                      {title.installment && (
                        <span className="ml-1 text-gray-400">/{title.installment}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {title.client ? (
                        <div>
                          <p className="font-medium">{title.client.name}</p>
                          <p className="text-xs text-gray-500">{title.client.cpfCnpj}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatDate(title.dueDate)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 font-mono">
                      {formatBRL(Number(title.originalAmount))}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700 font-mono">
                      {formatBRL(Number(title.receivedAmount))}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono font-medium text-gray-900">
                      {formatBRL(Number(title.balance))}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[title.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[title.status] ?? title.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <Link
                        href={`/dashboard/contas-receber/${title.id}`}
                        className="text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Abrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
