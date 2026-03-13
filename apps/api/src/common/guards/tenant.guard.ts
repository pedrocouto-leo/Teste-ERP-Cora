import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

/**
 * Ensures that users can only access data from their own company (tenant).
 * Injects companyId and branchId into the request for downstream use.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.companyId) {
      throw new ForbiddenException(
        'Acesso negado: usuário sem empresa associada',
      );
    }

    // Inject tenant context into request for downstream use
    request.tenantId = user.companyId;
    request.branchId = user.branchId || null;

    return true;
  }
}
