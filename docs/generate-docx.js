/**
 * Script para gerar documentacao .docx do CORA ERP
 * Executar: npx ts-node docs/generate-docx.js
 * Requer: npm install docx
 */

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, PageBreak, LevelFormat,
} = require('docx');
const fs = require('fs');

const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 60, bottom: 60, left: 100, right: 100 };

function headerCell(text, width) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: '1A1A2E', type: ShadingType.CLEAR },
    margins: cellMargins,
    children: [new Paragraph({
      children: [new TextRun({ text, bold: true, color: 'FFFFFF', font: 'Arial', size: 20 })],
    })],
  });
}

function cell(text, width) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    margins: cellMargins,
    children: [new Paragraph({
      children: [new TextRun({ text, font: 'Arial', size: 20 })],
    })],
  });
}

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ heading: level, children: [new TextRun({ text, bold: true })] });
}

function text(content, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text: content, font: 'Arial', size: 22, ...opts })],
  });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 36, bold: true, font: 'Arial', color: '1A1A2E' },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: 'Arial', color: '2563EB' },
        paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: 'Arial', color: '374151' },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [{
      reference: 'bullets',
      levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
    }],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1200, bottom: 1440, left: 1200 },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: 'CORA ERP - Documentacao Tecnica', font: 'Arial', size: 16, color: '999999' })],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: 'CORA Sociedade de Credito, Financiamento e Investimento S.A. - Pagina ', size: 16, color: '999999' }),
            new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '999999' }),
          ],
        })],
      }),
    },
    children: [
      // CAPA
      new Paragraph({ spacing: { before: 3000 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'CORA ERP', bold: true, font: 'Arial', size: 72, color: '1A1A2E' })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [new TextRun({ text: 'Sistema de Gestao Financeira', font: 'Arial', size: 32, color: '6B7280' })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Documentacao Tecnica', font: 'Arial', size: 28, color: '2563EB' })],
      }),
      new Paragraph({ spacing: { before: 1000 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Versao 0.1.0 | Marco 2026', font: 'Arial', size: 22, color: '9CA3AF' })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'CORA Sociedade de Credito, Financiamento e Investimento S.A.', font: 'Arial', size: 20, color: '9CA3AF' })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Instituicao Financeira S4 - SCFI', font: 'Arial', size: 20, color: '9CA3AF' })],
      }),

      new Paragraph({ children: [new PageBreak()] }),

      // NUMEROS
      heading('1. Visao Geral', HeadingLevel.HEADING_1),
      text('O CORA ERP e um sistema web completo de gestao financeira desenvolvido para uma instituicao financeira S4 (SCFI), replicando os 14 modulos do ERP Matera com APIs REST completas.'),

      heading('Numeros do Projeto', HeadingLevel.HEADING_3),
      new Table({
        width: { size: 9506, type: WidthType.DXA },
        columnWidths: [5000, 4506],
        rows: [
          new TableRow({ children: [headerCell('Metrica', 5000), headerCell('Valor', 4506)] }),
          new TableRow({ children: [cell('Arquivos de codigo', 5000), cell('127+', 4506)] }),
          new TableRow({ children: [cell('Linhas de codigo', 5000), cell('12.400+', 4506)] }),
          new TableRow({ children: [cell('Entidades no banco', 5000), cell('55', 4506)] }),
          new TableRow({ children: [cell('Modulos implementados', 5000), cell('9 de 14', 4506)] }),
          new TableRow({ children: [cell('Endpoints REST', 5000), cell('120+', 4506)] }),
        ],
      }),

      heading('Stack Tecnologica', HeadingLevel.HEADING_3),
      new Table({
        width: { size: 9506, type: WidthType.DXA },
        columnWidths: [3000, 6506],
        rows: [
          new TableRow({ children: [headerCell('Camada', 3000), headerCell('Tecnologia', 6506)] }),
          new TableRow({ children: [cell('Backend', 3000), cell('Node.js + TypeScript (NestJS 10)', 6506)] }),
          new TableRow({ children: [cell('Frontend', 3000), cell('React + TypeScript (Next.js 14)', 6506)] }),
          new TableRow({ children: [cell('Banco de Dados', 3000), cell('PostgreSQL 16', 6506)] }),
          new TableRow({ children: [cell('ORM', 3000), cell('Prisma 6', 6506)] }),
          new TableRow({ children: [cell('Cache', 3000), cell('Redis 7', 6506)] }),
          new TableRow({ children: [cell('Monorepo', 3000), cell('Turborepo', 6506)] }),
          new TableRow({ children: [cell('CI/CD', 3000), cell('GitHub Actions', 6506)] }),
          new TableRow({ children: [cell('CSS', 3000), cell('Tailwind CSS 3', 6506)] }),
        ],
      }),

      new Paragraph({ children: [new PageBreak()] }),

      // MODULOS
      heading('2. Modulos Implementados', HeadingLevel.HEADING_1),

      heading('2.1 Controle de Acesso', HeadingLevel.HEADING_2),
      text('Rota: /api/v1/auth | Status: Completo', { bold: true, color: '059669' }),
      text('JWT login/logout/refresh, politica de senhas (12 chars, historico 5, lockout), CRUD usuarios/roles/permissoes, audit log com filtros, maker/checker.'),

      heading('2.2 Cadastros Gerais', HeadingLevel.HEADING_2),
      text('Rota: /api/v1/cadastro | Status: Completo', { bold: true, color: '059669' }),
      text('Fornecedores com CPF/CNPJ e maker/checker, clientes, centros de custo hierarquicos, bancos + agencias, contas bancarias, moedas + cambio, feriados, projetos.'),

      heading('2.3 Gestao Contabil', HeadingLevel.HEADING_2),
      text('Rota: /api/v1/contabilidade | Status: Completo', { bold: true, color: '059669' }),
      text('Plano de contas COSIF (9 niveis), lancamentos com debito=credito, periodos contabeis, templates de lancamento, balancete, balanco patrimonial, DRE.'),

      heading('2.4 Controle Orcamentario', HeadingLevel.HEADING_2),
      text('Rota: /api/v1/orcamento | Status: Completo', { bold: true, color: '059669' }),
      text('Orcamentos por periodo, linhas com categorias, remanejamento com aprovacao, consulta orcado vs realizado.'),

      heading('2.5 Caixas e Bancos', HeadingLevel.HEADING_2),
      text('Rota: /api/v1/caixa-bancos | Status: Completo', { bold: true, color: '059669' }),
      text('Contas de caixa, movimentacoes atomicas, transferencias entre contas, importacao CNAB 240, conciliacao bancaria automatica e manual.'),

      heading('2.6 Contas a Pagar', HeadingLevel.HEADING_2),
      text('Rota: /api/v1/contas-pagar | Status: Completo', { bold: true, color: '059669' }),
      text('Titulos com rateio CC (100%), workflow 4 etapas, calculo tributario (IR/CSLL/PIS/COFINS/ISS/INSS), pagamento, marcacao de vencidos.'),

      heading('2.7 Contas a Receber', HeadingLevel.HEADING_2),
      text('Rota: /api/v1/contas-receber | Status: Completo', { bold: true, color: '059669' }),
      text('Titulos a receber, recebimento de pagamentos, geracao de boletos, negociacao com clientes.'),

      heading('2.8 Compras e Recebimento', HeadingLevel.HEADING_2),
      text('Rota: /api/v1/compras | Status: Completo', { bold: true, color: '059669' }),
      text('Solicitacoes com alcada, cotacoes, pedidos de compra, recebimento com NF-e XML.'),

      heading('2.9 Contratos e Faturamento', HeadingLevel.HEADING_2),
      text('Status: Em andamento', { bold: true, color: 'D97706' }),

      new Paragraph({ children: [new PageBreak()] }),

      // SEGURANCA
      heading('3. Seguranca', HeadingLevel.HEADING_1),
      heading('5 Camadas de Protecao', HeadingLevel.HEADING_3),
      new Table({
        width: { size: 9506, type: WidthType.DXA },
        columnWidths: [2500, 7006],
        rows: [
          new TableRow({ children: [headerCell('Camada', 2500), headerCell('Descricao', 7006)] }),
          new TableRow({ children: [cell('JWT Auth', 2500), cell('Access token 15min + Refresh 7 dias, bcryptjs', 7006)] }),
          new TableRow({ children: [cell('RBAC', 2500), cell('Roles por empresa com permissoes granulares', 7006)] }),
          new TableRow({ children: [cell('Tenant Isolation', 2500), cell('companyId em todas as queries', 7006)] }),
          new TableRow({ children: [cell('Maker/Checker', 2500), cell('Criador nao pode aprovar (4 eyes)', 7006)] }),
          new TableRow({ children: [cell('Authority Limits', 2500), cell('Alcadas por valor e centro de custo', 7006)] }),
        ],
      }),

      new Paragraph({ children: [new PageBreak()] }),

      // BANCO
      heading('4. Banco de Dados', HeadingLevel.HEADING_1),
      text('55 entidades distribuidas em 9 modulos. PostgreSQL 16 com Prisma ORM.'),
      heading('Convencoes', HeadingLevel.HEADING_3),
      new Table({
        width: { size: 9506, type: WidthType.DXA },
        columnWidths: [3500, 6006],
        rows: [
          new TableRow({ children: [headerCell('Aspecto', 3500), headerCell('Padrao', 6006)] }),
          new TableRow({ children: [cell('Primary Keys', 3500), cell('UUID v4', 6006)] }),
          new TableRow({ children: [cell('Valores monetarios', 3500), cell('NUMERIC(18,4)', 6006)] }),
          new TableRow({ children: [cell('Multi-tenancy', 3500), cell('companyId em todas as tabelas', 6006)] }),
          new TableRow({ children: [cell('Soft delete', 3500), cell('active: false ou deletedAt', 6006)] }),
          new TableRow({ children: [cell('Auditoria', 3500), cell('createdBy, updatedBy (UUID)', 6006)] }),
        ],
      }),

      new Paragraph({ children: [new PageBreak()] }),

      // CRONOGRAMA
      heading('5. Cronograma', HeadingLevel.HEADING_1),
      new Table({
        width: { size: 9506, type: WidthType.DXA },
        columnWidths: [1200, 1500, 4300, 2506],
        rows: [
          new TableRow({ children: [headerCell('Fase', 1200), headerCell('Semanas', 1500), headerCell('Modulos', 4300), headerCell('Status', 2506)] }),
          new TableRow({ children: [cell('0', 1200), cell('1-2', 1500), cell('Infraestrutura', 4300), cell('Completo', 2506)] }),
          new TableRow({ children: [cell('1', 1200), cell('3-8', 1500), cell('Acesso + Cadastros', 4300), cell('Completo', 2506)] }),
          new TableRow({ children: [cell('2', 1200), cell('9-16', 1500), cell('Contabilidade + Orcamento', 4300), cell('Completo', 2506)] }),
          new TableRow({ children: [cell('3', 1200), cell('15-22', 1500), cell('Caixa + CP + CR', 4300), cell('Completo', 2506)] }),
          new TableRow({ children: [cell('4', 1200), cell('23-30', 1500), cell('Compras + Contratos + Faturamento', 4300), cell('Em andamento', 2506)] }),
          new TableRow({ children: [cell('5', 1200), cell('31-34', 1500), cell('Patrimonio + Liquidacao', 4300), cell('Pendente', 2506)] }),
          new TableRow({ children: [cell('6', 1200), cell('35-42', 1500), cell('Informes Fiscais + Legais', 4300), cell('Pendente', 2506)] }),
          new TableRow({ children: [cell('7', 1200), cell('43-48', 1500), cell('Hardening + Deploy', 4300), cell('Pendente', 2506)] }),
        ],
      }),
      text('Timeline total estimado: 48 semanas (~12 meses)', { bold: true }),
    ],
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  const outPath = 'docs/CORA-ERP-Documentacao-Tecnica.docx';
  fs.writeFileSync(outPath, buffer);
  console.log(`Documento gerado: ${outPath}`);
});
