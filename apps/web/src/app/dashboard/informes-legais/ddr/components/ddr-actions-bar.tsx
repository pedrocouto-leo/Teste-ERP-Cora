'use client';

interface ActionsBarProps {
  status: string;
  onCalculate: () => void;
  onValidate: () => void;
  onSubmitReview: () => void;
  onApprove: () => void;
  onReject: () => void;
  onExport: () => void;
  loading?: boolean;
}

export function DdrActionsBar({
  status,
  onCalculate,
  onValidate,
  onSubmitReview,
  onApprove,
  onReject,
  onExport,
  loading,
}: ActionsBarProps) {
  const isDraft = status === 'DRAFT' || status === 'REJECTED';
  const isPendingReview = status === 'PENDING_REVIEW';
  const isApproved = status === 'APPROVED';

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg border">
      {isDraft && (
        <>
          <button
            onClick={onCalculate}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            Calcular Derivadas
          </button>
          <button
            onClick={onValidate}
            disabled={loading}
            className="px-4 py-2 bg-amber-600 text-white text-sm rounded-md hover:bg-amber-700 disabled:opacity-50"
          >
            Validar
          </button>
          <button
            onClick={onSubmitReview}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Enviar para Revisão
          </button>
        </>
      )}
      {isPendingReview && (
        <>
          <button
            onClick={onApprove}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            Aprovar
          </button>
          <button
            onClick={onReject}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            Rejeitar
          </button>
        </>
      )}
      {(isApproved || status === 'SUBMITTED') && (
        <button
          onClick={onExport}
          disabled={loading}
          className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 disabled:opacity-50"
        >
          Exportar XML
        </button>
      )}
    </div>
  );
}
