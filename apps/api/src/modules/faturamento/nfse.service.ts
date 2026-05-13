import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NFSE_TRANSMITTER, NfseTransmitter } from './transmitters/nfse-transmitter';
import { buildNfseRpsXml, NfseXmlInput } from './nfse-xml.builder';

/**
 * NFS-e (Nota Fiscal de Servico Eletronica) Service
 *
 * Gera o XML RPS no padrão ABRASF 2.04 e delega a transmissão ao
 * {@link NfseTransmitter} injetado. Em dev/CI usa-se o StubNfseTransmitter;
 * em prod um transmitter por município (com certificado A1/A3 e endpoint
 * SOAP correto) é registrado via custom provider.
 */
@Injectable()
export class NfseService {
  // Default CNAE para serviços financeiros / consultoria — ajustar no DTO em produção
  private static readonly DEFAULT_LIST_ITEM = '17.01';
  // Curitiba IBGE — fallback quando não há município no cadastro
  private static readonly DEFAULT_CITY_CODE = '4106902';

  constructor(
    private readonly prisma: PrismaService,
    @Inject(NFSE_TRANSMITTER) private readonly transmitter: NfseTransmitter,
  ) {}

  async emitNfse(companyId: string, invoiceId: string, userId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, companyId, active: true },
      include: {
        items: { orderBy: { sequence: 'asc' } },
        taxes: true,
      },
    });

    if (!invoice) throw new NotFoundException('Fatura não encontrada');

    if (invoice.status !== 'ISSUED') {
      throw new BadRequestException(
        'Somente faturas emitidas (ISSUED) podem gerar NFS-e',
      );
    }

    if (invoice.nfseStatus === 'EMITTED' || invoice.nfseStatus === 'ACCEPTED') {
      throw new BadRequestException('NFS-e já foi emitida para esta fatura');
    }

    const [client, company] = await Promise.all([
      this.prisma.client.findFirst({ where: { id: invoice.clientId } }),
      this.prisma.company.findFirst({ where: { id: companyId } }),
    ]);

    if (!company) throw new NotFoundException('Empresa emitente não encontrada');

    const xml = this.buildXml({ ...invoice, client, company });

    const result = await this.transmitter.transmit({
      rpsXml: xml,
      cityCode: NfseService.DEFAULT_CITY_CODE,
    });

    const updated = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        nfseStatus: result.status === 'ACCEPTED' ? 'EMITTED' : 'PENDING',
        nfseNumber: result.nfseNumber,
        updatedBy: userId,
      },
      include: {
        items: { orderBy: { sequence: 'asc' } },
        taxes: true,
      },
    });

    return {
      invoice: updated,
      transmission: result,
      rpsXml: xml,
    };
  }

  async cancelNfse(companyId: string, invoiceId: string, userId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, companyId, active: true },
    });

    if (!invoice) throw new NotFoundException('Fatura não encontrada');

    if (!invoice.nfseStatus || invoice.nfseStatus === 'CANCELLED') {
      throw new BadRequestException(
        'Esta fatura não possui NFS-e emitida ou já foi cancelada',
      );
    }

    if (!invoice.nfseNumber) {
      throw new BadRequestException(
        'NFS-e não possui número emitido pelo município — nada a cancelar',
      );
    }

    const result = await this.transmitter.cancel({
      nfseNumber: invoice.nfseNumber,
      cityCode: NfseService.DEFAULT_CITY_CODE,
      reasonCode: '1',
      reasonText: 'Cancelamento solicitado pelo emitente',
    });

    const updated = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        nfseStatus: result.status === 'ACCEPTED' ? 'CANCELLED' : invoice.nfseStatus,
        updatedBy: userId,
      },
    });

    return { invoice: updated, transmission: result };
  }

  async checkStatus(companyId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, companyId, active: true },
      select: {
        id: true,
        invoiceNumber: true,
        nfseNumber: true,
        nfseStatus: true,
        status: true,
        totalAmount: true,
        clientId: true,
      },
    });

    if (!invoice) throw new NotFoundException('Fatura não encontrada');

    return {
      invoice,
      nfseStatus: invoice.nfseStatus,
      nfseNumber: invoice.nfseNumber,
    };
  }

  /**
   * Convert Prisma row → input do XML builder.
   * Exposto como public para testes do builder isoladamente.
   */
  buildXml(invoice: {
    invoiceNumber: string;
    issueDate: Date;
    subtotal: unknown;
    totalAmount: unknown;
    description: string | null;
    items: Array<{ description: string; quantity: unknown; unitPrice: unknown; totalPrice: unknown; serviceCode: string | null; sequence: number }>;
    taxes: Array<{ taxType: string; amount: unknown; rate: unknown; withheld: boolean }>;
    client: { cpfCnpj?: string; name: string; email?: string | null } | null;
    company: { cnpj: string; name: string };
  }): string {
    const issTax = invoice.taxes.find((t) => t.taxType === 'ISS');
    const findAmount = (type: string) =>
      Number(invoice.taxes.find((t) => t.taxType === type)?.amount ?? 0);

    const totalServices = Number(invoice.subtotal);
    const netAmount = Number(invoice.totalAmount);
    const firstItem = invoice.items[0];

    const input: NfseXmlInput = {
      rpsNumber: invoice.invoiceNumber,
      rpsSeries: 'A',
      issueDate: invoice.issueDate,
      serviceCityCode: NfseService.DEFAULT_CITY_CODE,
      provider: {
        cnpj: invoice.company.cnpj,
        razaoSocial: invoice.company.name,
      },
      client: {
        cnpjOrCpf: invoice.client?.cpfCnpj ?? '',
        name: invoice.client?.name ?? '',
        email: invoice.client?.email ?? undefined,
      },
      service: {
        listItemCode: firstItem?.serviceCode ?? NfseService.DEFAULT_LIST_ITEM,
        discrimination:
          invoice.description ??
          invoice.items.map((i) => `${i.sequence}. ${i.description}`).join('; '),
        quantity: Number(firstItem?.quantity ?? 1),
        unitValue: Number(firstItem?.unitPrice ?? totalServices),
        totalServices,
        issRate: Number(issTax?.rate ?? 5),
        issAmount: Number(issTax?.amount ?? 0),
        issWithheld: Boolean(issTax?.withheld),
        pisAmount: findAmount('PIS'),
        cofinsAmount: findAmount('COFINS'),
        inssAmount: findAmount('INSS'),
        irAmount: findAmount('IR'),
        csllAmount: findAmount('CSLL'),
        netAmount,
      },
    };

    return buildNfseRpsXml(input);
  }
}
