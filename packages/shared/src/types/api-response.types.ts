export interface ApiResponse<T> {
  data: T;
  meta?: {
    requestId?: string;
    timestamp?: string;
  };
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
  details?: Record<string, unknown>;
  requestId?: string;
  timestamp?: string;
}

export interface WorkflowAction {
  action: 'approve' | 'reject' | 'cancel';
  comments?: string;
}
