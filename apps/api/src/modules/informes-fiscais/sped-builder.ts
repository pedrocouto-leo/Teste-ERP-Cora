/**
 * Builder de arquivos SPED EFD-Contribuições (PIS/COFINS).
 *
 * O SPED é um arquivo texto com registros pipe-delimited (`|REG|...|...|`).
 * Cada bloco é encerrado por seu registro X990, e o arquivo termina com 9999
 * contendo a contagem total de linhas. A contagem por registro vai em 9900.
 *
 * Esta implementação cobre os registros mínimos exigidos pela RFB para
 * uma escrituração mensal de empresa do regime cumulativo:
 *
 *   Bloco 0 — Abertura, Identificação e Referências
 *     0000, 0001, 0100, 0140, 0990
 *   Bloco A — Documentos de Serviços
 *     A001, A100, A170, A990
 *   Bloco M — Apuração
 *     M001, M200, M600, M990
 *   Bloco 1 — Complemento
 *     1001, 1990
 *   Bloco 9 — Controle e Encerramento
 *     9001, 9900, 9990, 9999
 */

export interface SpedHeader {
  cnpj: string; // 14 dígitos
  companyName: string;
  startDate: Date;
  endDate: Date;
  state: string; // UF, ex: 'SP'
}

export interface SpedServiceDoc {
  documentId: string; // chave da NF-e/RPS
  issueDate: Date;
  totalValue: number;
  pisAmount: number;
  cofinsAmount: number;
  baseAmount: number;
}

export interface SpedAssessment {
  pisTotal: number;
  cofinsTotal: number;
}

function digits(v: string): string {
  return v.replace(/\D/g, '');
}

function fmtDate(d: Date): string {
  // SPED usa formato DDMMAAAA
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}${mm}${yyyy}`;
}

function fmtMoney(v: number): string {
  // SPED usa vírgula decimal e sem separador de milhar
  return v.toFixed(2).replace('.', ',');
}

function rec(parts: Array<string | number | undefined>): string {
  return '|' + parts.map((p) => (p === undefined || p === null ? '' : String(p))).join('|') + '|';
}

export class SpedBuilder {
  private readonly lines: string[] = [];
  private readonly counts = new Map<string, number>();

  constructor(private readonly header: SpedHeader) {}

  // ---------- Bloco 0 ----------
  block0(): this {
    // 0000: Abertura
    this.push(
      rec([
        '0000',
        '015', // versão do leiaute
        '0', // tipo de escrituração (0 = original)
        fmtDate(this.header.startDate),
        fmtDate(this.header.endDate),
        this.header.companyName,
        digits(this.header.cnpj),
        '', // IE
        this.header.state,
        '', // município
        '', // SUFRAMA
        'A', // tipo de atividade (A = prestação de serviços)
        '1', // regime de apuração (1 = não cumulativo)
        '1', // critério de escrituração
      ]),
    );
    // 0001: Abertura do bloco 0 — 0 = bloco com dados
    this.push(rec(['0001', '0']));
    // 0100: Dados do contribuinte (mínimo)
    this.push(
      rec([
        '0100',
        this.header.companyName,
        '00000000000', // CPF do contador
        '', // CRC
        '', // CNPJ do contador
        '', // CEP
        '', // endereço
        '', // número
        '', // complemento
        '', // bairro
        '', // telefone
        '', // fax
        '', // email
        '0000000', // município
      ]),
    );
    // 0140: Estabelecimento
    this.push(
      rec([
        '0140',
        '001', // código do estabelecimento
        this.header.companyName,
        digits(this.header.cnpj),
        this.header.state,
        '', // IE estabelecimento
        '0000000', // município
      ]),
    );
    // 0990: Encerramento — contagem do bloco
    this.push(rec(['0990', this.blockCount('0')]));
    return this;
  }

  // ---------- Bloco A ----------
  blockA(docs: SpedServiceDoc[]): this {
    this.push(rec(['A001', docs.length === 0 ? '1' : '0']));
    for (const doc of docs) {
      // A100: Cabeçalho do documento de serviço
      this.push(
        rec([
          'A100',
          '0', // indicador de operação (0 = saída)
          '0', // indicador de emitente (0 = emissão própria)
          '', // CNPJ/CPF do participante
          '08', // modelo do documento (08 = NFS-e)
          '00', // situação
          'A', // série
          doc.documentId,
          fmtDate(doc.issueDate),
          fmtDate(doc.issueDate),
          fmtMoney(doc.totalValue),
          '0', // indicador de pagamento
          '0', // valor de desconto
          '0', // valor da BC
          fmtMoney(doc.totalValue),
        ]),
      );
      // A170: Item / detalhamento de PIS/COFINS
      this.push(
        rec([
          'A170',
          '001', // sequência
          doc.documentId,
          'Serviço prestado',
          fmtMoney(doc.totalValue),
          '0', // valor desconto
          '01', // CST PIS
          fmtMoney(doc.baseAmount),
          '0,65', // alíquota PIS
          fmtMoney(doc.pisAmount),
          '01', // CST COFINS
          fmtMoney(doc.baseAmount),
          '3,00', // alíquota COFINS
          fmtMoney(doc.cofinsAmount),
        ]),
      );
    }
    this.push(rec(['A990', this.blockCount('A')]));
    return this;
  }

  // ---------- Bloco M ----------
  blockM(a: SpedAssessment): this {
    this.push(rec(['M001', a.pisTotal === 0 && a.cofinsTotal === 0 ? '1' : '0']));
    // M200: Consolidação da contribuição para o PIS
    this.push(
      rec([
        'M200',
        fmtMoney(a.pisTotal), // VL_TOT_CONT_NC_PER
        '0,00', // VL_TOT_CRED_DESC
        '0,00', // VL_TOT_CRED_DESC_ANT
        fmtMoney(a.pisTotal), // VL_TOT_CONT_NC_DEV
        '0,00', // VL_RET_NC
        '0,00', // VL_OUT_DED_NC
        fmtMoney(a.pisTotal), // VL_CONT_NC_REC
        '0,00', // VL_TOT_CONT_CUM_PER
        '0,00', // VL_RET_CUM
        '0,00', // VL_OUT_DED_CUM
        '0,00', // VL_CONT_CUM_REC
        fmtMoney(a.pisTotal), // VL_TOT_CONT_REC
      ]),
    );
    // M600: Consolidação da contribuição para a COFINS
    this.push(
      rec([
        'M600',
        fmtMoney(a.cofinsTotal),
        '0,00',
        '0,00',
        fmtMoney(a.cofinsTotal),
        '0,00',
        '0,00',
        fmtMoney(a.cofinsTotal),
        '0,00',
        '0,00',
        '0,00',
        '0,00',
        fmtMoney(a.cofinsTotal),
      ]),
    );
    this.push(rec(['M990', this.blockCount('M')]));
    return this;
  }

  // ---------- Bloco 1 ----------
  block1(): this {
    this.push(rec(['1001', '1'])); // 1 = bloco sem dados
    this.push(rec(['1990', this.blockCount('1')]));
    return this;
  }

  // ---------- Bloco 9 (encerramento) ----------
  block9(): this {
    this.push(rec(['9001', '0']));
    // 9900: contagem por tipo de registro
    const summary: string[] = [];
    for (const [reg, qty] of [...this.counts.entries()].sort()) {
      summary.push(rec(['9900', reg, qty]));
    }
    // adicionar contagem dos próprios 9900 (autorrefencial) + 9990 + 9999
    const after9900Count = summary.length + 3; // 9900 (várias), 9990, 9999 — aprox.
    summary.forEach((line) => this.push(line));
    this.push(rec(['9900', '9900', summary.length + 1])); // o próprio 9900 conta a si
    this.push(rec(['9900', '9990', '1']));
    this.push(rec(['9900', '9999', '1']));

    this.push(rec(['9990', this.blockCount('9')]));
    this.push(rec(['9999', this.lines.length + 1]));
    void after9900Count;
    return this;
  }

  build(): string {
    return this.lines.join('\r\n');
  }

  private push(line: string): void {
    this.lines.push(line);
    const reg = line.split('|')[1] ?? '';
    this.counts.set(reg, (this.counts.get(reg) ?? 0) + 1);
  }

  private blockCount(blockLetter: string): number {
    let total = 0;
    for (const [reg, qty] of this.counts.entries()) {
      if (reg.startsWith(blockLetter)) total += qty;
    }
    return total + 1; // +1 para o próprio X990 que está prestes a ser emitido
  }
}
