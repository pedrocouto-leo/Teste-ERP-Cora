import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extracts the tenant (companyId) from the request.
 * Must be used with TenantGuard.
 */
export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantId;
  },
);

export const BranchId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.branchId || null;
  },
);
