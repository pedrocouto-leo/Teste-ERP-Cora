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
    const correlationId = (request as Record<string, unknown>).correlationId as string;

    return next.handle().pipe(
      map((responseData) => {
        // If already formatted with data/meta, pass through
        if (responseData && typeof responseData === 'object' && 'data' in responseData) {
          return {
            ...responseData,
            meta: {
              ...responseData.meta,
              requestId: correlationId,
            },
          };
        }

        return {
          data: responseData,
          meta: {
            requestId: correlationId,
          },
        };
      }),
    );
  }
}
