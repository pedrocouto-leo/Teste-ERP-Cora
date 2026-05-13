'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import api from '../../../../lib/api-client';

interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  type: string;
  status: string;
  totalDebit: number;
  totalCredit: number;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Rascunho', color: 'bg-gray-100 text-gray-700' },
  PENDING: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700' },
  APPROVED: { label: 'Aprovado', color: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Rejeitado', color: 'bg-red-100 text-red-700' },
};

const typeLabels: Record<string, string> = {
  MANUAL: 'Manual',
  AUTO: 'Automático',
  TEMPLATE: 'Template',
};

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? { label: status, color: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

const STATUS_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'DRAFT', label: 'Rascunho' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'APPROVED', label: 'Aprovado' },
  { value: 'REJECTED', label: 'Rejeitado' },
];

export default function LancamentosPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-gray-400">Carregando...</div>}>
      <LancamentosPageContent />
    </Suspense>
  );
}

function LancamentosPageContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') ?? '';

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get<{ data: { data: JournalEntry[]; total: number } }>('/contabilidade/entries', params);
      setEntries(res.data.data ?? []);
      setTotal(res.data.total ?? 0);
    } catch (err) {
      console.error('Erro ao carregar lançamentos:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/dashboard/contabilidade" className="hover:text-indigo-600">
              Contabilidade
            </Link>
            <span>/</span>
            <span>Lançamentos Contábeis</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Lançamentos Contábeis</h1>
          <p className="text-gray-500 mt-1">
            {total > 0 ? `${total} lançamento${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}` : 'Nenhum lançamento encontrado'}
          </p>
        </div>
        <Link
          href="/dashboard/contabilidade/lancamentos/novo"
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition"
        >
          Novo Lançamento
        </Link>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 text-xs rounded-md border transition ${
              statusFilter === f.value
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Carregando...</div>
        ) : entries.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-gray-400">Nenhum lançamento encontrado.</p>
            <Link
              href="/dashboard/contabilidade/lancamentos/novo"
              className="mt-3 inline-block text-sm text-indigo-600 hover:text-indigo-800"
            >
              Criar primeiro lançamento
            </Link>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nº</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Débito</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Crédito</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-sm font-mono text-gray-900 whitespace-nowrap">
                    {entry.entryNumber}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {new Date(entry.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                    {entry.description}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                    {typeLabels[entry.type] ?? entry.type}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-mono text-gray-900 whitespace-nowrap">
                    {formatBRL(Number(entry.totalDebit))}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-mono text-gray-900 whitespace-nowrap">
                    {formatBRL(Number(entry.totalCredit))}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={entry.status} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link
                      href={`/dashboard/contabilidade/lancamentos/${entry.id}`}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Página {page} de {totalPages} ({total} registros)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border rounded-md disabled:opacity-40 hover:bg-gray-50 transition"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 border rounded-md disabled:opacity-40 hover:bg-gray-50 transition"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
