'use client';

import Link from 'next/link';

const modules = [
  {
    name: 'EFD Contribuições',
    subtitle: 'PIS/COFINS',
    description: 'Escrituração Fiscal Digital das Contribuições',
    icon: '📊',
    href: '/dashboard/informes-fiscais/efd-contribuicoes',
  },
  {
    name: 'EFD-Reinf',
    subtitle: '',
    description: 'Escrituração Fiscal Digital de Retenções e Informações',
    icon: '📋',
    href: '/dashboard/informes-fiscais/efd-reinf',
  },
  {
    name: 'ECF',
    subtitle: '',
    description: 'Escrituração Contábil Fiscal (IRPJ/CSLL)',
    icon: '📒',
    href: '/dashboard/informes-fiscais/ecf',
  },
  {
    name: 'DES-IF',
    subtitle: '',
    description: 'Declaração Eletrônica de Serviços - Instituições Financeiras',
    icon: '🏛️',
    href: '/dashboard/informes-fiscais/des-if',
  },
];

export default function InformesFiscaisPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Informes Fiscais</h1>
        <p className="text-gray-500 mt-1">Obrigações acessórias e declarações fiscais</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map((mod) => (
          <Link
            key={mod.href}
            href={mod.href}
            className="flex items-start gap-4 p-6 bg-white rounded-lg border border-gray-200 hover:shadow-md hover:border-indigo-300 transition group"
          >
            <span className="text-3xl">{mod.icon}</span>
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition">
                {mod.name}
                {mod.subtitle && (
                  <span className="ml-2 text-xs font-normal text-gray-500">{mod.subtitle}</span>
                )}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{mod.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
