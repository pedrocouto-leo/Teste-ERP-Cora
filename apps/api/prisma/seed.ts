import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default company
  const company = await prisma.company.upsert({
    where: { cnpj: '00.000.000/0001-00' },
    update: {},
    create: {
      name: 'CORA Sociedade de Crédito, Financiamento e Investimento S.A.',
      tradeName: 'CORA SCFI',
      cnpj: '00.000.000/0001-00',
      active: true,
    },
  });

  console.log(`Company created: ${company.name}`);

  // Create default branch
  const branch = await prisma.branch.upsert({
    where: { companyId_code: { companyId: company.id, code: 'MATRIZ' } },
    update: {},
    create: {
      companyId: company.id,
      name: 'Matriz',
      code: 'MATRIZ',
      active: true,
    },
  });

  console.log(`Branch created: ${branch.name}`);

  // Create admin role
  const adminRole = await prisma.role.upsert({
    where: { companyId_name: { companyId: company.id, name: 'ADMIN' } },
    update: {},
    create: {
      companyId: company.id,
      name: 'ADMIN',
      description: 'Administrador do sistema com acesso total',
      active: true,
    },
  });

  console.log(`Role created: ${adminRole.name}`);

  // Create admin user
  const passwordHash = await bcrypt.hash('Admin@123456', 12);
  const adminUser = await prisma.user.upsert({
    where: {
      companyId_email: {
        companyId: company.id,
        email: 'admin@cora.com.br',
      },
    },
    update: {},
    create: {
      companyId: company.id,
      email: 'admin@cora.com.br',
      name: 'Administrador',
      passwordHash,
      active: true,
      mustChangePass: true,
    },
  });

  console.log(`Admin user created: ${adminUser.email}`);

  // Assign admin role
  await prisma.userRole.upsert({
    where: {
      userId_roleId_branchId: {
        userId: adminUser.id,
        roleId: adminRole.id,
        branchId: branch.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
      branchId: branch.id,
    },
  });

  console.log('Admin role assigned');

  // Seed base permissions
  const permissions = [
    // Cadastro
    { resource: 'cadastro/companies', action: 'read' },
    { resource: 'cadastro/companies', action: 'create' },
    { resource: 'cadastro/companies', action: 'update' },
    { resource: 'cadastro/companies', action: 'delete' },
    { resource: 'cadastro/suppliers', action: 'read' },
    { resource: 'cadastro/suppliers', action: 'create' },
    { resource: 'cadastro/suppliers', action: 'update' },
    { resource: 'cadastro/suppliers', action: 'approve' },
    { resource: 'cadastro/clients', action: 'read' },
    { resource: 'cadastro/clients', action: 'create' },
    { resource: 'cadastro/clients', action: 'update' },
    { resource: 'cadastro/clients', action: 'delete' },
    { resource: 'cadastro/cost-centers', action: 'read' },
    { resource: 'cadastro/cost-centers', action: 'create' },
    { resource: 'cadastro/cost-centers', action: 'update' },
    // Access Control
    { resource: 'auth/users', action: 'read' },
    { resource: 'auth/users', action: 'create' },
    { resource: 'auth/users', action: 'update' },
    { resource: 'auth/users', action: 'delete' },
    { resource: 'auth/roles', action: 'read' },
    { resource: 'auth/roles', action: 'create' },
    { resource: 'auth/roles', action: 'update' },
    { resource: 'auth/audit', action: 'read' },
    // Financeiro
    { resource: 'contas-pagar/titles', action: 'read' },
    { resource: 'contas-pagar/titles', action: 'create' },
    { resource: 'contas-pagar/titles', action: 'approve' },
    { resource: 'contas-receber/titles', action: 'read' },
    { resource: 'contas-receber/titles', action: 'create' },
    { resource: 'contabilidade/entries', action: 'read' },
    { resource: 'contabilidade/entries', action: 'create' },
    { resource: 'contabilidade/entries', action: 'approve' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: {
        resource_action: {
          resource: perm.resource,
          action: perm.action,
        },
      },
      update: {},
      create: {
        resource: perm.resource,
        action: perm.action,
        description: `${perm.action} ${perm.resource}`,
      },
    });
  }

  console.log(`${permissions.length} permissions seeded`);

  // Assign all permissions to admin role
  const allPermissions = await prisma.permission.findMany();
  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: perm.id,
      },
    });
  }

  console.log('All permissions assigned to ADMIN role');

  // Seed Brazilian banks
  const banks = [
    { compeCode: '001', ispbCode: '00000000', name: 'Banco do Brasil S.A.' },
    { compeCode: '033', ispbCode: '90400888', name: 'Banco Santander (Brasil) S.A.' },
    { compeCode: '104', ispbCode: '00360305', name: 'Caixa Econômica Federal' },
    { compeCode: '237', ispbCode: '60746948', name: 'Banco Bradesco S.A.' },
    { compeCode: '341', ispbCode: '60701190', name: 'Itaú Unibanco S.A.' },
    { compeCode: '260', ispbCode: '18236120', name: 'Nu Pagamentos S.A. (Nubank)' },
    { compeCode: '077', ispbCode: '00416968', name: 'Banco Inter S.A.' },
    { compeCode: '336', ispbCode: '31872495', name: 'Banco C6 S.A.' },
    { compeCode: '403', ispbCode: '37880206', name: 'Cora Sociedade de Crédito' },
    { compeCode: '208', ispbCode: '30306294', name: 'Banco BTG Pactual S.A.' },
  ];

  for (const bank of banks) {
    await prisma.bank.upsert({
      where: { compeCode: bank.compeCode },
      update: {},
      create: bank,
    });
  }

  console.log(`${banks.length} banks seeded`);

  // Seed currencies
  const currencies = [
    { code: 'BRL', name: 'Real Brasileiro', symbol: 'R$', decimals: 2 },
    { code: 'USD', name: 'Dólar Americano', symbol: 'US$', decimals: 2 },
    { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2 },
  ];

  for (const currency of currencies) {
    await prisma.currency.upsert({
      where: { code: currency.code },
      update: {},
      create: currency,
    });
  }

  console.log(`${currencies.length} currencies seeded`);

  // Seed common indexers
  const indexers = [
    { code: 'CDI', name: 'Certificado de Depósito Interbancário' },
    { code: 'SELIC', name: 'Taxa Selic' },
    { code: 'IPCA', name: 'Índice Nacional de Preços ao Consumidor Amplo' },
    { code: 'IGPM', name: 'Índice Geral de Preços do Mercado' },
    { code: 'INPC', name: 'Índice Nacional de Preços ao Consumidor' },
    { code: 'TR', name: 'Taxa Referencial' },
  ];

  for (const indexer of indexers) {
    await prisma.indexer.upsert({
      where: { code: indexer.code },
      update: {},
      create: indexer,
    });
  }

  console.log(`${indexers.length} indexers seeded`);

  // ============================================================
  // DDR - Documento 2011 (Dados Fictícios)
  // ============================================================

  console.log('Seeding DDR data...');

  // DDR Report 1 - DRAFT (hoje)
  const ddrDraft = await prisma.ddrReport.upsert({
    where: { companyId_referenceDate: { companyId: company.id, referenceDate: new Date('2026-03-23') } },
    update: {},
    create: {
      companyId: company.id,
      referenceDate: new Date('2026-03-23'),
      status: 'DRAFT',
      notes: 'Relatório diário em elaboração',
      createdBy: adminUser.id,
    },
  });

  // DDR Report 2 - APPROVED (ontem)
  const ddrApproved = await prisma.ddrReport.upsert({
    where: { companyId_referenceDate: { companyId: company.id, referenceDate: new Date('2026-03-20') } },
    update: {},
    create: {
      companyId: company.id,
      referenceDate: new Date('2026-03-20'),
      status: 'APPROVED',
      notes: 'Revisado e aprovado pela diretoria',
      createdBy: adminUser.id,
      reviewedBy: adminUser.id,
      reviewedAt: new Date('2026-03-21T10:00:00Z'),
      approvedBy: adminUser.id,
      approvedAt: new Date('2026-03-21T14:00:00Z'),
    },
  });

  // DDR Report 3 - SUBMITTED (semana passada)
  const ddrSubmitted = await prisma.ddrReport.upsert({
    where: { companyId_referenceDate: { companyId: company.id, referenceDate: new Date('2026-03-19') } },
    update: {},
    create: {
      companyId: company.id,
      referenceDate: new Date('2026-03-19'),
      status: 'SUBMITTED',
      notes: 'Enviado ao BCB via Sisbacen',
      createdBy: adminUser.id,
      reviewedBy: adminUser.id,
      reviewedAt: new Date('2026-03-20T09:00:00Z'),
      approvedBy: adminUser.id,
      approvedAt: new Date('2026-03-20T11:00:00Z'),
      submittedAt: new Date('2026-03-20T15:00:00Z'),
      protocolNumber: 'DDR-2026-0319-001',
    },
  });

  // DDR Report 4 - PENDING_REVIEW
  const ddrPending = await prisma.ddrReport.upsert({
    where: { companyId_referenceDate: { companyId: company.id, referenceDate: new Date('2026-03-18') } },
    update: {},
    create: {
      companyId: company.id,
      referenceDate: new Date('2026-03-18'),
      status: 'PENDING_REVIEW',
      createdBy: adminUser.id,
    },
  });

  // DDR Report 5 - REJECTED
  const ddrRejected = await prisma.ddrReport.upsert({
    where: { companyId_referenceDate: { companyId: company.id, referenceDate: new Date('2026-03-17') } },
    update: {},
    create: {
      companyId: company.id,
      referenceDate: new Date('2026-03-17'),
      status: 'REJECTED',
      notes: 'Valores de posição USD inconsistentes com tesouraria',
      createdBy: adminUser.id,
    },
  });

  console.log('5 DDR reports created');

  // ---- Entries for DRAFT report (today) ----
  const draftEntries = [
    // FX Positions (Posições Cambiais) - Grupo 11/12/13/14/15
    { accountCode: '111000', currencyCode: '220', countryCode: null, positionType: 1, value: 15000000.00, isCalculated: false },
    { accountCode: '111000', currencyCode: '220', countryCode: null, positionType: 2, value: 8500000.00, isCalculated: false },
    { accountCode: '111000', currencyCode: '978', countryCode: null, positionType: 1, value: 3200000.00, isCalculated: false },
    { accountCode: '111000', currencyCode: '826', countryCode: null, positionType: 1, value: 1800000.00, isCalculated: false },
    { accountCode: '121000', currencyCode: '220', countryCode: null, positionType: 1, value: 12000000.00, isCalculated: false },
    { accountCode: '121000', currencyCode: '220', countryCode: null, positionType: 2, value: 7200000.00, isCalculated: false },
    { accountCode: '121000', currencyCode: '978', countryCode: null, positionType: 1, value: 2800000.00, isCalculated: false },
    { accountCode: '121000', currencyCode: '826', countryCode: null, positionType: 1, value: 1500000.00, isCalculated: false },
    { accountCode: '131000', currencyCode: '220', countryCode: null, positionType: 1, value: 500000.00, isCalculated: false },
    { accountCode: '132000', currencyCode: '220', countryCode: null, positionType: 1, value: 300000.00, isCalculated: false },

    // Liquidity (Liquidez) - Grupo 21/22/23/24
    { accountCode: '211000', currencyCode: null, countryCode: null, positionType: null, value: 45000000.00, isCalculated: false },
    { accountCode: '212000', currencyCode: null, countryCode: null, positionType: null, value: 38000000.00, isCalculated: false },
    { accountCode: '221000', currencyCode: null, countryCode: null, positionType: null, value: 52000000.00, isCalculated: false },
    { accountCode: '231000', currencyCode: null, countryCode: null, positionType: null, value: 120000000.00, isCalculated: false },

    // RWACAM inputs - Grupo 31
    { accountCode: '310101', currencyCode: null, countryCode: null, positionType: null, value: 4200000.00, isCalculated: false },
    { accountCode: '310102', currencyCode: null, countryCode: null, positionType: null, value: 700000.00, isCalculated: false },
    { accountCode: '310103', currencyCode: null, countryCode: null, positionType: null, value: 150000.00, isCalculated: false },
    { accountCode: '310104', currencyCode: null, countryCode: null, positionType: null, value: 85000.00, isCalculated: false },

    // Market Risk inputs - Grupo 41
    { accountCode: '410101', currencyCode: null, countryCode: null, positionType: null, value: 180000000.00, isCalculated: false },
    { accountCode: '410201', currencyCode: null, countryCode: null, positionType: null, value: 2100000.00, isCalculated: false },
    { accountCode: '410202', currencyCode: null, countryCode: null, positionType: null, value: 890000.00, isCalculated: false },
    { accountCode: '410301', currencyCode: null, countryCode: null, positionType: null, value: 1.15, isCalculated: false },
    { accountCode: '410302', currencyCode: null, countryCode: null, positionType: null, value: 1.08, isCalculated: false },
    { accountCode: '410501', currencyCode: null, countryCode: null, positionType: null, value: 1500000.00, isCalculated: false },
    { accountCode: '410502', currencyCode: null, countryCode: null, positionType: null, value: 980000.00, isCalculated: false },
    { accountCode: '410503', currencyCode: null, countryCode: null, positionType: null, value: 450000.00, isCalculated: false },
    { accountCode: '410504', currencyCode: null, countryCode: null, positionType: null, value: 320000.00, isCalculated: false },
    { accountCode: '410601', currencyCode: null, countryCode: null, positionType: null, value: 750000.00, isCalculated: false },
    { accountCode: '410602', currencyCode: null, countryCode: null, positionType: null, value: 420000.00, isCalculated: false },
    { accountCode: '410603', currencyCode: null, countryCode: null, positionType: null, value: 180000.00, isCalculated: false },
    { accountCode: '410604', currencyCode: null, countryCode: null, positionType: null, value: 95000.00, isCalculated: false },
    { accountCode: '410701', currencyCode: null, countryCode: null, positionType: null, value: 320000.00, isCalculated: false },
    { accountCode: '410702', currencyCode: null, countryCode: null, positionType: null, value: 150000.00, isCalculated: false },
    { accountCode: '410703', currencyCode: null, countryCode: null, positionType: null, value: 85000.00, isCalculated: false },
    { accountCode: '410704', currencyCode: null, countryCode: null, positionType: null, value: 42000.00, isCalculated: false },
    { accountCode: '410801', currencyCode: null, countryCode: null, positionType: null, value: 200000.00, isCalculated: false },
    { accountCode: '410802', currencyCode: null, countryCode: null, positionType: null, value: 110000.00, isCalculated: false },
    { accountCode: '410901', currencyCode: null, countryCode: null, positionType: null, value: 180000.00, isCalculated: false },
    { accountCode: '410904', currencyCode: null, countryCode: null, positionType: null, value: 95000.00, isCalculated: false },
    { accountCode: '410907', currencyCode: null, countryCode: null, positionType: null, value: 45000.00, isCalculated: false },
    { accountCode: '410908', currencyCode: null, countryCode: null, positionType: null, value: 32000.00, isCalculated: false },

    // Internal Models - Grupo 50/51
    { accountCode: '501000', currencyCode: null, countryCode: null, positionType: null, value: 0.00, isCalculated: false },
    { accountCode: '502000', currencyCode: null, countryCode: null, positionType: null, value: 0.00, isCalculated: false },
  ];

  for (const entry of draftEntries) {
    await prisma.ddrEntry.upsert({
      where: {
        reportId_accountCode_currencyCode_countryCode_positionType: {
          reportId: ddrDraft.id,
          accountCode: entry.accountCode,
          currencyCode: entry.currencyCode ?? '',
          countryCode: entry.countryCode ?? '',
          positionType: entry.positionType ?? 0,
        },
      },
      update: { value: entry.value },
      create: {
        reportId: ddrDraft.id,
        accountCode: entry.accountCode,
        currencyCode: entry.currencyCode,
        countryCode: entry.countryCode,
        positionType: entry.positionType,
        value: entry.value,
        isCalculated: entry.isCalculated,
      },
    });
  }

  console.log(`${draftEntries.length} entries added to DRAFT DDR`);

  // ---- Entries for APPROVED report (with calculated values) ----
  const approvedEntries = [
    // FX Positions
    { accountCode: '111000', currencyCode: '220', countryCode: null, positionType: 1, value: 14500000.00, isCalculated: false },
    { accountCode: '111000', currencyCode: '220', countryCode: null, positionType: 2, value: 8000000.00, isCalculated: false },
    { accountCode: '111000', currencyCode: '978', countryCode: null, positionType: 1, value: 3000000.00, isCalculated: false },
    { accountCode: '121000', currencyCode: '220', countryCode: null, positionType: 1, value: 11500000.00, isCalculated: false },
    { accountCode: '121000', currencyCode: '220', countryCode: null, positionType: 2, value: 7000000.00, isCalculated: false },
    { accountCode: '121000', currencyCode: '978', countryCode: null, positionType: 1, value: 2700000.00, isCalculated: false },
    { accountCode: '131000', currencyCode: '220', countryCode: null, positionType: 1, value: 400000.00, isCalculated: false },
    { accountCode: '132000', currencyCode: '220', countryCode: null, positionType: 1, value: 250000.00, isCalculated: false },
    // Calculated net positions
    { accountCode: '141000', currencyCode: '220', countryCode: null, positionType: 1, value: 3150000.00, isCalculated: true },
    { accountCode: '141000', currencyCode: '978', countryCode: null, positionType: 1, value: 300000.00, isCalculated: true },
    // RWACAM calculated
    { accountCode: '310101', currencyCode: null, countryCode: null, positionType: null, value: 3850000.00, isCalculated: false },
    { accountCode: '310102', currencyCode: null, countryCode: null, positionType: null, value: 650000.00, isCalculated: false },
    { accountCode: '310103', currencyCode: null, countryCode: null, positionType: null, value: 120000.00, isCalculated: false },
    { accountCode: '310104', currencyCode: null, countryCode: null, positionType: null, value: 75000.00, isCalculated: false },
    { accountCode: '310100', currencyCode: null, countryCode: null, positionType: null, value: 4695000.00, isCalculated: true },
    { accountCode: '310105', currencyCode: null, countryCode: null, positionType: null, value: 28.50, isCalculated: true },
    { accountCode: '310000', currencyCode: null, countryCode: null, positionType: null, value: 1338075.00, isCalculated: true },
    // Market Risk
    { accountCode: '410101', currencyCode: null, countryCode: null, positionType: null, value: 175000000.00, isCalculated: false },
    { accountCode: '410201', currencyCode: null, countryCode: null, positionType: null, value: 2000000.00, isCalculated: false },
    { accountCode: '410202', currencyCode: null, countryCode: null, positionType: null, value: 850000.00, isCalculated: false },
    { accountCode: '410200', currencyCode: null, countryCode: null, positionType: null, value: 2850000.00, isCalculated: true },
    { accountCode: '410301', currencyCode: null, countryCode: null, positionType: null, value: 1.12, isCalculated: false },
    { accountCode: '410302', currencyCode: null, countryCode: null, positionType: null, value: 1.05, isCalculated: false },
    { accountCode: '410300', currencyCode: null, countryCode: null, positionType: null, value: 2.17, isCalculated: true },
    { accountCode: '410401', currencyCode: null, countryCode: null, positionType: null, value: 2000000.00, isCalculated: true },
    { accountCode: '410402', currencyCode: null, countryCode: null, positionType: null, value: 850000.00, isCalculated: true },
    { accountCode: '410400', currencyCode: null, countryCode: null, positionType: null, value: 2850000.00, isCalculated: true },
    { accountCode: '410501', currencyCode: null, countryCode: null, positionType: null, value: 1400000.00, isCalculated: false },
    { accountCode: '410502', currencyCode: null, countryCode: null, positionType: null, value: 920000.00, isCalculated: false },
    { accountCode: '410503', currencyCode: null, countryCode: null, positionType: null, value: 410000.00, isCalculated: false },
    { accountCode: '410504', currencyCode: null, countryCode: null, positionType: null, value: 300000.00, isCalculated: false },
    { accountCode: '410500', currencyCode: null, countryCode: null, positionType: null, value: 3030000.00, isCalculated: true },
    { accountCode: '410601', currencyCode: null, countryCode: null, positionType: null, value: 700000.00, isCalculated: false },
    { accountCode: '410602', currencyCode: null, countryCode: null, positionType: null, value: 380000.00, isCalculated: false },
    { accountCode: '410603', currencyCode: null, countryCode: null, positionType: null, value: 160000.00, isCalculated: false },
    { accountCode: '410604', currencyCode: null, countryCode: null, positionType: null, value: 85000.00, isCalculated: false },
    { accountCode: '410600', currencyCode: null, countryCode: null, positionType: null, value: 1325000.00, isCalculated: true },
    { accountCode: '410701', currencyCode: null, countryCode: null, positionType: null, value: 290000.00, isCalculated: false },
    { accountCode: '410702', currencyCode: null, countryCode: null, positionType: null, value: 130000.00, isCalculated: false },
    { accountCode: '410703', currencyCode: null, countryCode: null, positionType: null, value: 75000.00, isCalculated: false },
    { accountCode: '410704', currencyCode: null, countryCode: null, positionType: null, value: 38000.00, isCalculated: false },
    { accountCode: '410700', currencyCode: null, countryCode: null, positionType: null, value: 533000.00, isCalculated: true },
    { accountCode: '410801', currencyCode: null, countryCode: null, positionType: null, value: 185000.00, isCalculated: false },
    { accountCode: '410802', currencyCode: null, countryCode: null, positionType: null, value: 100000.00, isCalculated: false },
    { accountCode: '410800', currencyCode: null, countryCode: null, positionType: null, value: 285000.00, isCalculated: true },
    { accountCode: '410901', currencyCode: null, countryCode: null, positionType: null, value: 165000.00, isCalculated: false },
    { accountCode: '410904', currencyCode: null, countryCode: null, positionType: null, value: 88000.00, isCalculated: false },
    { accountCode: '410907', currencyCode: null, countryCode: null, positionType: null, value: 40000.00, isCalculated: false },
    { accountCode: '410908', currencyCode: null, countryCode: null, positionType: null, value: 28000.00, isCalculated: false },
    { accountCode: '410900', currencyCode: null, countryCode: null, positionType: null, value: 321000.00, isCalculated: true },
    // RWAMPAD total
    { accountCode: '503000', currencyCode: null, countryCode: null, positionType: null, value: 9682075.00, isCalculated: true },
  ];

  for (const entry of approvedEntries) {
    await prisma.ddrEntry.upsert({
      where: {
        reportId_accountCode_currencyCode_countryCode_positionType: {
          reportId: ddrApproved.id,
          accountCode: entry.accountCode,
          currencyCode: entry.currencyCode ?? '',
          countryCode: entry.countryCode ?? '',
          positionType: entry.positionType ?? 0,
        },
      },
      update: { value: entry.value },
      create: {
        reportId: ddrApproved.id,
        accountCode: entry.accountCode,
        currencyCode: entry.currencyCode,
        countryCode: entry.countryCode,
        positionType: entry.positionType,
        value: entry.value,
        isCalculated: entry.isCalculated,
      },
    });
  }

  console.log(`${approvedEntries.length} entries added to APPROVED DDR`);

  // ---- Add a few entries to other reports too ----
  const basicEntries = [
    { accountCode: '111000', currencyCode: '220', countryCode: null, positionType: 1, value: 13000000.00, isCalculated: false },
    { accountCode: '121000', currencyCode: '220', countryCode: null, positionType: 1, value: 10500000.00, isCalculated: false },
    { accountCode: '310000', currencyCode: null, countryCode: null, positionType: null, value: 1250000.00, isCalculated: true },
    { accountCode: '503000', currencyCode: null, countryCode: null, positionType: null, value: 9200000.00, isCalculated: true },
  ];

  for (const reportId of [ddrSubmitted.id, ddrPending.id, ddrRejected.id]) {
    for (const entry of basicEntries) {
      await prisma.ddrEntry.upsert({
        where: {
          reportId_accountCode_currencyCode_countryCode_positionType: {
            reportId,
            accountCode: entry.accountCode,
            currencyCode: entry.currencyCode ?? '',
            countryCode: entry.countryCode ?? '',
            positionType: entry.positionType ?? 0,
          },
        },
        update: { value: entry.value },
        create: {
          reportId,
          accountCode: entry.accountCode,
          currencyCode: entry.currencyCode,
          countryCode: entry.countryCode,
          positionType: entry.positionType,
          value: entry.value,
          isCalculated: entry.isCalculated,
        },
      });
    }
  }

  console.log('Basic entries added to SUBMITTED, PENDING_REVIEW, and REJECTED DDRs');

  // ---- DDR Parameters for the DRAFT report ----
  const ddrParameters = [
    { parameterCode: 'FACTOR_F', value: 0.285, source: 'CALCULATED' },
    { parameterCode: 'FACTOR_H', value: 0.70, source: 'BCB' },
    { parameterCode: 'FACTOR_G', value: 0.40, source: 'BCB' },
    { parameterCode: 'MPRE', value: 0.015, source: 'BCB' },
    { parameterCode: 'MEXT', value: 0.025, source: 'BCB' },
    { parameterCode: 'MPCO', value: 0.020, source: 'BCB' },
    { parameterCode: 'MJUR_PREFIXADO', value: 0.012, source: 'BCB' },
    { parameterCode: 'MJUR_CUPOM_CAMBIAL', value: 0.018, source: 'BCB' },
    { parameterCode: 'MJUR_INDICE_PRECOS', value: 0.010, source: 'BCB' },
    { parameterCode: 'MJUR_TAXA_JUROS', value: 0.008, source: 'BCB' },
    { parameterCode: 'EXP_PR_RATIO', value: 0.05, source: 'CALCULATED' },
  ];

  for (const param of ddrParameters) {
    await prisma.ddrParameter.upsert({
      where: {
        reportId_parameterCode: {
          reportId: ddrDraft.id,
          parameterCode: param.parameterCode,
        },
      },
      update: { value: param.value },
      create: {
        reportId: ddrDraft.id,
        ...param,
      },
    });
  }

  console.log(`${ddrParameters.length} DDR parameters seeded`);

  console.log('DDR seed completed!');
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
