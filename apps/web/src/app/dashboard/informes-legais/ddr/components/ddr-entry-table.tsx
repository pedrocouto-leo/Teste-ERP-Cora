'use client';

interface DdrEntry {
  id: string;
  accountCode: string;
  currencyCode: string | null;
  countryCode: string | null;
  positionType: number | null;
  value: number;
  isCalculated: boolean;
}

interface EntryTableProps {
  entries: DdrEntry[];
  title: string;
  onDelete?: (entryId: string) => void;
  editable?: boolean;
}

const positionLabel = (p: number | null) => {
  if (p === 1) return 'País';
  if (p === 2) return 'Exterior';
  return '-';
};

export function DdrEntryTable({ entries, title, onDelete, editable }: EntryTableProps) {
  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold text-gray-700 mb-2">{title}</h3>
        <p className="text-sm text-gray-400">Nenhum lançamento nesta categoria.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="px-4 py-3 border-b bg-gray-50">
        <h3 className="font-semibold text-gray-700">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Conta</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Moeda</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">País</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Posição</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Valor (R$)</th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Tipo</th>
              {editable && <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Ação</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {entries.map((entry) => (
              <tr key={entry.id} className={entry.isCalculated ? 'bg-blue-50' : ''}>
                <td className="px-4 py-2 text-sm font-mono text-gray-900">{entry.accountCode}</td>
                <td className="px-4 py-2 text-sm text-gray-600">{entry.currencyCode ?? '-'}</td>
                <td className="px-4 py-2 text-sm text-gray-600">{entry.countryCode ?? '-'}</td>
                <td className="px-4 py-2 text-sm text-gray-600">{positionLabel(entry.positionType)}</td>
                <td className="px-4 py-2 text-sm text-right font-mono text-gray-900">
                  {Number(entry.value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-2 text-sm text-center">
                  {entry.isCalculated ? (
                    <span className="text-blue-600 text-xs">Calculado</span>
                  ) : (
                    <span className="text-gray-400 text-xs">Manual</span>
                  )}
                </td>
                {editable && (
                  <td className="px-4 py-2 text-sm text-center">
                    {!entry.isCalculated && onDelete && (
                      <button
                        onClick={() => onDelete(entry.id)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Remover
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
