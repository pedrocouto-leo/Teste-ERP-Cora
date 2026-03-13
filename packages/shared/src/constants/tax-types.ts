/**
 * Brazilian tax types and their default retention rates
 */
export const TAX_RETENTION_DEFAULTS = {
  IR: {
    name: 'Imposto de Renda Retido na Fonte',
    code: 'IR',
    rates: [
      { minAmount: 0, maxAmount: 10000, rate: 1.5 },
      { minAmount: 10000.01, maxAmount: null, rate: 1.5 },
    ],
    minRetentionAmount: 10.0, // R$ 10,00
  },
  CSLL: {
    name: 'Contribuição Social sobre Lucro Líquido',
    code: 'CSLL',
    defaultRate: 1.0,
    minRetentionAmount: 10.0,
  },
  PIS: {
    name: 'Programa de Integração Social',
    code: 'PIS',
    defaultRate: 0.65,
    minRetentionAmount: 10.0,
  },
  COFINS: {
    name: 'Contribuição para Financiamento da Seguridade Social',
    code: 'COFINS',
    defaultRate: 3.0,
    minRetentionAmount: 10.0,
  },
  ISS: {
    name: 'Imposto Sobre Serviços',
    code: 'ISS',
    defaultRate: 5.0,
    minRetentionAmount: 0,
  },
  INSS: {
    name: 'Instituto Nacional do Seguro Social',
    code: 'INSS',
    defaultRate: 11.0,
    minRetentionAmount: 10.0,
  },
} as const;

/**
 * DARF payment codes for common tax types
 */
export const DARF_CODES = {
  IRRF_SERVICOS: '1708',
  IRRF_ALUGUEL: '3208',
  PIS_RETIDO: '5979',
  COFINS_RETIDO: '5960',
  CSLL_RETIDO: '5987',
  IRPJ_LUCRO_REAL: '2362',
  CSLL_LUCRO_REAL: '6012',
} as const;
