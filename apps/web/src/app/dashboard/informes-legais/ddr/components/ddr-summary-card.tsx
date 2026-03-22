'use client';

interface SummaryProps {
  totalEntries: number;
  rwacamValue: number | null;
  rwampadValue: number | null;
  status: string;
}

export function DdrSummaryCard({ totalEntries, rwacamValue, rwampadValue, status }: SummaryProps) {
  const fmt = (v: number | null) =>
    v != null ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-';

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <p className="text-sm text-gray-500">Total Lançamentos</p>
        <p className="text-2xl font-bold text-gray-900">{totalEntries}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <p className="text-sm text-gray-500">RWACAM (310000)</p>
        <p className="text-2xl font-bold text-gray-900">{fmt(rwacamValue)}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <p className="text-sm text-gray-500">RWAMPAD (503000)</p>
        <p className="text-2xl font-bold text-gray-900">{fmt(rwampadValue)}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <p className="text-sm text-gray-500">Status</p>
        <p className="text-lg font-semibold text-gray-900">{status}</p>
      </div>
    </div>
  );
}
