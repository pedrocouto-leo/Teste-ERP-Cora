'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
  {
    label: 'Cadastros Gerais',
    href: '/dashboard/cadastro',
    icon: '📋',
    children: [
      { label: 'Empresas', href: '/dashboard/cadastro/empresas', icon: '🏢' },
      { label: 'Filiais', href: '/dashboard/cadastro/filiais', icon: '🏬' },
      { label: 'Fornecedores', href: '/dashboard/cadastro/fornecedores', icon: '🤝' },
      { label: 'Clientes', href: '/dashboard/cadastro/clientes', icon: '👥' },
      { label: 'Centros de Custo', href: '/dashboard/cadastro/centros-custo', icon: '🎯' },
      { label: 'Projetos', href: '/dashboard/cadastro/projetos', icon: '📁' },
      { label: 'Bancos', href: '/dashboard/cadastro/bancos', icon: '🏦' },
      { label: 'Contas Bancárias', href: '/dashboard/cadastro/contas-bancarias', icon: '💳' },
      { label: 'Moedas', href: '/dashboard/cadastro/moedas', icon: '💱' },
      { label: 'Feriados', href: '/dashboard/cadastro/feriados', icon: '📅' },
    ],
  },
  { label: 'Caixas e Bancos', href: '/dashboard/caixa-bancos', icon: '🏧' },
  { label: 'Compras', href: '/dashboard/compras', icon: '🛒' },
  { label: 'Contas a Pagar', href: '/dashboard/contas-pagar', icon: '📤' },
  { label: 'Contas a Receber', href: '/dashboard/contas-receber', icon: '📥' },
  { label: 'Orçamento', href: '/dashboard/orcamento', icon: '📈' },
  { label: 'Contratos', href: '/dashboard/contratos', icon: '📝' },
  { label: 'Faturamento', href: '/dashboard/faturamento', icon: '🧾' },
  { label: 'Contabilidade', href: '/dashboard/contabilidade', icon: '📒' },
  { label: 'Patrimônio', href: '/dashboard/patrimonio', icon: '🏗️' },
  { label: 'Liquidação', href: '/dashboard/liquidacao', icon: '✅' },
  { label: 'Informes Fiscais', href: '/dashboard/informes-fiscais', icon: '📊' },
  {
    label: 'Informes Legais',
    href: '/dashboard/informes-legais',
    icon: '⚖️',
    children: [
      { label: 'DDR - Doc 2011', href: '/dashboard/informes-legais/ddr', icon: '📄' },
    ],
  },
  {
    label: 'Controle de Acesso',
    href: '/dashboard/acesso',
    icon: '🔐',
    children: [
      { label: 'Usuários', href: '/dashboard/acesso/usuarios', icon: '👤' },
      { label: 'Roles', href: '/dashboard/acesso/roles', icon: '🛡️' },
      { label: 'Audit Log', href: '/dashboard/acesso/audit', icon: '📜' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label],
    );
  };

  return (
    <aside
      className={`bg-cora-primary text-white h-screen flex flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="p-4 flex items-center justify-between border-b border-white/10">
        {!collapsed && (
          <span className="text-lg font-bold tracking-wide">CORA ERP</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 hover:bg-white/10 rounded"
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {navigation.map((item) => (
          <div key={item.label}>
            {item.children ? (
              <>
                <button
                  onClick={() => toggleExpand(item.label)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10 transition ${
                    pathname.startsWith(item.href)
                      ? 'bg-white/10 text-white'
                      : 'text-gray-300'
                  }`}
                >
                  <span>{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      <span className="text-xs">
                        {expandedItems.includes(item.label) ? '▼' : '▸'}
                      </span>
                    </>
                  )}
                </button>
                {!collapsed && expandedItems.includes(item.label) && (
                  <div className="bg-black/20">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`flex items-center gap-3 px-8 py-2 text-sm hover:bg-white/10 transition ${
                          pathname === child.href
                            ? 'bg-white/15 text-white'
                            : 'text-gray-400'
                        }`}
                      >
                        <span className="text-xs">{child.icon}</span>
                        <span>{child.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10 transition ${
                  pathname === item.href
                    ? 'bg-white/10 text-white'
                    : 'text-gray-300'
                }`}
              >
                <span>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10 text-xs text-gray-500">
        {!collapsed && <span>v0.0.1</span>}
      </div>
    </aside>
  );
}
