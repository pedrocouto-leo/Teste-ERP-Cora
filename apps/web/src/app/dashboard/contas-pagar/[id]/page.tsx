'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../../lib/api-client';

interface PayableTitle {
  id: string;
  titleNumber: string;
  installment: number;
  issueDate: string;
  dueDate: string;
  originalAmount: number;
  netAmount: number;
  paidAmount: number;
  balance: number;
  currencyCode: string;
  status: string;
  approvalStatus: string;
  paymentMethod: string | null;
  barcode: string | null;
  description: string | null;
  nfNumber: string | null;
  nfSeries: string | null;
  createdAt: string;
  supplier?: { name: string; cpfCnpj: string };
  costAllocations?: Array<{
    id: string;
    percentage: number;
    amount: number;
    costCenter?: { name: string };
    project?: { name: string };
  }>;
  taxes?: Array<{
    id: string;
    taxType: string;
    baseAmount: number;
    rate: number;
    amount: number;
    withheld: boolean;
  }>;
  approvals?: Array<{
    id: string;
    step: number;
    action: string;
    comments: string | null;
    createdAt: string;
    user?: { name: string };
  }>;
}

const statusLabels: Record<string, string> = {
  OPEN: 'Em Aberto', PARTIAL: 'Parcial', PAID: 'Pago', CANCELLED: 'Cancelado', OVERDUE: 'Vencido',
};
const statusColors: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-700', PARTIAL: 'bg-yellow-100 text-yellow-700',
  PAID: 'bg-green-100 text-green-700', CANCELLED: 'bg-gray-100 text-gray-500', OVERDUE: 'bg-red-100 text-red-700',
};
const approvalLabels: Record<string, string> = { PENDING: 'Pendente', APPROVED: 'Aprovado', REJECTED: 'Rejeitado' };
const approvalColors: Record<string, string> = {
  PENDING: 'bg-orange-100 text-orange-700', APPROVED: 'bg-green-100 text-green-700', REJECTED: 'bg-red-100 text-red-700',
};

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

export default function ContaPagarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [title, setTitle] = useState<PayableTitle | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPayForm, setShowPayForm] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState('');
  const [payMethod, setPayMethod] = useState('PIX');

  const fetchTitle = useCallback(async () => {
    try {
      const res = await api.get<{ data: PayableTitle }>(`/contas-pagar/titles/${id}`);
      setTitle(res.data);
    } catch (err) {
      console.error('Erro ao carregar título:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchTitle(); }, [fetchTitle]);

  const showMsg = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 4000); };

  const handleApprove = async (action: 'approve' | 'reject') => {
    const comments = action === 'reject' ? prompt('Motivo da rejeição:') : undefined;
    if (action === 'reject' && !comments) return;
    setActionLoading(true);
    try {
      await api.post(`/contas-pagar/titles/${id}/approve`, { action, comments });
      await fetchTitle();
      showMsg(action === 'approve' ? 'Título aprovado' : 'Título rejeitado');
    } catch (err: any) {
      showMsg(err.message || 'Erro');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post(`/contas-pagar/titles/${id}/pay`, {
        paymentMethod: payMethod,
        paymentDate: payDate,
        amount: parseFloat(payAmount),
      });
      await fetchTitle();
      setShowPayForm(false);
      showMsg('Pagamento registrado');
    } catch (err: any) {
      showMsg(err.message || 'Erro ao pagar');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Carregando...</div>;
  if (!title) return <div className="p-8 text-center text-red-500">Título não encontrado</div>;

  const canApprove = title.approvalStatus === 'PENDING';
  const canPay = title.approvalStatus === 'APPROVED' && (title.status === 'OPEN' || title.status === 'PARTIAL');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.push('/dashboard/contas-pagar')} className="text-sm text-gray-500 hover:text-gray-700 mb-1">
            &larr; Voltar para lista
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Título {title.titleNumber}{title.installment > 1 ? `/${title.installment}` : ''}
          </h1>
        </div>
        <div className="flex gap-2">
          <span className={`px-3 py-1 text-sm rounded-full font-medium ${statusColors[title.status] || 'bg-gray-100'}`}>
            {statusLabels[title.status] || title.status}
          </span>
          <span className={`px-3 py-1 text-sm rounded-full font-medium ${approvalColors[title.approvalStatus] || 'bg-gray-100'}`}>
            {approvalLabels[title.approvalStatus] || title.approvalStatus}
          </span>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-md text-sm ${message.includes('Erro') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {message}
        </div>
      )}

      {/* Info Grid */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações do Título</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase">Fornecedor</p>
            <p className="text-sm font-medium text-gray-900">{title.supplier?.name || '-'}</p>
            {title.supplier?.cpfCnpj && <p className="text-xs text-gray-500">{title.supplier.cpfCnpj}</p>}
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Data Emissão</p>
            <p className="text-sm font-medium text-gray-900">{new Date(title.issueDate).toLocaleDateString('pt-BR')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Vencimento</p>
            <p className="text-sm font-medium text-gray-900">{new Date(title.dueDate).toLocaleDateString('pt-BR')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Forma Pagamento</p>
            <p className="text-sm font-medium text-gray-900">{title.paymentMethod || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Valor Original</p>
            <p className="text-sm font-bold text-gray-900">{fmt(Number(title.originalAmount))}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Valor Líquido</p>
            <p className="text-sm font-medium text-gray-900">{fmt(Number(title.netAmount))}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Valor Pago</p>
            <p className="text-sm font-medium text-green-600">{fmt(Number(title.paidAmount))}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Saldo</p>
            <p className="text-sm font-bold text-indigo-600">{fmt(Number(title.balance))}</p>
          </div>
        </div>
        {title.description && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-gray-500 uppercase">Descrição</p>
            <p className="text-sm text-gray-700">{title.description}</p>
          </div>
        )}
        {title.nfNumber && (
          <div className="mt-2">
            <p className="text-xs text-gray-500 uppercase">Nota Fiscal</p>
            <p className="text-sm text-gray-700">{title.nfNumber}{title.nfSeries ? ` / Série ${title.nfSeries}` : ''}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      {(canApprove || canPay) && (
        <div className="bg-white rounded-lg border p-4 flex gap-3 flex-wrap">
          {canApprove && (
            <>
              <button
                onClick={() => handleApprove('approve')}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                Aprovar
              </button>
              <button
                onClick={() => handleApprove('reject')}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Rejeitar
              </button>
            </>
          )}
          {canPay && (
            <button
              onClick={() => setShowPayForm(!showPayForm)}
              disabled={actionLoading}
              className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              Registrar Pagamento
            </button>
          )}
        </div>
      )}

      {/* Pay Form */}
      {showPayForm && (
        <form onSubmit={handlePay} className="bg-white rounded-lg border p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Registrar Pagamento</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor *</label>
              <input type="number" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                required placeholder={String(Number(title.balance))}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Pagamento *</label>
              <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} required
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Forma *</label>
              <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500">
                <option value="PIX">PIX</option>
                <option value="TED">TED</option>
                <option value="BOLETO">Boleto</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={actionLoading}
              className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50">
              {actionLoading ? 'Processando...' : 'Confirmar Pagamento'}
            </button>
            <button type="button" onClick={() => setShowPayForm(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Cost Allocations */}
      {title.costAllocations && title.costAllocations.length > 0 && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h3 className="text-sm font-semibold text-gray-700">Rateio de Custos</h3>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Centro de Custo</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Projeto</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">%</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {title.costAllocations.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-2 text-sm text-gray-700">{a.costCenter?.name || '-'}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{a.project?.name || '-'}</td>
                  <td className="px-4 py-2 text-sm text-right text-gray-600">{Number(a.percentage).toFixed(2)}%</td>
                  <td className="px-4 py-2 text-sm text-right text-gray-900">{fmt(Number(a.amount))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Taxes */}
      {title.taxes && title.taxes.length > 0 && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h3 className="text-sm font-semibold text-gray-700">Impostos Retidos</h3>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Imposto</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Base</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Alíquota</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Retido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {title.taxes.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">{t.taxType}</td>
                  <td className="px-4 py-2 text-sm text-right text-gray-600">{fmt(Number(t.baseAmount))}</td>
                  <td className="px-4 py-2 text-sm text-right text-gray-600">{Number(t.rate).toFixed(2)}%</td>
                  <td className="px-4 py-2 text-sm text-right text-gray-900">{fmt(Number(t.amount))}</td>
                  <td className="px-4 py-2 text-sm text-center">{t.withheld ? '✅' : '❌'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Approval History */}
      {title.approvals && title.approvals.length > 0 && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h3 className="text-sm font-semibold text-gray-700">Histórico de Aprovações</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {title.approvals.map((a) => (
              <div key={a.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {a.user?.name || 'Usuário'} — <span className={a.action === 'APPROVED' ? 'text-green-600' : 'text-red-600'}>{a.action === 'APPROVED' ? 'Aprovou' : 'Rejeitou'}</span>
                  </p>
                  {a.comments && <p className="text-xs text-gray-500 mt-0.5">{a.comments}</p>}
                </div>
                <span className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleString('pt-BR')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
