'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '../../../lib/api-client';

interface SummaryData {
  entriesCount: number;
  pendingEntries: number;
  accountsCount: number;
  periodsCount: number;
  openPeriod: { year: number; month: number } | null;
}

export default function ContabilidadePage() {
  const [summary, setSummary] = useState<SummaryData>({
    entriesCount: 0,
    pendingEntries: 0,
    accountsCount: 0,
    periodsCount: 0,
    openPeriod: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const [entriesRes, accountsRes, periodsRes] = await Promise.allSettled([
          api.get<{ data: { data: unknown[]; total: number } }>('/contabilidade/entries', { limit: 1 }),
          api.get<{ data: { data: unknown[]; total: number } }>('/contabilidade/accounts', { limit: 1 }),
          api.get<{ data: { data: Array<{ year: number; month: number; status: string }>; total: number } }>('/contabilidade/periods', { limit: 50 }),
        ]);

        const pendingRes = await api.get<{ data: { data: unknown[]; total: number } }>('/contabilidade/entries', { status: 'PENDING', limit: 1 }).catch(() => ({ data: { total: 0 } }));

        const entriesTotal = entriesRes.status === 'fulfilled' ? (entriesRes.value.data as any).total ?? 0 : 0;
        const accountsTotal = accountsRes.status === 'fulfilled' ? (accountsRes.value.data as any).total ?? 0 : 0;
        const periodsData = periodsRes.status === 'fulfilled' ? (periodsRes.value.data as any).data ?? [] : [];
        const periodsTotal = periodsRes.status === 'fulfilled' ? (periodsRes.value.data as any).total ?? 0 : 0;
        const openPeriod = periodsData.find((p: any) => p.status === 'OPEN') ?? null;

        setSummary({
          entriesCount: entriesTotal,
          pendingEntries: (pendingRes as any).data?.total ?? 0,
          accountsCount: accountsTotal,
          periodsCount: periodsTotal,
          openPeriod: openPeriod ? { year: openPeriod.year, month: openPeriod.month } : null,
        });
      } catch (err) {
        console.error('Erro ao carregar resumo:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

  const cards = [
    {
      title: 'Lançamentos Contábeis',
      description: 'Registro e aprovação de lançamentos contábeis manuais e automáticos',
      href: '/dashboard/contabilidade/lancamentos',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      stats: loading
        ? 'Carregando...'
        : `${summary.entriesCount} lançamento${summary.entriesCount !== 1 ? 's' : ''}${summary.pendingEntries > 0 ? ` · ${summary.pendingEntries} pendente${summary.pendingEntries !== 1 ? 's' : ''}` : ''}`,
      accent: 'indigo',
    },
    {
      title: 'Plano de Contas',
      description: 'Estrutura hierárquica de contas contábeis conforme COSIF',
      href: '/dashboard/contabilidade/plano-contas',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
      stats: loading ? 'Carregando...' : `${summary.accountsCount} conta${summary.accountsCount !== 1 ? 's' : ''} cadastrada${summary.accountsCount !== 1 ? 's' : ''}`,
      accent: 'purple',
    },
    {
      title: 'Períodos Contábeis',
      description: 'Controle de abertura e encerramento de períodos contábeis',
      href: '/dashboard/contabilidade/periodos',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      stats: loading
        ? 'Carregando...'
        : summary.openPeriod
        ? `Período aberto: ${monthNames[summary.openPeriod.month - 1]}/${summary.openPeriod.year}`
        : `${summary.periodsCount} período${summary.periodsCount !== 1 ? 's' : ''} cadastrado${summary.periodsCount !== 1 ? 's' : ''}`,
      accent: 'violet',
    },
  ];

  const accentClasses: Record<string, { icon: string; border: string; badge: string }> = {
    indigo: {
      icon: 'bg-indigo-50 text-indigo-600',
      border: 'hover:border-indigo-300',
      badge: 'bg-indigo-50 text-indigo-700',
    },
    purple: {
      icon: 'bg-purple-50 text-purple-600',
      border: 'hover:border-purple-300',
      badge: 'bg-purple-50 text-purple-700',
    },
    violet: {
      icon: 'bg-violet-50 text-violet-600',
      border: 'hover:border-violet-300',
      badge: 'bg-violet-50 text-violet-700',
    },
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Contabilidade</h1>
        <p className="text-gray-500 mt-1">
          Plano de contas COSIF, lançamentos e controle de períodos contábeis
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => {
          const accent = accentClasses[card.accent];
          return (
            <Link
              key={card.title}
              href={card.href}
              className={`block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md ${accent.border} transition-all group`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${accent.icon}`}>
                  {card.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 group-hover:text-indigo-700 transition">
                    {card.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                    {card.description}
                  </p>
                  <div className={`inline-block mt-3 px-2.5 py-1 rounded-md text-xs font-medium ${accent.badge}`}>
                    {card.stats}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-indigo-900 mb-1">Acesso Rápido</h2>
        <div className="flex flex-wrap gap-3 mt-3">
          <Link
            href="/dashboard/contabilidade/lancamentos/novo"
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition"
          >
            Novo Lançamento
          </Link>
          <Link
            href="/dashboard/contabilidade/lancamentos?status=PENDING"
            className="px-4 py-2 bg-white border border-indigo-200 text-indigo-700 text-sm rounded-md hover:bg-indigo-50 transition"
          >
            Lançamentos Pendentes
          </Link>
          <Link
            href="/dashboard/contabilidade/periodos"
            className="px-4 py-2 bg-white border border-indigo-200 text-indigo-700 text-sm rounded-md hover:bg-indigo-50 transition"
          >
            Gerenciar Períodos
          </Link>
        </div>
      </div>
    </div>
  );
}
