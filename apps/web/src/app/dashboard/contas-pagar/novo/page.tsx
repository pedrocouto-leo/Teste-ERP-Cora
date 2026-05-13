'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../../lib/api-client';

const PAYMENT_METHODS = [
  { value: 'BOLETO', label: 'Boleto Bancário' },
  { value: 'TED', label: 'TED' },
  { value: 'PIX', label: 'PIX' },
];

export default function NovoContaPagarPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    supplierId: '',
    titleNumber: '',
    issueDate: '',
    dueDate: '',
    originalAmount: '',
    paymentMethod: 'BOLETO',
    description: '',
    nfNumber: '',
    costCenterId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const amount = parseFloat(form.originalAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Valor original inválido.');
      setLoading(false);
      return;
    }

    try {
      const body: Record<string, unknown> = {
        supplierId: form.supplierId,
        titleNumber: form.titleNumber,
        issueDate: form.issueDate,
        dueDate: form.dueDate,
        originalAmount: amount,
        paymentMethod: form.paymentMethod,
        description: form.description || undefined,
        nfNumber: form.nfNumber || undefined,
      };

      // Simple cost allocation: one entry covering 100%
      if (form.costCenterId) {
        body.allocations = [
          {
            costCenterId: form.costCenterId,
            amount,
            percentage: 100,
          },
        ];
      }

      const res = await api.post<{ data: { id: string } }>('/contas-pagar/titles', body);
      router.push(`/dashboard/contas-pagar/${res.data.id}`);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar título.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-700 mb-1"
        >
          &larr; Voltar
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Novo Título a Pagar</h1>
        <p className="text-gray-500 mt-1">Registre um novo título no módulo de contas a pagar</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Supplier ID */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID do Fornecedor *
            </label>
            <input
              type="text"
              name="supplierId"
              value={form.supplierId}
              onChange={handleChange}
              required
              placeholder="UUID do fornecedor"
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>

          {/* Title Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nº do Título *
            </label>
            <input
              type="text"
              name="titleNumber"
              value={form.titleNumber}
              onChange={handleChange}
              required
              placeholder="Ex: NF-001"
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>

          {/* NF Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nº da Nota Fiscal
            </label>
            <input
              type="text"
              name="nfNumber"
              value={form.nfNumber}
              onChange={handleChange}
              placeholder="Ex: 12345"
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>

          {/* Issue Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Emissão *
            </label>
            <input
              type="date"
              name="issueDate"
              value={form.issueDate}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Vencimento *
            </label>
            <input
              type="date"
              name="dueDate"
              value={form.dueDate}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>

          {/* Original Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor Original (R$) *
            </label>
            <input
              type="number"
              name="originalAmount"
              value={form.originalAmount}
              onChange={handleChange}
              required
              min="0.01"
              step="0.01"
              placeholder="0,00"
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Forma de Pagamento *
            </label>
            <select
              name="paymentMethod"
              value={form.paymentMethod}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={2}
              placeholder="Descrição do título ou serviço..."
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>
        </div>

        {/* Cost Allocation section */}
        <div className="border-t pt-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Rateio de Custos</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Centro de Custo
            </label>
            <input
              type="text"
              name="costCenterId"
              value={form.costCenterId}
              onChange={handleChange}
              placeholder="UUID do centro de custo (opcional)"
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">
              Se informado, 100% do valor será alocado a este centro de custo.
            </p>
          </div>
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
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Criar Título'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
