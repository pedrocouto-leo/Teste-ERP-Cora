/**
 * Geradores de XML para EFD-Reinf — eventos da série R-1000, R-4010,
 * R-4020 e R-9000 conforme leiaute do Manual de Orientação (versão 2.01.02).
 *
 * Não inclui assinatura digital — fica a cargo do transmitter real.
 */

function esc(v: string | number | undefined | null): string {
  if (v === null || v === undefined) return '';
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function digits(v: string): string {
  return v.replace(/\D/g, '');
}

function money(v: number): string {
  return v.toFixed(2);
}

function yyyymm(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * R-1000 — Informações do Contribuinte.
 * Enviado uma vez (ou em caso de alteração cadastral).
 */
export interface R1000Input {
  companyCnpj: string;
  companyName: string;
  validFrom: string; // YYYY-MM
  classificacaoTributaria: string; // ex: '99' p/ instituições financeiras
}

export function buildR1000Xml(input: R1000Input): string {
  const cnpj8 = digits(input.companyCnpj).substring(0, 8);
  const id = `ID1${cnpj8}${Date.now()}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<Reinf xmlns="http://www.reinf.esocial.gov.br/schemas/evtInfoContri/v2_01_02">
  <evtInfoContri id="${esc(id)}">
    <ideEvento>
      <tpAmb>2</tpAmb>
      <procEmi>1</procEmi>
      <verProc>CORA-ERP-1.0</verProc>
    </ideEvento>
    <ideContri>
      <tpInsc>1</tpInsc>
      <nrInsc>${esc(cnpj8)}</nrInsc>
    </ideContri>
    <infoContri>
      <inclusao>
        <idePeriodo>
          <iniValid>${esc(input.validFrom)}</iniValid>
        </idePeriodo>
        <infoCadastro>
          <classTrib>${esc(input.classificacaoTributaria)}</classTrib>
          <indEscrituracao>1</indEscrituracao>
          <indDesoneracao>0</indDesoneracao>
          <indAcordoIsenMulta>0</indAcordoIsenMulta>
          <indSitPJ>0</indSitPJ>
          <contato>
            <nmCtt>${esc(input.companyName)}</nmCtt>
            <cpfCtt>00000000000</cpfCtt>
            <foneFixo>0000000000</foneFixo>
            <email>fiscal@empresa.com.br</email>
          </contato>
        </infoCadastro>
      </inclusao>
    </infoContri>
  </evtInfoContri>
</Reinf>`;
}

/**
 * R-4010 — Pagamentos / créditos a beneficiário PF (com retenção de IR).
 */
export interface R4010Input {
  companyCnpj: string;
  beneficiaryCpf: string;
  beneficiaryName: string;
  period: { year: number; month: number };
  paymentDate: Date;
  natureCode: string; // código da natureza do rendimento (tabela 1 do leiaute)
  grossAmount: number;
  irAmount: number;
}

export function buildR4010Xml(input: R4010Input): string {
  const cnpj8 = digits(input.companyCnpj).substring(0, 8);
  const dt = input.paymentDate.toISOString().split('T')[0];
  const id = `ID2${cnpj8}${Date.now()}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<Reinf xmlns="http://www.reinf.esocial.gov.br/schemas/evt4010PagtoBenefPF/v2_01_02">
  <evtRetPF id="${esc(id)}">
    <ideEvento>
      <indRetif>1</indRetif>
      <perApur>${esc(yyyymm(input.period.year, input.period.month))}</perApur>
      <tpAmb>2</tpAmb>
      <procEmi>1</procEmi>
      <verProc>CORA-ERP-1.0</verProc>
    </ideEvento>
    <ideContri>
      <tpInsc>1</tpInsc>
      <nrInsc>${esc(cnpj8)}</nrInsc>
    </ideContri>
    <ideBenef>
      <cpfBenef>${esc(digits(input.beneficiaryCpf))}</cpfBenef>
      <nmBenef>${esc(input.beneficiaryName)}</nmBenef>
      <idePgto>
        <natRend>${esc(input.natureCode)}</natRend>
        <infoPgto>
          <dtFG>${esc(dt)}</dtFG>
          <vlrRendBruto>${money(input.grossAmount)}</vlrRendBruto>
          <vlrIR>${money(input.irAmount)}</vlrIR>
        </infoPgto>
      </idePgto>
    </ideBenef>
  </evtRetPF>
</Reinf>`;
}

/**
 * R-4020 — Pagamentos / créditos a beneficiário PJ (retenções IR/CSLL/PIS/COFINS).
 */
export interface R4020Input {
  companyCnpj: string;
  beneficiaryCnpj: string;
  beneficiaryName: string;
  period: { year: number; month: number };
  paymentDate: Date;
  natureCode: string;
  grossAmount: number;
  irAmount: number;
  csllAmount: number;
  pisAmount: number;
  cofinsAmount: number;
}

export function buildR4020Xml(input: R4020Input): string {
  const cnpj8 = digits(input.companyCnpj).substring(0, 8);
  const benefCnpj = digits(input.beneficiaryCnpj);
  const dt = input.paymentDate.toISOString().split('T')[0];
  const id = `ID3${cnpj8}${Date.now()}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<Reinf xmlns="http://www.reinf.esocial.gov.br/schemas/evt4020PagtoBenefPJ/v2_01_02">
  <evtRetPJ id="${esc(id)}">
    <ideEvento>
      <indRetif>1</indRetif>
      <perApur>${esc(yyyymm(input.period.year, input.period.month))}</perApur>
      <tpAmb>2</tpAmb>
      <procEmi>1</procEmi>
      <verProc>CORA-ERP-1.0</verProc>
    </ideEvento>
    <ideContri>
      <tpInsc>1</tpInsc>
      <nrInsc>${esc(cnpj8)}</nrInsc>
    </ideContri>
    <ideBenef>
      <cnpjBenef>${esc(benefCnpj)}</cnpjBenef>
      <nmBenef>${esc(input.beneficiaryName)}</nmBenef>
      <idePgto>
        <natRend>${esc(input.natureCode)}</natRend>
        <infoPgto>
          <dtFG>${esc(dt)}</dtFG>
          <vlrRendBruto>${money(input.grossAmount)}</vlrRendBruto>
          <vlrIR>${money(input.irAmount)}</vlrIR>
          <vlrCSLL>${money(input.csllAmount)}</vlrCSLL>
          <vlrPIS>${money(input.pisAmount)}</vlrPIS>
          <vlrCOFINS>${money(input.cofinsAmount)}</vlrCOFINS>
        </infoPgto>
      </idePgto>
    </ideBenef>
  </evtRetPJ>
</Reinf>`;
}

/**
 * R-9000 — Exclusão de evento previamente enviado.
 */
export interface R9000Input {
  companyCnpj: string;
  eventTypeToExclude: 'R-4010' | 'R-4020';
  receiptToExclude: string;
}

export function buildR9000Xml(input: R9000Input): string {
  const cnpj8 = digits(input.companyCnpj).substring(0, 8);
  const id = `ID9${cnpj8}${Date.now()}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<Reinf xmlns="http://www.reinf.esocial.gov.br/schemas/evtExclusao/v2_01_02">
  <evtExclusao id="${esc(id)}">
    <ideEvento>
      <tpAmb>2</tpAmb>
      <procEmi>1</procEmi>
      <verProc>CORA-ERP-1.0</verProc>
    </ideEvento>
    <ideContri>
      <tpInsc>1</tpInsc>
      <nrInsc>${esc(cnpj8)}</nrInsc>
    </ideContri>
    <infoExclusao>
      <tpEvento>${esc(input.eventTypeToExclude)}</tpEvento>
      <nrRecEvtExcl>${esc(input.receiptToExclude)}</nrRecEvtExcl>
    </infoExclusao>
  </evtExclusao>
</Reinf>`;
}
