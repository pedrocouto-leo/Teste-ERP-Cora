-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "tradeName" VARCHAR(200),
    "cnpj" VARCHAR(18) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "cnpj" VARCHAR(18),
    "code" VARCHAR(20) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePass" BOOLEAN NOT NULL DEFAULT true,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "passwordHistory" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "resource" VARCHAR(100) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "description" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "branchId" UUID,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_authority_limits" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "resource" VARCHAR(100) NOT NULL,
    "maxAmount" DECIMAL(18,4) NOT NULL,
    "costCenterId" UUID,
    "branchId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_authority_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "action" VARCHAR(20) NOT NULL,
    "resource" VARCHAR(100) NOT NULL,
    "resourceId" UUID,
    "before" JSONB,
    "after" JSONB,
    "ip" VARCHAR(45),
    "userAgent" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_centers" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "parentId" UUID,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,

    CONSTRAINT "cost_centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "type" VARCHAR(2) NOT NULL,
    "cpfCnpj" VARCHAR(18) NOT NULL,
    "name" VARCHAR(300) NOT NULL,
    "tradeName" VARCHAR(300),
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "address" VARCHAR(500),
    "city" VARCHAR(200),
    "state" VARCHAR(2),
    "zipCode" VARCHAR(10),
    "municipalityId" UUID,
    "bankCode" VARCHAR(10),
    "bankAgency" VARCHAR(10),
    "bankAccount" VARCHAR(20),
    "bankAccountType" VARCHAR(2),
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "type" VARCHAR(2) NOT NULL,
    "cpfCnpj" VARCHAR(18) NOT NULL,
    "name" VARCHAR(300) NOT NULL,
    "tradeName" VARCHAR(300),
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "address" VARCHAR(500),
    "city" VARCHAR(200),
    "state" VARCHAR(2),
    "zipCode" VARCHAR(10),
    "municipalityId" UUID,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banks" (
    "id" UUID NOT NULL,
    "compeCode" VARCHAR(3) NOT NULL,
    "ispbCode" VARCHAR(8),
    "name" VARCHAR(200) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_agencies" (
    "id" UUID NOT NULL,
    "bankId" UUID NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "digit" VARCHAR(2),
    "name" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_agencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "own_bank_accounts" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "branchId" UUID,
    "bankAgencyId" UUID NOT NULL,
    "accountNum" VARCHAR(20) NOT NULL,
    "accountDigit" VARCHAR(2),
    "accountType" VARCHAR(2) NOT NULL,
    "description" VARCHAR(200),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,

    CONSTRAINT "own_bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currencies" (
    "id" UUID NOT NULL,
    "code" VARCHAR(3) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "symbol" VARCHAR(5) NOT NULL,
    "decimals" INTEGER NOT NULL DEFAULT 2,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" UUID NOT NULL,
    "currencyId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "buyRate" DECIMAL(18,8) NOT NULL,
    "sellRate" DECIMAL(18,8) NOT NULL,
    "source" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indexers" (
    "id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "indexers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indexer_quotations" (
    "id" UUID NOT NULL,
    "indexerId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "value" DECIMAL(18,8) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "indexer_quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holidays" (
    "id" UUID NOT NULL,
    "companyId" UUID,
    "date" DATE NOT NULL,
    "description" VARCHAR(200) NOT NULL,
    "scope" VARCHAR(20) NOT NULL,
    "state" VARCHAR(2),
    "municipalityCode" VARCHAR(7),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "municipalities" (
    "id" UUID NOT NULL,
    "ibgeCode" VARCHAR(7) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "state" VARCHAR(2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "municipalities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_service_codes" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "type" VARCHAR(10) NOT NULL,
    "nbs" VARCHAR(20),
    "ncm" VARCHAR(10),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_service_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_parameters" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "taxType" VARCHAR(20) NOT NULL,
    "rate" DECIMAL(8,4) NOT NULL,
    "minAmount" DECIMAL(18,4),
    "validFrom" DATE NOT NULL,
    "validTo" DATE,
    "description" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_parameters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corporate_groups" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "corporate_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charts_of_accounts" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "version" VARCHAR(20) NOT NULL,
    "validFrom" DATE NOT NULL,
    "validTo" DATE,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "charts_of_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "chartId" UUID NOT NULL,
    "parentId" UUID,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(300) NOT NULL,
    "level" INTEGER NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "nature" VARCHAR(10) NOT NULL,
    "cosifCode" VARCHAR(20),
    "allowsPosting" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_periods" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    "closedAt" TIMESTAMP(3),
    "closedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounting_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "periodId" UUID NOT NULL,
    "entryNumber" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "type" VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "totalDebit" DECIMAL(18,4) NOT NULL,
    "totalCredit" DECIMAL(18,4) NOT NULL,
    "createdBy" UUID NOT NULL,
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entry_lines" (
    "id" UUID NOT NULL,
    "entryId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "type" VARCHAR(10) NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "costCenterId" UUID,
    "projectId" UUID,
    "description" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_entry_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_balances" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "periodId" UUID NOT NULL,
    "openingBalance" DECIMAL(18,4) NOT NULL,
    "totalDebits" DECIMAL(18,4) NOT NULL,
    "totalCredits" DECIMAL(18,4) NOT NULL,
    "closingBalance" DECIMAL(18,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "standard_entries" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" VARCHAR(500),
    "lines" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "standard_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "year" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_lines" (
    "id" UUID NOT NULL,
    "budgetId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "costCenterId" UUID,
    "projectId" UUID,
    "branchId" UUID,
    "jan" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "feb" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "mar" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "apr" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "may" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "jun" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "jul" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "aug" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "sep" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "oct" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "nov" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "dec" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "total" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_reallocations" (
    "id" UUID NOT NULL,
    "budgetId" UUID NOT NULL,
    "fromLineId" UUID NOT NULL,
    "toLineId" UUID NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "month" INTEGER NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "requestedBy" UUID NOT NULL,
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_reallocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_executions" (
    "id" UUID NOT NULL,
    "budgetLineId" UUID NOT NULL,
    "month" INTEGER NOT NULL,
    "executedAmount" DECIMAL(18,4) NOT NULL,
    "documentType" VARCHAR(20) NOT NULL,
    "documentId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_accounts" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "branchId" UUID,
    "name" VARCHAR(200) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "bankAccountId" UUID,
    "balance" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,

    CONSTRAINT "cash_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_movements" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "cashAccountId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "type" VARCHAR(10) NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "balanceAfter" DECIMAL(18,4) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "sourceModule" VARCHAR(50),
    "sourceId" UUID,
    "costCenterId" UUID,
    "projectId" UUID,
    "reconciled" BOOLEAN NOT NULL DEFAULT false,
    "reconciledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,

    CONSTRAINT "cash_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_statements" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "cashAccountId" UUID NOT NULL,
    "importDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "openingBalance" DECIMAL(18,4) NOT NULL,
    "closingBalance" DECIMAL(18,4) NOT NULL,
    "fileName" VARCHAR(255),
    "format" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'IMPORTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,

    CONSTRAINT "bank_statements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_statement_lines" (
    "id" UUID NOT NULL,
    "statementId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "type" VARCHAR(10) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "documentNumber" VARCHAR(50),
    "reconciled" BOOLEAN NOT NULL DEFAULT false,
    "matchedMovementId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_statement_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payable_titles" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "branchId" UUID,
    "supplierId" UUID NOT NULL,
    "titleNumber" VARCHAR(50) NOT NULL,
    "installment" INTEGER NOT NULL DEFAULT 1,
    "issueDate" DATE NOT NULL,
    "dueDate" DATE NOT NULL,
    "originalAmount" DECIMAL(18,4) NOT NULL,
    "netAmount" DECIMAL(18,4) NOT NULL,
    "paidAmount" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "balance" DECIMAL(18,4) NOT NULL,
    "currencyCode" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "exchangeRate" DECIMAL(18,8) NOT NULL DEFAULT 1,
    "status" VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    "approvalStatus" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "paymentMethod" VARCHAR(20),
    "barcode" VARCHAR(60),
    "description" VARCHAR(500),
    "nfNumber" VARCHAR(50),
    "nfSeries" VARCHAR(10),
    "sourceModule" VARCHAR(50),
    "sourceId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "payable_titles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payable_cost_allocations" (
    "id" UUID NOT NULL,
    "titleId" UUID NOT NULL,
    "costCenterId" UUID NOT NULL,
    "projectId" UUID,
    "branchId" UUID,
    "percentage" DECIMAL(8,4) NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "payable_cost_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payable_taxes" (
    "id" UUID NOT NULL,
    "titleId" UUID NOT NULL,
    "taxType" VARCHAR(20) NOT NULL,
    "baseAmount" DECIMAL(18,4) NOT NULL,
    "rate" DECIMAL(8,4) NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "withheld" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "payable_taxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payable_approvals" (
    "id" UUID NOT NULL,
    "titleId" UUID NOT NULL,
    "step" INTEGER NOT NULL,
    "userId" UUID NOT NULL,
    "action" VARCHAR(20) NOT NULL,
    "comments" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payable_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receivable_titles" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "branchId" UUID,
    "clientId" UUID NOT NULL,
    "titleNumber" VARCHAR(50) NOT NULL,
    "installment" INTEGER NOT NULL DEFAULT 1,
    "issueDate" DATE NOT NULL,
    "dueDate" DATE NOT NULL,
    "originalAmount" DECIMAL(18,4) NOT NULL,
    "netAmount" DECIMAL(18,4) NOT NULL,
    "receivedAmount" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "balance" DECIMAL(18,4) NOT NULL,
    "currencyCode" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "status" VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    "source" VARCHAR(50) NOT NULL DEFAULT 'MANUAL',
    "sourceId" UUID,
    "description" VARCHAR(500),
    "nfNumber" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,

    CONSTRAINT "receivable_titles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boletos" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "receivableId" UUID NOT NULL,
    "ourNumber" VARCHAR(20) NOT NULL,
    "barcode" VARCHAR(60),
    "digitableLine" VARCHAR(60),
    "bankAccountId" UUID NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "dueDate" DATE NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'GENERATED',
    "paidAt" TIMESTAMP(3),
    "paidAmount" DECIMAL(18,4),
    "registrationStatus" VARCHAR(20),
    "cnabRemessaId" UUID,
    "cnabRetornoId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boletos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_negotiations" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "receivableId" UUID NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "originalAmount" DECIMAL(18,4) NOT NULL,
    "negotiatedAmount" DECIMAL(18,4) NOT NULL,
    "discountAmount" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "newDueDate" DATE,
    "installments" INTEGER NOT NULL DEFAULT 1,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "comments" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,

    CONSTRAINT "client_negotiations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_requests" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "needByDate" DATE,
    "costCenterId" UUID,
    "projectId" UUID,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "totalEstimated" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,

    CONSTRAINT "purchase_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_request_items" (
    "id" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "unit" VARCHAR(10) NOT NULL DEFAULT 'UN',
    "estimatedUnitPrice" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "productServiceCodeId" UUID,

    CONSTRAINT "purchase_request_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotations" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "purchaseRequestId" UUID NOT NULL,
    "supplierId" UUID NOT NULL,
    "validUntil" DATE,
    "paymentTerms" VARCHAR(200),
    "deliveryTerms" VARCHAR(200),
    "deliveryDays" INTEGER,
    "totalAmount" DECIMAL(18,4) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "selectedBy" UUID,
    "selectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_items" (
    "id" UUID NOT NULL,
    "quotationId" UUID NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "unit" VARCHAR(10) NOT NULL DEFAULT 'UN',
    "unitPrice" DECIMAL(18,4) NOT NULL,
    "discount" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "totalPrice" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "quotation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "orderNumber" VARCHAR(20) NOT NULL,
    "supplierId" UUID NOT NULL,
    "quotationId" UUID,
    "purchaseRequestId" UUID,
    "costCenterId" UUID,
    "projectId" UUID,
    "expectedDeliveryDate" DATE,
    "paymentTerms" VARCHAR(200),
    "currencyCode" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "totalAmount" DECIMAL(18,4) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_items" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "unit" VARCHAR(10) NOT NULL DEFAULT 'UN',
    "unitPrice" DECIMAL(18,4) NOT NULL,
    "totalPrice" DECIMAL(18,4) NOT NULL,
    "receivedQuantity" DECIMAL(18,4) NOT NULL DEFAULT 0,

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receivings" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "receivingNumber" VARCHAR(20) NOT NULL,
    "purchaseOrderId" UUID NOT NULL,
    "receivingDate" DATE NOT NULL,
    "nfNumber" VARCHAR(50),
    "nfSeries" VARCHAR(10),
    "nfAccessKey" VARCHAR(50),
    "totalAmount" DECIMAL(18,4) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'RECEIVED',
    "comments" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,

    CONSTRAINT "receivings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receiving_items" (
    "id" UUID NOT NULL,
    "receivingId" UUID NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "quantityReceived" DECIMAL(18,4) NOT NULL,
    "unitPrice" DECIMAL(18,4) NOT NULL,
    "totalPrice" DECIMAL(18,4) NOT NULL,
    "unit" VARCHAR(10) NOT NULL DEFAULT 'UN',
    "orderItemId" UUID,

    CONSTRAINT "receiving_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "contractNumber" VARCHAR(30) NOT NULL,
    "supplierId" UUID NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "totalValue" DECIMAL(18,4) NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "renewalMonths" INTEGER,
    "indexerId" UUID,
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "approvalStatus" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "costCenterId" UUID,
    "projectId" UUID,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_installments" (
    "id" UUID NOT NULL,
    "contractId" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "dueDate" DATE NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "payableId" UUID,
    "releasedAt" TIMESTAMP(3),
    "releasedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_installments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_addendums" (
    "id" UUID NOT NULL,
    "contractId" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "valueChange" DECIMAL(18,4),
    "newEndDate" DATE,
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,

    CONSTRAINT "contract_addendums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "branchId" UUID,
    "invoiceNumber" VARCHAR(30) NOT NULL,
    "clientId" UUID NOT NULL,
    "issueDate" DATE NOT NULL,
    "dueDate" DATE NOT NULL,
    "description" VARCHAR(500),
    "subtotal" DECIMAL(18,4) NOT NULL,
    "taxTotal" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(18,4) NOT NULL,
    "currencyCode" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "exchangeRate" DECIMAL(18,8) NOT NULL DEFAULT 1,
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "nfseNumber" VARCHAR(30),
    "nfseStatus" VARCHAR(20),
    "costCenterId" UUID,
    "projectId" UUID,
    "receivableId" UUID,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" UUID NOT NULL,
    "invoiceId" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "serviceCode" VARCHAR(20),
    "quantity" DECIMAL(18,4) NOT NULL,
    "unitPrice" DECIMAL(18,4) NOT NULL,
    "totalPrice" DECIMAL(18,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_taxes" (
    "id" UUID NOT NULL,
    "invoiceId" UUID NOT NULL,
    "taxType" VARCHAR(20) NOT NULL,
    "baseAmount" DECIMAL(18,4) NOT NULL,
    "rate" DECIMAL(8,4) NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "withheld" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_taxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_groups" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "usefulLife" INTEGER NOT NULL,
    "deprecRate" DECIMAL(8,4) NOT NULL,
    "accountId" UUID,
    "depAccountId" UUID,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "assetNumber" VARCHAR(30) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "groupId" UUID NOT NULL,
    "acquisitionDate" DATE NOT NULL,
    "acquisitionValue" DECIMAL(18,4) NOT NULL,
    "residualValue" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "currentValue" DECIMAL(18,4) NOT NULL,
    "accumulatedDeprec" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "costCenterId" UUID,
    "branchId" UUID,
    "location" VARCHAR(200),
    "serialNumber" VARCHAR(100),
    "invoiceNumber" VARCHAR(30),
    "supplierId" UUID,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "writtenOffAt" TIMESTAMP(3),
    "writtenOffBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_depreciations" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "accumulated" DECIMAL(18,4) NOT NULL,
    "bookValue" DECIMAL(18,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_depreciations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_transfers" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "fromCostCenter" UUID,
    "toCostCenter" UUID,
    "fromBranch" UUID,
    "toBranch" UUID,
    "transferDate" DATE NOT NULL,
    "reason" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,

    CONSTRAINT "asset_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlements" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "settlementNumber" VARCHAR(30) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "sourceModule" VARCHAR(30) NOT NULL,
    "sourceId" UUID,
    "amount" DECIMAL(18,4) NOT NULL,
    "date" DATE NOT NULL,
    "description" VARCHAR(500),
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "settledAt" TIMESTAMP(3),
    "bankAccountId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlement_approvals" (
    "id" UUID NOT NULL,
    "settlementId" UUID NOT NULL,
    "step" INTEGER NOT NULL,
    "userId" UUID NOT NULL,
    "action" VARCHAR(20) NOT NULL,
    "comments" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settlement_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ddr_reports" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "referenceDate" DATE NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "reviewedBy" UUID,
    "reviewedAt" TIMESTAMP(3),
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "protocolNumber" VARCHAR(50),
    "notes" TEXT,
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "ddr_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ddr_entries" (
    "id" UUID NOT NULL,
    "reportId" UUID NOT NULL,
    "accountCode" VARCHAR(6) NOT NULL,
    "currencyCode" VARCHAR(3),
    "countryCode" VARCHAR(2),
    "positionType" INTEGER,
    "value" DECIMAL(18,2) NOT NULL,
    "isCalculated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ddr_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ddr_parameters" (
    "id" UUID NOT NULL,
    "reportId" UUID NOT NULL,
    "parameterCode" VARCHAR(20) NOT NULL,
    "value" DECIMAL(18,8) NOT NULL,
    "source" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ddr_parameters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_cnpj_key" ON "companies"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "branches_companyId_code_key" ON "branches"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "users_companyId_email_key" ON "users"("companyId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_companyId_name_key" ON "roles"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_resource_action_key" ON "permissions"("resource", "action");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON "role_permissions"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_userId_roleId_branchId_key" ON "user_roles"("userId", "roleId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "user_authority_limits_userId_resource_costCenterId_branchId_key" ON "user_authority_limits"("userId", "resource", "costCenterId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_companyId_resource_createdAt_idx" ON "audit_logs"("companyId", "resource", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "cost_centers_companyId_code_key" ON "cost_centers"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "projects_companyId_code_key" ON "projects"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_companyId_cpfCnpj_key" ON "suppliers"("companyId", "cpfCnpj");

-- CreateIndex
CREATE UNIQUE INDEX "clients_companyId_cpfCnpj_key" ON "clients"("companyId", "cpfCnpj");

-- CreateIndex
CREATE UNIQUE INDEX "banks_compeCode_key" ON "banks"("compeCode");

-- CreateIndex
CREATE UNIQUE INDEX "bank_agencies_bankId_code_key" ON "bank_agencies"("bankId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "own_bank_accounts_companyId_bankAgencyId_accountNum_key" ON "own_bank_accounts"("companyId", "bankAgencyId", "accountNum");

-- CreateIndex
CREATE UNIQUE INDEX "currencies_code_key" ON "currencies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_currencyId_date_key" ON "exchange_rates"("currencyId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "indexers_code_key" ON "indexers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "indexer_quotations_indexerId_date_key" ON "indexer_quotations"("indexerId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "municipalities_ibgeCode_key" ON "municipalities"("ibgeCode");

-- CreateIndex
CREATE UNIQUE INDEX "product_service_codes_companyId_code_key" ON "product_service_codes"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "corporate_groups_code_key" ON "corporate_groups"("code");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_chartId_code_key" ON "accounts"("chartId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "accounting_periods_companyId_year_month_key" ON "accounting_periods"("companyId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_companyId_entryNumber_key" ON "journal_entries"("companyId", "entryNumber");

-- CreateIndex
CREATE UNIQUE INDEX "account_balances_companyId_accountId_periodId_key" ON "account_balances"("companyId", "accountId", "periodId");

-- CreateIndex
CREATE UNIQUE INDEX "standard_entries_companyId_code_key" ON "standard_entries"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "budgets_companyId_year_version_key" ON "budgets"("companyId", "year", "version");

-- CreateIndex
CREATE UNIQUE INDEX "budget_lines_budgetId_accountId_costCenterId_branchId_key" ON "budget_lines"("budgetId", "accountId", "costCenterId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "budget_executions_budgetLineId_month_documentId_key" ON "budget_executions"("budgetLineId", "month", "documentId");

-- CreateIndex
CREATE UNIQUE INDEX "cash_accounts_companyId_name_key" ON "cash_accounts"("companyId", "name");

-- CreateIndex
CREATE INDEX "cash_movements_companyId_cashAccountId_date_idx" ON "cash_movements"("companyId", "cashAccountId", "date");

-- CreateIndex
CREATE INDEX "payable_titles_companyId_status_dueDate_idx" ON "payable_titles"("companyId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "payable_titles_companyId_supplierId_idx" ON "payable_titles"("companyId", "supplierId");

-- CreateIndex
CREATE INDEX "receivable_titles_companyId_status_dueDate_idx" ON "receivable_titles"("companyId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "receivable_titles_companyId_clientId_idx" ON "receivable_titles"("companyId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "boletos_companyId_ourNumber_key" ON "boletos"("companyId", "ourNumber");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_companyId_orderNumber_key" ON "purchase_orders"("companyId", "orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "receivings_companyId_receivingNumber_key" ON "receivings"("companyId", "receivingNumber");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_companyId_contractNumber_key" ON "contracts"("companyId", "contractNumber");

-- CreateIndex
CREATE UNIQUE INDEX "contract_installments_contractId_number_key" ON "contract_installments"("contractId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "contract_addendums_contractId_number_key" ON "contract_addendums"("contractId", "number");

-- CreateIndex
CREATE INDEX "invoices_companyId_clientId_idx" ON "invoices"("companyId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_companyId_invoiceNumber_key" ON "invoices"("companyId", "invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "asset_groups_companyId_code_key" ON "asset_groups"("companyId", "code");

-- CreateIndex
CREATE INDEX "assets_companyId_status_idx" ON "assets"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "assets_companyId_assetNumber_key" ON "assets"("companyId", "assetNumber");

-- CreateIndex
CREATE UNIQUE INDEX "asset_depreciations_assetId_periodYear_periodMonth_key" ON "asset_depreciations"("assetId", "periodYear", "periodMonth");

-- CreateIndex
CREATE INDEX "settlements_companyId_status_date_idx" ON "settlements"("companyId", "status", "date");

-- CreateIndex
CREATE UNIQUE INDEX "settlements_companyId_settlementNumber_key" ON "settlements"("companyId", "settlementNumber");

-- CreateIndex
CREATE INDEX "ddr_reports_companyId_status_idx" ON "ddr_reports"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ddr_reports_companyId_referenceDate_key" ON "ddr_reports"("companyId", "referenceDate");

-- CreateIndex
CREATE INDEX "ddr_entries_reportId_idx" ON "ddr_entries"("reportId");

-- CreateIndex
CREATE INDEX "ddr_entries_accountCode_idx" ON "ddr_entries"("accountCode");

-- CreateIndex
CREATE UNIQUE INDEX "ddr_entries_reportId_accountCode_currencyCode_countryCode_p_key" ON "ddr_entries"("reportId", "accountCode", "currencyCode", "countryCode", "positionType");

-- CreateIndex
CREATE UNIQUE INDEX "ddr_parameters_reportId_parameterCode_key" ON "ddr_parameters"("reportId", "parameterCode");

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_centers" ADD CONSTRAINT "cost_centers_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "cost_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_agencies" ADD CONSTRAINT "bank_agencies_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "banks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "own_bank_accounts" ADD CONSTRAINT "own_bank_accounts_bankAgencyId_fkey" FOREIGN KEY ("bankAgencyId") REFERENCES "bank_agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "currencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indexer_quotations" ADD CONSTRAINT "indexer_quotations_indexerId_fkey" FOREIGN KEY ("indexerId") REFERENCES "indexers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_chartId_fkey" FOREIGN KEY ("chartId") REFERENCES "charts_of_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "accounting_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_balances" ADD CONSTRAINT "account_balances_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_balances" ADD CONSTRAINT "account_balances_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "accounting_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_lines" ADD CONSTRAINT "budget_lines_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_reallocations" ADD CONSTRAINT "budget_reallocations_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_executions" ADD CONSTRAINT "budget_executions_budgetLineId_fkey" FOREIGN KEY ("budgetLineId") REFERENCES "budget_lines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_cashAccountId_fkey" FOREIGN KEY ("cashAccountId") REFERENCES "cash_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_statement_lines" ADD CONSTRAINT "bank_statement_lines_statementId_fkey" FOREIGN KEY ("statementId") REFERENCES "bank_statements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payable_cost_allocations" ADD CONSTRAINT "payable_cost_allocations_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "payable_titles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payable_taxes" ADD CONSTRAINT "payable_taxes_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "payable_titles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payable_approvals" ADD CONSTRAINT "payable_approvals_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "payable_titles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boletos" ADD CONSTRAINT "boletos_receivableId_fkey" FOREIGN KEY ("receivableId") REFERENCES "receivable_titles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_negotiations" ADD CONSTRAINT "client_negotiations_receivableId_fkey" FOREIGN KEY ("receivableId") REFERENCES "receivable_titles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_request_items" ADD CONSTRAINT "purchase_request_items_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "purchase_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "purchase_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receivings" ADD CONSTRAINT "receivings_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receiving_items" ADD CONSTRAINT "receiving_items_receivingId_fkey" FOREIGN KEY ("receivingId") REFERENCES "receivings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_installments" ADD CONSTRAINT "contract_installments_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_addendums" ADD CONSTRAINT "contract_addendums_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_taxes" ADD CONSTRAINT "invoice_taxes_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "asset_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_depreciations" ADD CONSTRAINT "asset_depreciations_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_transfers" ADD CONSTRAINT "asset_transfers_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_approvals" ADD CONSTRAINT "settlement_approvals_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "settlements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ddr_reports" ADD CONSTRAINT "ddr_reports_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ddr_entries" ADD CONSTRAINT "ddr_entries_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "ddr_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ddr_parameters" ADD CONSTRAINT "ddr_parameters_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "ddr_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
