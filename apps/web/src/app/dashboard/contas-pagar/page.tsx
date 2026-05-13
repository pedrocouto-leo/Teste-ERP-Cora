'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '../../../lib/api-client';

interface PayableTitle {
  id: string;
  titleNumber: string;
  installment: number | null;
  dueDate: string;
  originalAmount: number;
  balance: number;
  currencyCode: string;
  status: string;
  approvalStatus: string;
  supplier?: {
    name: string;
    cpfCnpj: string;
  };
}

const STATUS_LABELS: Record<string, string> = {
  '': 'Todos',
  OPEN: 'Em Aberto',
  PARTIAL: 'Parcial',
  PAID: 'Pago',
  OVERDUE: 'Vencido',
  CANCELLED: 'Cancelado',
};

const APPROVAL_LABELS: Record<string, string> = {
  '': 'Todos',
  PENDING: 'Pendente',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-700',
  PARTIAL: 'bg-yellow-100 text-yellow-700',
  PAID: 'bg-green-100 text-green-700',
  OVERDUE: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

const APPROVAL_BADGE_CLASSES: Record<string, string> = {
  PENDING: 'bg-orange-100 text-orange-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

function formatCurrency(value: number, currency = 'BRL') {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(value);
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR');
}

export default function ContasPagarListPage() {
  const [titles, setTitles] = useState<PayableTitle[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('');

  const fetchTitles = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        limit: 50,
        sortBy: 'dueDate',
        sortOrder: 'asc',
      };
      if (statusFilter) params.status = statusFilter;
      if (approvalFilter) params.approvalStatus = approvalFilter;
      const res = await api.get<{ data: PayableTitle[] }>('/contas-pagar/titles', params);
      setTitles(res.data);
    } catch (err) {
      console.error('Erro ao carregar contas a pagar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTitles();
  }, [statusFilter, approvalFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contas a Pagar</h1>
          <p className="text-gray-500 mt-1">Gestão de títulos a pagar e fornecedores</p>
        </div>
        <Link
          href="/dashboard/contas-pagar/novo"
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
        >
          Novo Título
        </Link>
      </div>

      {/* Status filter */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-500 uppercase">Status</p>
        <div className="flex flex-wrap gap-2">
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
      </div>

      {/* Approval filter */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-500 uppercase">Aprovação</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(APPROVAL_LABELS).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setApprovalFilter(value)}
              className={`px-3 py-1.5 text-xs rounded-md border ${
                approvalFilter === value
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : titles.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Nenhum título encontrado.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nº Título
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fornecedor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Vencimento
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Valor Original
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Saldo
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Aprovação
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {titles.map((title) => (
                <tr key={title.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    {title.titleNumber}
                    {title.installment != null && (
                      <span className="ml-1 text-gray-400">/{title.installment}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {title.supplier?.name ?? <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(title.dueDate)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 tabular-nums">
                    {formatCurrency(Number(title.originalAmount), title.currencyCode)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 tabular-nums">
                    {formatCurrency(Number(title.balance), title.currencyCode)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                        STATUS_BADGE_CLASSES[title.status] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {STATUS_LABELS[title.status] ?? title.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                        APPROVAL_BADGE_CLASSES[title.approvalStatus] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {APPROVAL_LABELS[title.approvalStatus] ?? title.approvalStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <Link
                      href={`/dashboard/contas-pagar/${title.id}`}
                      className="text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
