import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GenerateBoletoDto } from './dto/boleto.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class BoletoService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(companyId: string, dto: GenerateBoletoDto) {
    // Validate receivable exists
    const receivable = await this.prisma.receivableTitle.findFirst({
      where: { id: dto.receivableId, companyId },
    });

    if (!receivable) {
      throw new BadRequestException('Titulo a receber nao encontrado');
    }

    if (
      receivable.status === 'PAID' ||
      receivable.status === 'CANCELLED'
    ) {
      throw new BadRequestException(
        `Titulo com status ${receivable.status} nao permite geracao de boleto`,
      );
    }

    // Validate bank account exists
    const bankAccount = await this.prisma.ownBankAccount.findFirst({
      where: { id: dto.bankAccountId, companyId },
    });

    if (!bankAccount) {
      throw new BadRequestException('Conta bancaria nao encontrada');
    }

    // Generate unique ourNumber per company
    const ourNumber = await this.generateOurNumber(companyId);

    const amount = dto.amount
      ? new Decimal(dto.amount)
      : new Decimal(receivable.balance.toString());

    const dueDate = dto.dueDate
      ? new Date(dto.dueDate)
      : receivable.dueDate;

    return this.prisma.boleto.create({
      data: {
        companyId,
        receivableId: dto.receivableId,
        ourNumber,
        bankAccountId: dto.bankAccountId,
        amount,
        dueDate,
        status: 'GENERATED',
        registrationStatus: 'PENDING',
      },
      include: {
        receivable: true,
      },
    });
  }

  async findAll(
    companyId: string,
    pagination: PaginationDto,
    filters?: {
      status?: string;
      receivableId?: string;
    },
  ) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = pagination;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { companyId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.receivableId) {
      where.receivableId = filters.receivableId;
    }

    const [data, total] = await Promise.all([
      this.prisma.boleto.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { receivable: true },
      }),
      this.prisma.boleto.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(companyId: string, id: string) {
    const boleto = await this.prisma.boleto.findFirst({
      where: { id, companyId },
      include: { receivable: true },
    });

    if (!boleto) {
      throw new NotFoundException('Boleto nao encontrado');
    }

    return boleto;
  }

  async cancel(companyId: string, id: string) {
    const boleto = await this.findOne(companyId, id);

    if (boleto.status === 'PAID') {
      throw new BadRequestException('Boleto pago nao pode ser cancelado');
    }

    if (boleto.status === 'CANCELLED') {
      throw new BadRequestException('Boleto ja esta cancelado');
    }

    return this.prisma.boleto.update({
      where: { id: boleto.id },
      data: { status: 'CANCELLED' },
      include: { receivable: true },
    });
  }

  private async generateOurNumber(companyId: string): Promise<string> {
    const lastBoleto = await this.prisma.boleto.findFirst({
      where: { companyId },
      orderBy: { ourNumber: 'desc' },
    });

    const lastNumber = lastBoleto
      ? parseInt(lastBoleto.ourNumber, 10)
      : 0;

    return String(lastNumber + 1).padStart(10, '0');
  }
}
