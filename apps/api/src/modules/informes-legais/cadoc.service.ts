import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CadocService {
  private readonly logger = new Logger(CadocService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * CADOC 3044 - Eventos Diários de Crédito
   * Envio via JSON para API do BACEN
   */
  async generateCadoc3044(companyId: string, date: string) {
    const targetDate = new Date(date);

    // Buscar operações de crédito do dia
    const receivables = await this.prisma.receivableTitle.findMany({
      where: {
        companyId,
        issueDate: targetDate,
      },
    });

    const events = receivables.map((r) => ({
      tipoEvento: 'CONCESSAO',
      dataEvento: date,
      valorOperacao: Number(r.originalAmount),
      codigoModalidade: '0201', // Empréstimo - conta garantida
      documentoCliente: '', // seria preenchido com CPF/CNPJ do cliente
    }));

    return {
      documento: 'CADOC-3044',
      dataReferencia: date,
      cnpjInstituicao: (await this.prisma.company.findFirst({ where: { id: companyId } }))?.cnpj,
      totalEventos: events.length,
      eventos: events,
      formato: 'JSON',
      status: 'GENERATED',
      generatedAt: new Date(),
    };
  }

  /**
   * CADOC 4111 - Saldos Contábeis Diários
   * Formato XML para BACEN
   */
  async generateCadoc4111(companyId: string, date: string) {
    const targetDate = new Date(date);

    // Buscar saldos contábeis
    const balances = await this.prisma.accountBalance.findMany({
      where: { companyId },
      include: { account: true },
      orderBy: { account: { code: 'asc' } },
    });

    const saldos = balances.map((b) => ({
      codigoConta: b.account.code,
      codigoCosif: b.account.cosifCode || '',
      saldoDevedor: Number(b.totalDebits),
      saldoCredor: Number(b.totalCredits),
      saldoFinal: Number(b.closingBalance),
    }));

    return {
      documento: 'CADOC-4111',
      dataReferencia: date,
      totalContas: saldos.length,
      saldos,
      formato: 'XML',
      status: 'GENERATED',
      generatedAt: new Date(),
    };
  }
}
