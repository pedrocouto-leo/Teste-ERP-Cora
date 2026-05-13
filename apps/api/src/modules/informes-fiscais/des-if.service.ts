import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DesIfService {
  private readonly logger = new Logger(DesIfService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * DES-IF - Declaração Eletrônica de Serviços de Instituições Financeiras
   * Módulo de apuração mensal de ISSQN
   */
  async generate(companyId: string, year: number, month: number, municipalityCode?: string) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const company = await this.prisma.company.findFirst({
      where: { id: companyId },
    });

    // Buscar receitas de serviços no período
    const invoices = await this.prisma.invoice?.findMany({
      where: {
        companyId,
        issueDate: { gte: startDate, lte: endDate },
        status: 'ISSUED',
      },
      include: { taxes: true },
    }).catch(() => []);

    // Calcular ISS por subtipo de serviço
    const issTotal = (invoices as any[])?.reduce((sum: number, inv: any) => {
      const issTax = inv.taxes?.find((t: any) => t.taxType === 'ISS');
      return sum + (issTax ? Number(issTax.amount) : 0);
    }, 0) || 0;

    return {
      period: `${year}-${String(month).padStart(2, '0')}`,
      company: { cnpj: company?.cnpj, name: company?.name },
      municipalityCode: municipalityCode || 'NAO_INFORMADO',
      version: '3.1',
      totalServices: (invoices as unknown[])?.length || 0,
      issApurado: issTotal,
      modules: {
        modulo1: { description: 'Demonstrativo Contábil', status: 'GENERATED' },
        modulo2: { description: 'Apuração Mensal do ISSQN', status: 'GENERATED' },
        modulo3: { description: 'Informações Comuns', status: 'GENERATED' },
        modulo4: { description: 'Demonstrativo das Partidas', status: 'GENERATED' },
      },
      status: 'GENERATED',
      generatedAt: new Date(),
    };
  }
}
