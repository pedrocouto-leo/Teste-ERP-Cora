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

const EVENT_TYPES = ['R-1000', 'R-2010', 'R-2020', 'R-4010', 'R-4020'];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

type LoadingAction = 'generate' | 'r1000' | 'transmit' | null;

interface Event {
  id?: string;
  eventType?: string;
  status?: string;
  [key: string]: unknown;
}

export default function EfdReinfPage() {
  const [year, setYear] = useState<number>(currentYear);
  const [month, setMonth] = useState<number>(currentMonth);
  const [eventType, setEventType] = useState<string>('');
  const [transmitEventId, setTransmitEventId] = useState('');
  const [loading, setLoading] = useState<LoadingAction>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const clearFeedback = () => {
    setError('');
    setSuccessMessage('');
    setResult(null);
  };

  const handleGenerateEvents = async () => {
    setLoading('generate');
    clearFeedback();
    try {
      const body: Record<string, unknown> = { year, month };
      if (eventType) body.eventType = eventType;
      const res = await api.post<{ data?: Event[] } | Event[]>(
        '/informes-fiscais/efd-reinf/generate',
        body,
      );
      const data = Array.isArray(res) ? res : (res as { data?: Event[] }).data ?? [res];
      setEvents(data as Event[]);
      setSuccessMessage('Eventos gerados com sucesso.');
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar eventos.');
    } finally {
      setLoading(null);
    }
  };

  const handleGenerateR1000 = async () => {
    setLoading('r1000');
    clearFeedback();
    try {
      const res = await api.post('/informes-fiscais/efd-reinf/r1000', {});
      setResult(res);
      setSuccessMessage('R-1000 gerado com sucesso.');
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar R-1000.');
    } finally {
      setLoading(null);
    }
  };

  const handleTransmit = async () => {
    if (!transmitEventId.trim()) {
      setError('Informe o ID do evento para transmissão.');
      return;
    }
    setLoading('transmit');
    clearFeedback();
    try {
      const res = await api.post('/informes-fiscais/efd-reinf/transmit', {
        eventId: transmitEventId,
      });
      setResult(res);
      setSuccessMessage('Evento transmitido com sucesso.');
    } catch (err: any) {
      setError(err.message || 'Erro ao transmitir evento.');
    } finally {
      setLoading(null);
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
          <h1 className="text-2xl font-bold text-gray-900">EFD-Reinf</h1>
          <p className="text-gray-500 mt-1">
            Escrituração Fiscal Digital de Retenções e Informações
          </p>
        </div>
      </div>

      {/* Gerar Eventos */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-800">Gerar Eventos</h2>

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
              Tipo de Evento
            </label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
              <option value="">Todos</option>
              {EVENT_TYPES.map((et) => (
                <option key={et} value={et}>
                  {et}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          <button
            onClick={handleGenerateEvents}
            disabled={loading !== null}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {loading === 'generate' ? 'Gerando...' : 'Gerar Eventos'}
          </button>
          <button
            onClick={handleGenerateR1000}
            disabled={loading !== null}
            className="px-4 py-2 bg-white border border-indigo-600 text-indigo-600 text-sm font-medium rounded-md hover:bg-indigo-50 disabled:opacity-50 transition"
          >
            {loading === 'r1000' ? 'Gerando...' : 'Gerar R-1000'}
          </button>
        </div>
      </div>

      {/* Transmitir */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-800">Transmitir Evento</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">ID do Evento *</label>
            <input
              type="text"
              value={transmitEventId}
              onChange={(e) => setTransmitEventId(e.target.value)}
              placeholder="Informe o ID do evento"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleTransmit}
              disabled={loading !== null}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {loading === 'transmit' ? 'Transmitindo...' : 'Transmitir'}
            </button>
          </div>
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

      {/* Events list */}
      {events.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-800">
              Eventos Gerados ({events.length})
            </h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {events.map((ev, i) => (
                <tr key={ev.id ?? i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-700">
                    {ev.id ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{ev.eventType ?? '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{ev.status ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
