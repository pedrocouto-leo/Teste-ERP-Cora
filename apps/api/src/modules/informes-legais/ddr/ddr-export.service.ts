import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DDR_ACCOUNTS } from './constants/ddr-accounts';

@Injectable()
export class DdrExportService {
  private readonly logger = new Logger(DdrExportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async exportToXml(companyId: string, reportId: string): Promise<string> {
    const report = await this.prisma.ddrReport.findFirst({
      where: { id: reportId, companyId },
      include: {
        entries: { orderBy: { accountCode: 'asc' } },
        parameters: { orderBy: { parameterCode: 'asc' } },
        company: true,
      },
    });

    if (!report) {
      throw new NotFoundException(`DDR ${reportId} não encontrado`);
    }

    const dateStr = report.referenceDate.toISOString().split('T')[0];
    const cnpj = report.company.cnpj.replace(/[^\d]/g, '');

    // Group entries by account code
    const accountGroups = new Map<string, typeof report.entries>();
    for (const entry of report.entries) {
      const group = accountGroups.get(entry.accountCode) ?? [];
      group.push(entry);
      accountGroups.set(entry.accountCode, group);
    }

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<DDR>\n';
    xml += '  <Cabecalho>\n';
    xml += '    <CodigoDocumento>2011</CodigoDocumento>\n';
    xml += `    <DataBase>${dateStr}</DataBase>\n`;
    xml += `    <CNPJ>${this.escapeXml(cnpj)}</CNPJ>\n`;
    xml += '    <TipoRemessa>I</TipoRemessa>\n';
    xml += '  </Cabecalho>\n';
    xml += '  <Contas>\n';

    // Sort account codes and render
    const sortedCodes = Array.from(accountGroups.keys()).sort();
    for (const accountCode of sortedCodes) {
      const entries = accountGroups.get(accountCode)!;
      const def = DDR_ACCOUNTS[accountCode];
      const hasDetails = def && def.elements.length > 0;

      if (hasDetails) {
        xml += `    <Conta codigo="${accountCode}">\n`;
        for (const entry of entries) {
          const attrs: string[] = [];
          if (entry.currencyCode) {
            attrs.push(`moeda="${this.escapeXml(entry.currencyCode)}"`);
          }
          if (entry.countryCode) {
            attrs.push(`pais="${this.escapeXml(entry.countryCode)}"`);
          }
          if (entry.positionType != null) {
            attrs.push(`posicao="${entry.positionType}"`);
          }
          const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
          xml += `      <Detalhamento${attrStr}>${Number(entry.value).toFixed(2)}</Detalhamento>\n`;
        }
        xml += `    </Conta>\n`;
      } else {
        const value = entries.length > 0 ? Number(entries[0].value).toFixed(2) : '0.00';
        xml += `    <Conta codigo="${accountCode}">${value}</Conta>\n`;
      }
    }

    xml += '  </Contas>\n';

    // Parameters
    if (report.parameters.length > 0) {
      xml += '  <Parametros>\n';
      for (const param of report.parameters) {
        xml += `    <Parametro codigo="${this.escapeXml(param.parameterCode)}">${Number(param.value)}</Parametro>\n`;
      }
      xml += '  </Parametros>\n';
    }

    xml += '</DDR>\n';

    this.logger.log(`Exported DDR XML for report ${reportId}, date ${dateStr}`);

    return xml;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
