import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface ReinfEvent {
  id: string;
  type: string;
  period: string;
  status: string;
  xmlContent?: string;
  generatedAt: Date;
}

@Injectable()
export class EfdReinfService {
  private readonly logger = new Logger(EfdReinfService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * R-1000 - Informações do Contribuinte
   */
  async generateR1000(companyId: string): Promise<ReinfEvent> {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId },
    });

    if (!company) {
      throw new BadRequestException('Empresa não encontrada');
    }

    const xml = this.buildR1000Xml(company);

    return {
      id: `R1000-${companyId}-${Date.now()}`,
      type: 'R-1000',
      period: new Date().toISOString().substring(0, 7),
      status: 'GENERATED',
      xmlContent: xml,
      generatedAt: new Date(),
    };
  }

  /**
   * R-4010 - Pagamentos/créditos a beneficiário pessoa física
   */
  async generateR4010(companyId: string, year: number, month: number): Promise<ReinfEvent[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Busca títulos pagos no período com retenção de IR para PF
    const payables = await this.prisma.payableTitle.findMany({
      where: {
        companyId,
        status: 'PAID',
        paymentDate: { gte: startDate, lte: endDate },
      },
    });

    const events: ReinfEvent[] = [];
    for (const payable of payables) {
      const taxes = await this.prisma.payableTax.findMany({
        where: { payableId: payable.id, taxType: 'IR' },
      });

      if (taxes.length > 0) {
        events.push({
          id: `R4010-${payable.id}`,
          type: 'R-4010',
          period: `${year}-${String(month).padStart(2, '0')}`,
          status: 'GENERATED',
          generatedAt: new Date(),
        });
      }
    }

    return events;
  }

  /**
   * R-4020 - Pagamentos/créditos a beneficiário pessoa jurídica
   */
  async generateR4020(companyId: string, year: number, month: number): Promise<ReinfEvent[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const payables = await this.prisma.payableTitle.findMany({
      where: {
        companyId,
        status: 'PAID',
        paymentDate: { gte: startDate, lte: endDate },
      },
    });

    const events: ReinfEvent[] = [];
    for (const payable of payables) {
      const taxes = await this.prisma.payableTax.findMany({
        where: {
          payableId: payable.id,
          taxType: { in: ['IR', 'CSLL', 'PIS', 'COFINS'] },
        },
      });

      if (taxes.length > 0) {
        events.push({
          id: `R4020-${payable.id}`,
          type: 'R-4020',
          period: `${year}-${String(month).padStart(2, '0')}`,
          status: 'GENERATED',
          generatedAt: new Date(),
        });
      }
    }

    return events;
  }

  /**
   * R-9000 - Exclusão de Eventos
   */
  async generateR9000(eventId: string): Promise<ReinfEvent> {
    return {
      id: `R9000-${eventId}`,
      type: 'R-9000',
      period: new Date().toISOString().substring(0, 7),
      status: 'GENERATED',
      generatedAt: new Date(),
    };
  }

  /**
   * Gerar todos os eventos do período
   */
  async generatePeriod(companyId: string, year: number, month: number) {
    const r4010 = await this.generateR4010(companyId, year, month);
    const r4020 = await this.generateR4020(companyId, year, month);

    return {
      period: `${year}-${String(month).padStart(2, '0')}`,
      events: {
        'R-4010': r4010,
        'R-4020': r4020,
      },
      totals: {
        'R-4010': r4010.length,
        'R-4020': r4020.length,
        total: r4010.length + r4020.length,
      },
    };
  }

  /**
   * Transmitir evento (stub - integração com webservice RFB)
   */
  async transmit(eventId: string, _certificateBase64?: string) {
    this.logger.log(`Transmitting EFD-Reinf event: ${eventId}`);

    // Stub: em produção, assinar XML com certificado digital e enviar via webservice
    return {
      eventId,
      protocol: `PROT-${Date.now()}`,
      status: 'TRANSMITTED',
      message: 'Evento transmitido com sucesso (ambiente de desenvolvimento)',
      transmittedAt: new Date(),
    };
  }

  private buildR1000Xml(company: Record<string, unknown>): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Reinf xmlns="http://www.reinf.esocial.gov.br/schemas/evtInfoContri/v2_01_02">
  <evtInfoContri id="ID${Date.now()}">
    <ideEvento>
      <tpAmb>2</tpAmb>
      <procEmi>1</procEmi>
      <verProc>CORA-ERP-1.0</verProc>
    </ideEvento>
    <ideContri>
      <tpInsc>1</tpInsc>
      <nrInsc>${String(company.cnpj).replace(/\D/g, '').substring(0, 8)}</nrInsc>
    </ideContri>
  </evtInfoContri>
</Reinf>`;
  }
}
