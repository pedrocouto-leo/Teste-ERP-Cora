'use client';

export default function DashboardPage() {
  const modules = [
    {
      name: 'Cadastros Gerais',
      description: 'Empresas, fornecedores, clientes, centros de custo',
      href: '/dashboard/cadastro',
      color: 'bg-blue-500',
    },
    {
      name: 'Caixas e Bancos',
      description: 'Movimentações, conciliação, extratos',
      href: '/dashboard/caixa-bancos',
      color: 'bg-green-500',
    },
    {
      name: 'Contas a Pagar',
      description: 'Títulos, aprovações, pagamentos',
      href: '/dashboard/contas-pagar',
      color: 'bg-red-500',
    },
    {
      name: 'Contas a Receber',
      description: 'Duplicatas, cobranças, boletos',
      href: '/dashboard/contas-receber',
      color: 'bg-emerald-500',
    },
    {
      name: 'Contabilidade',
      description: 'Plano de contas COSIF, lançamentos, demonstrações',
      href: '/dashboard/contabilidade',
      color: 'bg-purple-500',
    },
    {
      name: 'Orçamento',
      description: 'Controle orçamentário, previsões, remanejamento',
      href: '/dashboard/orcamento',
      color: 'bg-amber-500',
    },
    {
      name: 'Compras',
      description: 'Solicitações, cotações, pedidos, recebimento',
      href: '/dashboard/compras',
      color: 'bg-indigo-500',
    },
    {
      name: 'Contratos',
      description: 'Gestão de contratos, parcelas, aditivos',
      href: '/dashboard/contratos',
      color: 'bg-teal-500',
    },
    {
      name: 'Faturamento',
      description: 'Faturas, NFS-e, impostos',
      href: '/dashboard/faturamento',
      color: 'bg-orange-500',
    },
    {
      name: 'Patrimônio',
      description: 'Ativos, depreciação, transferências',
      href: '/dashboard/patrimonio',
      color: 'bg-cyan-500',
    },
    {
      name: 'Liquidação',
      description: 'Centralização financeira, TED, aprovações',
      href: '/dashboard/liquidacao',
      color: 'bg-pink-500',
    },
    {
      name: 'Informes Fiscais',
      description: 'EFD-Reinf, ECF, EFD Contribuições, DES-IF',
      href: '/dashboard/informes-fiscais',
      color: 'bg-violet-500',
    },
    {
      name: 'Informes Legais',
      description: 'CADOC, SCR, PDD, BNDES, BACEN',
      href: '/dashboard/informes-legais',
      color: 'bg-rose-500',
    },
    {
      name: 'Controle de Acesso',
      description: 'Usuários, roles, permissões, audit log',
      href: '/dashboard/acesso',
      color: 'bg-slate-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Bem-vindo ao sistema CORA ERP - Gestão Financeira S4
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {modules.map((module) => (
          <a
            key={module.name}
            href={module.href}
            className="block p-5 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition group"
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-2 h-2 rounded-full mt-2 ${module.color}`}
              />
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition">
                  {module.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {module.description}
                </p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
