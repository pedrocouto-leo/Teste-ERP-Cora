'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '../../../../lib/api-client';

const MONTHS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

export default function DesIfPage() {
  const [year, setYear] = useState<number>(currentYear);
  const [month, setMonth] = useState<number>(currentMonth);
  const [municipalityCode, setMunicipalityCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    setSuccessMessage('');
    try {
      const res = await api.post(
        `/informes-fiscais/des-if/generate${municipalityCode ? `?municipalityCode=${encodeURIComponent(municipalityCode)}` : ''}`,
        { year, month },
      );
      setResult(res);
      setSuccessMessage('DES-IF gerada com sucesso.');
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar DES-IF.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/informes-fiscais"
          className="text-gray-400 hover:text-gray-600 transition"
          title="Voltar"
        >
          ←
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">DES-IF</h1>
          <p className="text-gray-500 mt-1">
            Declaração Eletrônica de Serviços - Instituições Financeiras
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-800">Parâmetros</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ano *</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              min={2000}
              max={currentYear + 1}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mês *</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código do Município (IBGE)
            </label>
            <input
              type="text"
              value={municipalityCode}
              onChange={(e) => setMunicipalityCode(e.target.value)}
              placeholder="Ex: 3550308"
              maxLength={7}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">Código IBGE de 7 dígitos (opcional)</p>
          </div>
        </div>

        <div className="pt-1">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {loading ? 'Gerando...' : 'Gerar DES-IF'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {result !== null && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-3">
          <h2 className="text-base font-semibold text-gray-800">Resultado</h2>
          <pre className="text-xs text-gray-700 bg-gray-50 rounded-md p-4 overflow-auto max-h-96 whitespace-pre-wrap break-words">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
