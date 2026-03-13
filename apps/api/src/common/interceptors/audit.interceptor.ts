import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../modules/prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Only audit write operations
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return next.handle();
    }

    const userId = request.user?.id;
    const companyId = request.user?.companyId;

    if (!userId || !companyId) {
      return next.handle();
    }

    const action = this.mapHttpMethodToAction(method);
    const resource = this.extractResource(request.route?.path || request.url);

    return next.handle().pipe(
      tap(async (responseData) => {
        try {
          const resourceId =
            request.params?.id || responseData?.data?.id || null;

          await this.prisma.auditLog.create({
            data: {
              companyId,
              userId,
              action,
              resource,
              resourceId,
              before: request.body?._previousState || null,
              after: responseData?.data || request.body || null,
              ip: request.ip || request.connection?.remoteAddress,
              userAgent: request.headers?.['user-agent']?.substring(0, 500),
            },
          });
        } catch (error) {
          this.logger.error(
            `Failed to create audit log: ${error.message}`,
            error.stack,
          );
        }
      }),
    );
  }

  private mapHttpMethodToAction(method: string): string {
    const map: Record<string, string> = {
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    };
    return map[method] || method;
  }

  private extractResource(path: string): string {
    // Extract resource name from path like /api/v1/cadastro/suppliers/:id
    const parts = path
      .replace(/^\/api\/v\d+\//, '')
      .split('/')
      .filter((p) => !p.startsWith(':'));
    return parts.join('/').substring(0, 100);
  }
}
