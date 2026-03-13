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
        branchId: null as unknown as string,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
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
