'use client';

import { useEffect, useState } from 'react';

interface HealthStatus {
  status: string;
  timestamp: string;
}

export default function Home() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:3000/api/v1/health')
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch(() => setError('API não disponível'));
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-cora-primary to-cora-secondary text-white">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">CORA ERP</h1>
        <p className="text-xl text-gray-300">
          Sistema de Gestão Financeira - Instituição S4
        </p>
        <div className="mt-8 p-6 bg-white/10 backdrop-blur-sm rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Status do Sistema</h2>
          {health ? (
            <div className="space-y-2">
              <p className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                API: {health.status}
              </p>
              <p className="text-sm text-gray-400">
                Último check: {new Date(health.timestamp).toLocaleString('pt-BR')}
              </p>
            </div>
          ) : error ? (
            <p className="flex items-center gap-2 text-red-300">
              <span className="w-3 h-3 bg-red-400 rounded-full" />
              {error}
            </p>
          ) : (
            <p className="text-gray-400">Verificando...</p>
          )}
        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {[
            'Cadastros Gerais',
            'Caixas e Bancos',
            'Contas a Pagar',
            'Contas a Receber',
            'Contabilidade',
            'Orçamento',
            'Compras',
            'Contratos',
            'Faturamento',
            'Patrimônio',
            'Liquidação',
            'Controle de Acesso',
            'Informes Fiscais',
            'Informes Legais',
          ].map((module) => (
            <div
              key={module}
              className="p-3 bg-white/5 rounded-md border border-white/10 hover:bg-white/10 transition"
            >
              {module}
            </div>
          ))}
        </div>

        <p className="text-sm text-gray-500 mt-12">
          CORA Sociedade de Crédito, Financiamento e Investimento S.A.
        </p>
      </div>
    </main>
  );
}
