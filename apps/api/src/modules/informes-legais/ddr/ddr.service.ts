import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDdrReportDto } from './dto/create-ddr-report.dto';
import { UpdateDdrReportDto } from './dto/update-ddr-report.dto';
import { CreateDdrEntryDto } from './dto/create-ddr-entry.dto';
import { CreateDdrParameterDto } from './dto/ddr-parameter.dto';
import { DdrFilterDto } from './dto/ddr-filter.dto';
import { paginate } from '../../../common/dto/pagination.dto';
import { DDR_ACCOUNTS } from './constants/ddr-accounts';
import { DDR_STATUS } from './constants/ddr-accounts';

@Injectable()
export class DdrService {
  private readonly logger = new Logger(DdrService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, userId: string, dto: CreateDdrReportDto) {
    const existing = await this.prisma.ddrReport.findUnique({
      where: {
        companyId_referenceDate: {
          companyId,
          referenceDate: new Date(dto.referenceDate),
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `DDR para data-base ${dto.referenceDate} já existe`,
      );
    }

    return this.prisma.ddrReport.create({
      data: {
        companyId,
        referenceDate: new Date(dto.referenceDate),
        notes: dto.notes,
        createdBy: userId,
      },
      include: { entries: true, parameters: true },
    });
  }

  async findAll(companyId: string, filter: DdrFilterDto) {
    const where: any = { companyId };

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.startDate || filter.endDate) {
      where.referenceDate = {};
      if (filter.startDate) {
        where.referenceDate.gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        where.referenceDate.lte = new Date(filter.endDate);
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.ddrReport.findMany({
        where,
        skip: filter.skip,
        take: filter.limit,
        orderBy: { [filter.sortBy || 'referenceDate']: filter.sortOrder || 'desc' },
        include: {
          _count: { select: { entries: true } },
        },
      }),
      this.prisma.ddrReport.count({ where }),
    ]);

    return paginate(data, total, filter.page ?? 1, filter.limit ?? 20);
  }

  async findOne(companyId: string, id: string) {
    const report = await this.prisma.ddrReport.findFirst({
      where: { id, companyId },
      include: {
        entries: { orderBy: { accountCode: 'asc' } },
        parameters: { orderBy: { parameterCode: 'asc' } },
      },
    });

    if (!report) {
      throw new NotFoundException(`DDR ${id} não encontrado`);
    }

    return report;
  }

  async update(companyId: string, id: string, userId: string, dto: UpdateDdrReportDto) {
    const report = await this.findOne(companyId, id);
    this.assertEditable(report);

    return this.prisma.ddrReport.update({
      where: { id },
      data: { ...dto, updatedBy: userId },
      include: { entries: true, parameters: true },
    });
  }

  async remove(companyId: string, id: string) {
    const report = await this.findOne(companyId, id);
    if (report.status !== DDR_STATUS.DRAFT) {
      throw new BadRequestException('Somente rascunhos podem ser excluídos');
    }

    return this.prisma.ddrReport.delete({ where: { id } });
  }

  // --- Entry Management ---

  async upsertEntry(companyId: string, reportId: string, dto: CreateDdrEntryDto) {
    const report = await this.findOne(companyId, reportId);
    this.assertEditable(report);
    this.validateEntryElements(dto);

    return this.prisma.ddrEntry.upsert({
      where: {
        reportId_accountCode_currencyCode_countryCode_positionType: {
          reportId,
          accountCode: dto.accountCode,
          currencyCode: dto.currencyCode ?? '',
          countryCode: dto.countryCode ?? '',
          positionType: dto.positionType ?? 0,
        },
      },
      create: {
        reportId,
        accountCode: dto.accountCode,
        currencyCode: dto.currencyCode,
        countryCode: dto.countryCode,
        positionType: dto.positionType,
        value: dto.value,
      },
      update: {
        value: dto.value,
      },
    });
  }

  async batchUpsertEntries(
    companyId: string,
    reportId: string,
    entries: CreateDdrEntryDto[],
  ) {
    const report = await this.findOne(companyId, reportId);
    this.assertEditable(report);

    const results = [];
    for (const entry of entries) {
      this.validateEntryElements(entry);
      const result = await this.prisma.ddrEntry.upsert({
        where: {
          reportId_accountCode_currencyCode_countryCode_positionType: {
            reportId,
            accountCode: entry.accountCode,
            currencyCode: entry.currencyCode ?? '',
            countryCode: entry.countryCode ?? '',
            positionType: entry.positionType ?? 0,
          },
        },
        create: {
          reportId,
          accountCode: entry.accountCode,
          currencyCode: entry.currencyCode,
          countryCode: entry.countryCode,
          positionType: entry.positionType,
          value: entry.value,
        },
        update: {
          value: entry.value,
        },
      });
      results.push(result);
    }

    return results;
  }

  async removeEntry(companyId: string, reportId: string, entryId: string) {
    const report = await this.findOne(companyId, reportId);
    this.assertEditable(report);

    return this.prisma.ddrEntry.delete({ where: { id: entryId } });
  }

  // --- Parameter Management ---

  async upsertParameter(companyId: string, reportId: string, dto: CreateDdrParameterDto) {
    const report = await this.findOne(companyId, reportId);
    this.assertEditable(report);

    return this.prisma.ddrParameter.upsert({
      where: {
        reportId_parameterCode: {
          reportId,
          parameterCode: dto.parameterCode,
        },
      },
      create: {
        reportId,
        parameterCode: dto.parameterCode,
        value: dto.value,
        source: dto.source,
      },
      update: {
        value: dto.value,
        source: dto.source,
      },
    });
  }

  // --- Workflow ---

  async submitForReview(companyId: string, id: string, userId: string) {
    const report = await this.findOne(companyId, id);
    if (report.status !== DDR_STATUS.DRAFT) {
      throw new BadRequestException('Somente rascunhos podem ser enviados para revisão');
    }

    return this.prisma.ddrReport.update({
      where: { id },
      data: {
        status: DDR_STATUS.PENDING_REVIEW,
        reviewedBy: null,
        reviewedAt: null,
        updatedBy: userId,
      },
    });
  }

  async approve(companyId: string, id: string, userId: string) {
    const report = await this.findOne(companyId, id);
    if (report.status !== DDR_STATUS.PENDING_REVIEW) {
      throw new BadRequestException('Somente relatórios em revisão podem ser aprovados');
    }
    if (report.createdBy === userId) {
      throw new BadRequestException('O criador não pode aprovar o próprio relatório (maker/checker)');
    }

    return this.prisma.ddrReport.update({
      where: { id },
      data: {
        status: DDR_STATUS.APPROVED,
        approvedBy: userId,
        approvedAt: new Date(),
        updatedBy: userId,
      },
    });
  }

  async reject(companyId: string, id: string, userId: string, reason: string) {
    const report = await this.findOne(companyId, id);
    if (report.status !== DDR_STATUS.PENDING_REVIEW) {
      throw new BadRequestException('Somente relatórios em revisão podem ser rejeitados');
    }

    return this.prisma.ddrReport.update({
      where: { id },
      data: {
        status: DDR_STATUS.REJECTED,
        notes: reason,
        updatedBy: userId,
      },
    });
  }

  async markSubmitted(companyId: string, id: string, userId: string, protocolNumber?: string) {
    const report = await this.findOne(companyId, id);
    if (report.status !== DDR_STATUS.APPROVED) {
      throw new BadRequestException('Somente relatórios aprovados podem ser marcados como enviados');
    }

    return this.prisma.ddrReport.update({
      where: { id },
      data: {
        status: DDR_STATUS.SUBMITTED,
        submittedAt: new Date(),
        protocolNumber,
        updatedBy: userId,
      },
    });
  }

  // --- Daily Summary ---

  async getDailySummary(companyId: string, date: string) {
    const report = await this.prisma.ddrReport.findFirst({
      where: {
        companyId,
        referenceDate: new Date(date),
      },
      include: {
        entries: { orderBy: { accountCode: 'asc' } },
        parameters: true,
      },
    });

    if (!report) {
      return { exists: false, date, data: null };
    }

    const fxPositionEntries = report.entries.filter(
      (e) => DDR_ACCOUNTS[e.accountCode]?.type === 'FX_POSITION',
    );
    const rwacamEntries = report.entries.filter(
      (e) => DDR_ACCOUNTS[e.accountCode]?.type === 'RWACAM',
    );

    return {
      exists: true,
      date,
      status: report.status,
      totalEntries: report.entries.length,
      fxPositionCount: fxPositionEntries.length,
      rwacamValue: rwacamEntries.find((e) => e.accountCode === '310000')?.value ?? null,
      rwampadValue: report.entries.find((e) => e.accountCode === '503000')?.value ?? null,
    };
  }

  // --- Validation ---

  async validate(companyId: string, id: string) {
    const report = await this.findOne(companyId, id);
    const errors: string[] = [];

    // Check previous day was submitted
    const prevDate = new Date(report.referenceDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevReport = await this.prisma.ddrReport.findFirst({
      where: { companyId, referenceDate: prevDate },
    });
    if (prevReport && prevReport.status !== DDR_STATUS.SUBMITTED) {
      errors.push(`DDR da data-base anterior (${prevDate.toISOString().split('T')[0]}) não foi enviado`);
    }

    // Validate elements per account
    for (const entry of report.entries) {
      const def = DDR_ACCOUNTS[entry.accountCode];
      if (!def) {
        errors.push(`Conta ${entry.accountCode} não reconhecida`);
        continue;
      }

      if (def.elements.includes(83) && !entry.currencyCode) {
        errors.push(`Conta ${entry.accountCode}: Elemento 83 (moeda) obrigatório`);
      }
      if (def.elements.includes(81) && !entry.countryCode) {
        errors.push(`Conta ${entry.accountCode}: Elemento 81 (país) obrigatório`);
      }
      if (def.elements.includes(84) && entry.positionType == null) {
        errors.push(`Conta ${entry.accountCode}: Elemento 84 (posição) obrigatório`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      totalEntries: report.entries.length,
      status: report.status,
    };
  }

  // --- Helpers ---

  private assertEditable(report: { status: string }) {
    if (report.status !== DDR_STATUS.DRAFT && report.status !== DDR_STATUS.REJECTED) {
      throw new BadRequestException(
        'Relatório não pode ser editado no status atual',
      );
    }
  }

  private validateEntryElements(dto: CreateDdrEntryDto) {
    const def = DDR_ACCOUNTS[dto.accountCode];
    if (!def) {
      throw new BadRequestException(`Conta ${dto.accountCode} não reconhecida no elenco DDR`);
    }

    if (def.elements.includes(83) && !dto.currencyCode) {
      throw new BadRequestException(
        `Conta ${dto.accountCode} requer Elemento 83 (código da moeda)`,
      );
    }
    if (def.elements.includes(81) && !dto.countryCode) {
      throw new BadRequestException(
        `Conta ${dto.accountCode} requer Elemento 81 (código do país)`,
      );
    }
    if (def.elements.includes(84) && dto.positionType == null) {
      throw new BadRequestException(
        `Conta ${dto.accountCode} requer Elemento 84 (posição: 1=País, 2=Exterior)`,
      );
    }
  }
}
