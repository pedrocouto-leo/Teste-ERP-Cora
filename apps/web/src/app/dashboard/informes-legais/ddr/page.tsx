'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '../../../../lib/api-client';
import { DdrStatusBadge } from './components/ddr-status-badge';

interface DdrReport {
  id: string;
  referenceDate: string;
  status: string;
  createdAt: string;
  _count: { entries: number };
}

export default function DdrListPage() {
  const [reports, setReports] = useState<DdrReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { limit: 50, sortBy: 'referenceDate', sortOrder: 'desc' };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get<{ data: DdrReport[] }>('/informes-legais/ddr', params);
      setReports(res.data);
    } catch (err) {
      console.error('Erro ao carregar DDR:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">DDR - Documento 2011</h1>
          <p className="text-gray-500 mt-1">Demonstrativo Diário de Risco de Mercado</p>
        </div>
        <Link
          href="/dashboard/informes-legais/ddr/novo"
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
        >
          Novo DDR
        </Link>
      </div>

      <div className="flex gap-2">
        {['', 'DRAFT', 'PENDING_REVIEW', 'APPROVED', 'SUBMITTED', 'REJECTED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs rounded-md border ${
              statusFilter === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {s === '' ? 'Todos' : s === 'PENDING_REVIEW' ? 'Em Revisão' : s === 'DRAFT' ? 'Rascunho' : s === 'APPROVED' ? 'Aprovado' : s === 'SUBMITTED' ? 'Enviado' : 'Rejeitado'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Nenhum relatório DDR encontrado.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data-Base</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Lançamentos</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Criado em</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    {new Date(report.referenceDate).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    <DdrStatusBadge status={report.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600">
                    {report._count.entries}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(report.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <Link
                      href={`/dashboard/informes-legais/ddr/${report.id}`}
                      className="text-indigo-600 hover:text-indigo-800 font-medium"
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
    </div>
  );
}
