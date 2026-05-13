import { Injectable, BadRequestException, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  REINF_TRANSMITTER,
  ReinfTransmitter,
  ReinfTransmitResult,
} from './transmitters/reinf-transmitter';
import {
  buildR1000Xml,
  buildR4010Xml,
  buildR4020Xml,
  buildR9000Xml,
} from './reinf-xml.builder';

export interface ReinfEvent {
  id: string;
  type: 'R-1000' | 'R-4010' | 'R-4020' | 'R-9000';
  period: string;
  status: 'GENERATED' | 'ACCEPTED' | 'REJECTED' | 'PENDING';
  xmlContent: string;
  transmission?: ReinfTransmitResult;
  generatedAt: Date;
}

/**
 * Serviço EFD-Reinf — escritura e transmissão dos eventos para a RFB.
 *
 * Responsabilidades:
 *   1. Buscar dados transacionais (PayableTitle + PayableTax) por período;
 *   2. Construir XML conforme leiaute 2.01.02 (R-1000, R-4010, R-4020, R-9000);
 *   3. Delegar transmissão ao {@link ReinfTransmitter} injetado.
 */
@Injectable()
export class EfdReinfService {
  private readonly logger = new Logger(EfdReinfService.name);

  // Códigos padrão da Tabela 1 (natureza do rendimento) usados para SCFI
  private static readonly NATURE_PF = '12001'; // serviços profissionais PF
  private static readonly NATURE_PJ = '15001'; // serviços profissionais PJ

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REINF_TRANSMITTER) private readonly transmitter: ReinfTransmitter,
  ) {}

  async generateR1000(companyId: string): Promise<ReinfEvent> {
    const company = await this.prisma.company.findFirst({ where: { id: companyId } });
    if (!company) throw new BadRequestException('Empresa não encontrada');

    const validFrom = new Date().toISOString().substring(0, 7);
    const xml = buildR1000Xml({
      companyCnpj: company.cnpj,
      companyName: company.name,
      validFrom,
      classificacaoTributaria: '99',
    });

    return {
      id: `R1000-${companyId}-${Date.now()}`,
      type: 'R-1000',
      period: validFrom,
      status: 'GENERATED',
      xmlContent: xml,
      generatedAt: new Date(),
    };
  }

  async generateR4010(companyId: string, year: number, month: number): Promise<ReinfEvent[]> {
    const company = await this.prisma.company.findFirst({ where: { id: companyId } });
    if (!company) throw new BadRequestException('Empresa não encontrada');

    const { startDate, endDate } = this.periodRange(year, month);
    const payables = await this.findPaidInPeriod(companyId, startDate, endDate);

    const events: ReinfEvent[] = [];
    for (const payable of payables) {
      const irTax = await this.prisma.payableTax.findFirst({
        where: { titleId: payable.id, taxType: 'IR' },
      });
      if (!irTax) continue;

      const supplier = await this.prisma.supplier.findFirst({
        where: { id: payable.supplierId },
      });
      if (!supplier || supplier.type !== 'PF') continue;

      const xml = buildR4010Xml({
        companyCnpj: company.cnpj,
        beneficiaryCpf: supplier.cpfCnpj,
        beneficiaryName: supplier.name,
        period: { year, month },
        paymentDate: payable.updatedAt,
        natureCode: EfdReinfService.NATURE_PF,
        grossAmount: Number(payable.originalAmount),
        irAmount: Number(irTax.amount),
      });

      events.push({
        id: `R4010-${payable.id}`,
        type: 'R-4010',
        period: this.yyyymm(year, month),
        status: 'GENERATED',
        xmlContent: xml,
        generatedAt: new Date(),
      });
    }
    return events;
  }

  async generateR4020(companyId: string, year: number, month: number): Promise<ReinfEvent[]> {
    const company = await this.prisma.company.findFirst({ where: { id: companyId } });
    if (!company) throw new BadRequestException('Empresa não encontrada');

    const { startDate, endDate } = this.periodRange(year, month);
    const payables = await this.findPaidInPeriod(companyId, startDate, endDate);

    const events: ReinfEvent[] = [];
    for (const payable of payables) {
      const taxes = await this.prisma.payableTax.findMany({
        where: { titleId: payable.id, taxType: { in: ['IR', 'CSLL', 'PIS', 'COFINS'] } },
      });
      if (taxes.length === 0) continue;

      const supplier = await this.prisma.supplier.findFirst({
        where: { id: payable.supplierId },
      });
      if (!supplier || supplier.type !== 'PJ') continue;

      const amountOf = (type: string) =>
        Number(taxes.find((t) => t.taxType === type)?.amount ?? 0);

      const xml = buildR4020Xml({
        companyCnpj: company.cnpj,
        beneficiaryCnpj: supplier.cpfCnpj,
        beneficiaryName: supplier.name,
        period: { year, month },
        paymentDate: payable.updatedAt,
        natureCode: EfdReinfService.NATURE_PJ,
        grossAmount: Number(payable.originalAmount),
        irAmount: amountOf('IR'),
        csllAmount: amountOf('CSLL'),
        pisAmount: amountOf('PIS'),
        cofinsAmount: amountOf('COFINS'),
      });

      events.push({
        id: `R4020-${payable.id}`,
        type: 'R-4020',
        period: this.yyyymm(year, month),
        status: 'GENERATED',
        xmlContent: xml,
        generatedAt: new Date(),
      });
    }
    return events;
  }

  async generateR9000(
    companyId: string,
    eventType: 'R-4010' | 'R-4020',
    receiptToExclude: string,
  ): Promise<ReinfEvent> {
    const company = await this.prisma.company.findFirst({ where: { id: companyId } });
    if (!company) throw new BadRequestException('Empresa não encontrada');

    const xml = buildR9000Xml({
      companyCnpj: company.cnpj,
      eventTypeToExclude: eventType,
      receiptToExclude,
    });

    return {
      id: `R9000-${receiptToExclude}`,
      type: 'R-9000',
      period: new Date().toISOString().substring(0, 7),
      status: 'GENERATED',
      xmlContent: xml,
      generatedAt: new Date(),
    };
  }

  async generatePeriod(companyId: string, year: number, month: number) {
    const r4010 = await this.generateR4010(companyId, year, month);
    const r4020 = await this.generateR4020(companyId, year, month);
    return {
      period: this.yyyymm(year, month),
      events: { 'R-4010': r4010, 'R-4020': r4020 },
      totals: {
        'R-4010': r4010.length,
        'R-4020': r4020.length,
        total: r4010.length + r4020.length,
      },
    };
  }

  /**
   * Transmite um evento já gerado ao webservice da RFB via {@link ReinfTransmitter}.
   * Devolve o evento atualizado com `transmission` e `status` finais.
   */
  async transmitEvent(event: ReinfEvent): Promise<ReinfEvent> {
    if (event.type === 'R-9000') {
      // não-transmissão direta: 9000 é encadeado a um evento original
      // — mantemos a interface idempotente aqui
    }
    const result = await this.transmitter.transmit({
      eventXml: event.xmlContent,
      eventType: event.type,
    });
    this.logger.log(`EFD-Reinf ${event.type} transmitted: ${result.status}`);
    return { ...event, transmission: result, status: result.status };
  }

  private periodRange(year: number, month: number) {
    return {
      startDate: new Date(year, month - 1, 1),
      endDate: new Date(year, month, 0, 23, 59, 59, 999),
    };
  }

  private yyyymm(year: number, month: number): string {
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  private async findPaidInPeriod(companyId: string, startDate: Date, endDate: Date) {
    return this.prisma.payableTitle.findMany({
      where: {
        companyId,
        status: 'PAID',
        updatedAt: { gte: startDate, lte: endDate },
      },
    });
  }
}
