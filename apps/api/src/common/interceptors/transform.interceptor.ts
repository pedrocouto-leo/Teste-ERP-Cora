import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Request } from 'express';

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    requestId?: string;
  };
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const correlationId = (request as unknown as Record<string, unknown>).correlationId as string;

    return next.handle().pipe(
      map((responseData: unknown) => {
        if (responseData && typeof responseData === 'object' && 'data' in responseData) {
          const r = responseData as { data: T; meta?: Record<string, unknown> };
          return {
            ...r,
            meta: {
              ...(r.meta ?? {}),
              requestId: correlationId,
            },
          } as ApiResponse<T>;
        }

        return {
          data: responseData as T,
          meta: {
            requestId: correlationId,
          },
        };
      }),
    );
  }
}
