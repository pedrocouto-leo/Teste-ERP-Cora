'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../../../lib/api-client';
import { DdrStatusBadge } from '../components/ddr-status-badge';
import { DdrSummaryCard } from '../components/ddr-summary-card';
import { DdrActionsBar } from '../components/ddr-actions-bar';
import { DdrEntryTable } from '../components/ddr-entry-table';
import { DdrEntryForm } from '../components/ddr-entry-form';

interface DdrEntry {
  id: string;
  accountCode: string;
  currencyCode: string | null;
  countryCode: string | null;
  positionType: number | null;
  value: number;
  isCalculated: boolean;
}

interface DdrReport {
  id: string;
  referenceDate: string;
  status: string;
  notes: string | null;
  createdBy: string;
  entries: DdrEntry[];
  parameters: Array<{ parameterCode: string; value: number; source: string | null }>;
}

type Tab = 'fx' | 'liquidity' | 'rwacam' | 'market' | 'internal';

const tabConfig: Array<{ key: Tab; label: string; codePrefix: string[] }> = [
  { key: 'fx', label: 'Posições Cambiais', codePrefix: ['11', '12', '13', '14', '15', '16', '17', '18'] },
  { key: 'liquidity', label: 'Liquidez', codePrefix: ['21', '22', '23', '24'] },
  { key: 'rwacam', label: 'RWACAM', codePrefix: ['31'] },
  { key: 'market', label: 'Risco de Mercado', codePrefix: ['41'] },
  { key: 'internal', label: 'Modelos Internos', codePrefix: ['50', '51'] },
];

export default function DdrDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [report, setReport] = useState<DdrReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('fx');
  const [message, setMessage] = useState('');

  const fetchReport = useCallback(async () => {
    try {
      const res = await api.get<{ data: DdrReport }>(`/informes-legais/ddr/${id}`);
      setReport(res.data);
    } catch (err) {
      console.error('Erro ao carregar DDR:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleAddEntry = async (data: {
    accountCode: string;
    currencyCode?: string;
    countryCode?: string;
    positionType?: number;
    value: number;
  }) => {
    setActionLoading(true);
    try {
      await api.post(`/informes-legais/ddr/${id}/entries`, data);
      await fetchReport();
      showMessage('Lançamento adicionado');
    } catch (err: any) {
      showMessage(err.message || 'Erro ao adicionar');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      await api.delete(`/informes-legais/ddr/${id}/entries/${entryId}`);
      await fetchReport();
      showMessage('Lançamento removido');
    } catch (err: any) {
      showMessage(err.message || 'Erro ao remover');
    }
  };

  const handleCalculate = async () => {
    setActionLoading(true);
    try {
      await api.post(`/informes-legais/ddr/${id}/calculate`);
      await fetchReport();
      showMessage('Contas derivadas calculadas');
    } catch (err: any) {
      showMessage(err.message || 'Erro ao calcular');
    } finally {
      setActionLoading(false);
    }
  };

  const handleValidate = async () => {
    setActionLoading(true);
    try {
      const res = await api.post<{ data: { valid: boolean; errors: string[] } }>(
        `/informes-legais/ddr/${id}/validate`,
      );
      if (res.data.valid) {
        showMessage('DDR válido - pronto para envio');
      } else {
        showMessage(`Erros: ${res.data.errors.join('; ')}`);
      }
    } catch (err: any) {
      showMessage(err.message || 'Erro na validação');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    setActionLoading(true);
    try {
      await api.post(`/informes-legais/ddr/${id}/submit-review`);
      await fetchReport();
      showMessage('Enviado para revisão');
    } catch (err: any) {
      showMessage(err.message || 'Erro');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await api.post(`/informes-legais/ddr/${id}/approve`);
      await fetchReport();
      showMessage('DDR aprovado');
    } catch (err: any) {
      showMessage(err.message || 'Erro ao aprovar');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Motivo da rejeição:');
    if (!reason) return;
    setActionLoading(true);
    try {
      await api.post(`/informes-legais/ddr/${id}/reject`, { reason });
      await fetchReport();
      showMessage('DDR rejeitado');
    } catch (err: any) {
      showMessage(err.message || 'Erro ao rejeitar');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/informes-legais/ddr/${id}/export`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        },
      );
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DDR_2011_${id}.xml`;
      a.click();
      URL.revokeObjectURL(url);
      showMessage('XML exportado');
    } catch (err: any) {
      showMessage(err.message || 'Erro ao exportar');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Carregando DDR...</div>;
  }

  if (!report) {
    return <div className="p-8 text-center text-red-500">DDR não encontrado</div>;
  }

  const editable = report.status === 'DRAFT' || report.status === 'REJECTED';

  const currentTabEntries = report.entries.filter((e) => {
    const tab = tabConfig.find((t) => t.key === activeTab);
    return tab?.codePrefix.some((p) => e.accountCode.startsWith(p));
  });

  const rwacamValue = report.entries.find((e) => e.accountCode === '310000');
  const rwampadValue = report.entries.find((e) => e.accountCode === '503000');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push('/dashboard/informes-legais/ddr')}
            className="text-sm text-gray-500 hover:text-gray-700 mb-1"
          >
            &larr; Voltar para lista
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            DDR - {new Date(report.referenceDate).toLocaleDateString('pt-BR')}
          </h1>
        </div>
        <DdrStatusBadge status={report.status} />
      </div>

      {message && (
        <div className={`p-3 rounded-md text-sm ${message.startsWith('Erros') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {message}
        </div>
      )}

      <DdrSummaryCard
        totalEntries={report.entries.length}
        rwacamValue={rwacamValue ? Number(rwacamValue.value) : null}
        rwampadValue={rwampadValue ? Number(rwampadValue.value) : null}
        status={report.status}
      />

      <DdrActionsBar
        status={report.status}
        onCalculate={handleCalculate}
        onValidate={handleValidate}
        onSubmitReview={handleSubmitReview}
        onApprove={handleApprove}
        onReject={handleReject}
        onExport={handleExport}
        loading={actionLoading}
      />

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-0">
          {tabConfig.map((tab) => {
            const count = report.entries.filter((e) =>
              tab.codePrefix.some((p) => e.accountCode.startsWith(p)),
            ).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                  activeTab === tab.key
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Entry Form (only for editable reports) */}
      {editable && <DdrEntryForm onSubmit={handleAddEntry} loading={actionLoading} />}

      {/* Entry Table */}
      <DdrEntryTable
        entries={currentTabEntries}
        title={tabConfig.find((t) => t.key === activeTab)?.label ?? ''}
        onDelete={handleDeleteEntry}
        editable={editable}
      />

      {/* Notes */}
      {report.notes && (
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <p className="text-sm font-medium text-yellow-800">Observações:</p>
          <p className="text-sm text-yellow-700 mt-1">{report.notes}</p>
        </div>
      )}
    </div>
  );
}
