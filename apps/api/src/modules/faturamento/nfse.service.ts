import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * NFS-e (Nota Fiscal de Servico Eletronica) Service
 *
 * This is a stub implementation that prepares the data structures
 * for NFS-e emission via municipal webservices. Actual webservice
 * calls would be environment-specific and depend on the municipality.
 */
@Injectable()
export class NfseService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Prepares NFS-e XML data structure and updates invoice nfseStatus.
   * In production, this would call the municipal webservice to emit the NFS-e.
   */
  async emitNfse(companyId: string, invoiceId: string, userId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, companyId, active: true },
      include: {
        items: { orderBy: { sequence: 'asc' } },
        taxes: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Fatura nao encontrada');
    }

    if (invoice.status !== 'ISSUED') {
      throw new BadRequestException(
        'Somente faturas emitidas (ISSUED) podem gerar NFS-e',
      );
    }

    if (invoice.nfseStatus === 'EMITTED') {
      throw new BadRequestException('NFS-e ja foi emitida para esta fatura');
    }

    // Prepare NFS-e data structure (stub)
    const nfseData = this.buildNfsePayload(invoice);

    // In production: call municipal webservice here
    // const response = await this.callWebservice(nfseData);

    // Update invoice with pending NFS-e status
    const updated = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        nfseStatus: 'PENDING',
        updatedBy: userId,
      },
      include: {
        items: { orderBy: { sequence: 'asc' } },
        taxes: true,
      },
    });

    return {
      invoice: updated,
      nfsePayload: nfseData,
      message:
        'Dados da NFS-e preparados. Integracao com webservice municipal pendente de configuracao.',
    };
  }

  /**
   * Prepares cancellation request for an emitted NFS-e.
   * In production, this would call the municipal webservice to cancel.
   */
  async cancelNfse(companyId: string, invoiceId: string, userId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, companyId, active: true },
    });

    if (!invoice) {
      throw new NotFoundException('Fatura nao encontrada');
    }

    if (!invoice.nfseStatus || invoice.nfseStatus === 'CANCELLED') {
      throw new BadRequestException(
        'Esta fatura nao possui NFS-e emitida ou ja foi cancelada',
      );
    }

    const cancellationData = {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      nfseNumber: invoice.nfseNumber,
      cancellationReason: 'Cancelamento solicitado pelo usuario',
      requestedAt: new Date().toISOString(),
      requestedBy: userId,
    };

    // In production: call municipal webservice cancellation endpoint
    // const response = await this.callCancellationWebservice(cancellationData);

    const updated = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        nfseStatus: 'CANCELLED',
        updatedBy: userId,
      },
    });

    return {
      invoice: updated,
      cancellationPayload: cancellationData,
      message:
        'Solicitacao de cancelamento da NFS-e preparada. Integracao com webservice municipal pendente de configuracao.',
    };
  }

  /**
   * Checks NFS-e emission status.
   * In production, this would query the municipal webservice for status updates.
   */
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

    if (!invoice) {
      throw new NotFoundException('Fatura nao encontrada');
    }

    if (!invoice.nfseStatus) {
      return {
        invoice,
        nfseStatus: null,
        message: 'NFS-e ainda nao foi solicitada para esta fatura',
      };
    }

    // In production: query municipal webservice for updated status
    // const statusResponse = await this.queryWebserviceStatus(invoice.nfseNumber);

    return {
      invoice,
      nfseStatus: invoice.nfseStatus,
      nfseNumber: invoice.nfseNumber,
      message: `Status atual da NFS-e: ${invoice.nfseStatus}. Consulta ao webservice municipal pendente de configuracao.`,
    };
  }

  /**
   * Builds the NFS-e XML payload structure.
   * This follows the ABRASF standard used by most Brazilian municipalities.
   */
  private buildNfsePayload(invoice: {
    id: string;
    invoiceNumber: string;
    clientId: string;
    issueDate: Date;
    subtotal: unknown;
    taxTotal: unknown;
    totalAmount: unknown;
    description: string | null;
    items: Array<{
      sequence: number;
      description: string;
      serviceCode: string | null;
      quantity: unknown;
      unitPrice: unknown;
      totalPrice: unknown;
    }>;
    taxes: Array<{
      taxType: string;
      baseAmount: unknown;
      rate: unknown;
      amount: unknown;
      withheld: boolean;
    }>;
  }) {
    // ISS tax info
    const issTax = invoice.taxes.find((t) => t.taxType === 'ISS');

    return {
      identificacaoRps: {
        numero: invoice.invoiceNumber,
        serie: 'A',
        tipo: 1, // RPS
      },
      dataEmissao: invoice.issueDate.toISOString().split('T')[0],
      naturezaOperacao: 1, // Tributacao no municipio
      optanteSimplesNacional: false,
      incentivadorCultural: false,
      tomador: {
        identificacao: invoice.clientId,
        // In production: would fetch client CNPJ/CPF, address, etc.
      },
      servico: {
        valores: {
          valorServicos: invoice.subtotal,
          valorDeducoes: 0,
          valorPis: invoice.taxes
            .find((t) => t.taxType === 'PIS')
            ?.amount?.toString() ?? '0',
          valorCofins: invoice.taxes
            .find((t) => t.taxType === 'COFINS')
            ?.amount?.toString() ?? '0',
          valorInss: invoice.taxes
            .find((t) => t.taxType === 'INSS')
            ?.amount?.toString() ?? '0',
          valorIr: invoice.taxes
            .find((t) => t.taxType === 'IR')
            ?.amount?.toString() ?? '0',
          valorCsll: invoice.taxes
            .find((t) => t.taxType === 'CSLL')
            ?.amount?.toString() ?? '0',
          issRetido: issTax?.withheld ? 1 : 2,
          valorIss: issTax?.amount?.toString() ?? '0',
          aliquota: issTax?.rate?.toString() ?? '0',
          valorLiquidoNfse: invoice.totalAmount,
        },
        itemListaServico: invoice.items[0]?.serviceCode ?? '',
        discriminacao: invoice.description ?? invoice.items
          .map((i) => `${i.sequence}. ${i.description}`)
          .join('; '),
      },
      itens: invoice.items.map((item) => ({
        sequencia: item.sequence,
        descricao: item.description,
        codigoServico: item.serviceCode,
        quantidade: item.quantity,
        valorUnitario: item.unitPrice,
        valorTotal: item.totalPrice,
      })),
    };
  }
}
