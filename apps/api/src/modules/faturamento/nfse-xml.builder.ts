/**
 * Gerador de XML RPS no padrão ABRASF 2.04 (modelo nacional adotado por
 * municípios como Curitiba, Porto Alegre, BH e dezenas de outros).
 *
 * Não é uma implementação de assinatura digital — para isso é necessário
 * um certificado A1/A3 do contribuinte e usar `xml-crypto`/`node-forge` no
 * transmitter real. O XML produzido aqui é estruturalmente válido e
 * suficiente para validação de schema (XSD) em homologação.
 */

export interface NfseXmlInput {
  rpsNumber: string;
  rpsSeries: string;
  issueDate: Date;
  serviceCityCode: string; // código IBGE do município
  provider: {
    cnpj: string;
    inscricaoMunicipal?: string;
    razaoSocial: string;
  };
  client: {
    cnpjOrCpf: string;
    name: string;
    email?: string;
    address?: {
      street: string;
      number: string;
      district: string;
      cityCode: string;
      state: string;
      zip: string;
    };
  };
  service: {
    listItemCode: string; // ex: '01.01' (consultoria em informática)
    cnaeCode?: string;
    discrimination: string;
    quantity: number;
    unitValue: number;
    totalServices: number;
    deductions?: number;
    issRate: number; // em %, ex: 5
    issAmount: number;
    issWithheld: boolean;
    pisAmount?: number;
    cofinsAmount?: number;
    inssAmount?: number;
    irAmount?: number;
    csllAmount?: number;
    netAmount: number;
  };
}

function esc(value: string | number | undefined | null): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function money(value: number | undefined | null): string {
  return (value ?? 0).toFixed(2);
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function buildNfseRpsXml(input: NfseXmlInput): string {
  const date = input.issueDate.toISOString().split('T')[0];
  const providerCnpj = onlyDigits(input.provider.cnpj);
  const takerDoc = onlyDigits(input.client.cnpjOrCpf);
  const takerDocType = takerDoc.length === 14 ? 'Cnpj' : 'Cpf';

  return `<?xml version="1.0" encoding="UTF-8"?>
<EnviarLoteRpsEnvio xmlns="http://www.abrasf.org.br/nfse.xsd">
  <LoteRps Id="lote_${esc(input.rpsNumber)}" versao="2.04">
    <NumeroLote>${esc(input.rpsNumber)}</NumeroLote>
    <CpfCnpj><Cnpj>${esc(providerCnpj)}</Cnpj></CpfCnpj>
    <InscricaoMunicipal>${esc(input.provider.inscricaoMunicipal ?? '')}</InscricaoMunicipal>
    <QuantidadeRps>1</QuantidadeRps>
    <ListaRps>
      <Rps>
        <InfDeclaracaoPrestacaoServico Id="rps_${esc(input.rpsNumber)}">
          <Rps>
            <IdentificacaoRps>
              <Numero>${esc(input.rpsNumber)}</Numero>
              <Serie>${esc(input.rpsSeries)}</Serie>
              <Tipo>1</Tipo>
            </IdentificacaoRps>
            <DataEmissao>${esc(date)}</DataEmissao>
            <Status>1</Status>
          </Rps>
          <Competencia>${esc(date)}</Competencia>
          <Servico>
            <Valores>
              <ValorServicos>${money(input.service.totalServices)}</ValorServicos>
              <ValorDeducoes>${money(input.service.deductions ?? 0)}</ValorDeducoes>
              <ValorPis>${money(input.service.pisAmount ?? 0)}</ValorPis>
              <ValorCofins>${money(input.service.cofinsAmount ?? 0)}</ValorCofins>
              <ValorInss>${money(input.service.inssAmount ?? 0)}</ValorInss>
              <ValorIr>${money(input.service.irAmount ?? 0)}</ValorIr>
              <ValorCsll>${money(input.service.csllAmount ?? 0)}</ValorCsll>
              <IssRetido>${input.service.issWithheld ? 1 : 2}</IssRetido>
              <ValorIss>${money(input.service.issAmount)}</ValorIss>
              <Aliquota>${(input.service.issRate / 100).toFixed(4)}</Aliquota>
              <ValorLiquidoNfse>${money(input.service.netAmount)}</ValorLiquidoNfse>
            </Valores>
            <IssRetido>${input.service.issWithheld ? 1 : 2}</IssRetido>
            <ItemListaServico>${esc(input.service.listItemCode)}</ItemListaServico>
            ${input.service.cnaeCode ? `<CodigoCnae>${esc(input.service.cnaeCode)}</CodigoCnae>` : ''}
            <Discriminacao>${esc(input.service.discrimination)}</Discriminacao>
            <CodigoMunicipio>${esc(input.serviceCityCode)}</CodigoMunicipio>
            <ExigibilidadeISS>1</ExigibilidadeISS>
          </Servico>
          <Prestador>
            <CpfCnpj><Cnpj>${esc(providerCnpj)}</Cnpj></CpfCnpj>
            <InscricaoMunicipal>${esc(input.provider.inscricaoMunicipal ?? '')}</InscricaoMunicipal>
          </Prestador>
          <Tomador>
            <IdentificacaoTomador>
              <CpfCnpj><${takerDocType}>${esc(takerDoc)}</${takerDocType}></CpfCnpj>
            </IdentificacaoTomador>
            <RazaoSocial>${esc(input.client.name)}</RazaoSocial>
            ${input.client.email ? `<Contato><Email>${esc(input.client.email)}</Email></Contato>` : ''}
            ${input.client.address ? `<Endereco>
              <Endereco>${esc(input.client.address.street)}</Endereco>
              <Numero>${esc(input.client.address.number)}</Numero>
              <Bairro>${esc(input.client.address.district)}</Bairro>
              <CodigoMunicipio>${esc(input.client.address.cityCode)}</CodigoMunicipio>
              <Uf>${esc(input.client.address.state)}</Uf>
              <Cep>${esc(onlyDigits(input.client.address.zip))}</Cep>
            </Endereco>` : ''}
          </Tomador>
        </InfDeclaracaoPrestacaoServico>
      </Rps>
    </ListaRps>
  </LoteRps>
</EnviarLoteRpsEnvio>`;
}
