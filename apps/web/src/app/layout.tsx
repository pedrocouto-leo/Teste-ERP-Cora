import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CORA ERP - Sistema de Gestão Financeira',
  description:
    'Sistema ERP para instituição financeira S4 - CORA Sociedade de Crédito, Financiamento e Investimento S.A.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
