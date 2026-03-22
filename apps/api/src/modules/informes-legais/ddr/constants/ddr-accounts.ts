export enum DdrAccountType {
  FX_POSITION = 'FX_POSITION',
  LIQUIDITY = 'LIQUIDITY',
  RWACAM = 'RWACAM',
  MARKET_RISK = 'MARKET_RISK',
  INTERNAL_MODEL = 'INTERNAL_MODEL',
}

export interface DdrAccountDefinition {
  code: string;
  name: string;
  type: DdrAccountType;
  elements: number[]; // 81=country, 83=currency, 84=position
  isCalculated: boolean;
  formula?: string;
  componentsOf?: string; // parent account code this rolls up into
}

export const DDR_ACCOUNTS: Record<string, DdrAccountDefinition> = {
  // === FX Position Accounts (elements 83+84) ===
  '111000': {
    code: '111000',
    name: 'Total da Exposição Ativa Comprada',
    type: DdrAccountType.FX_POSITION,
    elements: [83, 84],
    isCalculated: false,
  },
  '121000': {
    code: '121000',
    name: 'Total da Exposição Passiva Vendida',
    type: DdrAccountType.FX_POSITION,
    elements: [83, 84],
    isCalculated: false,
  },
  '121100': {
    code: '121100',
    name: 'Total das Exceções Art. 1§5 Circ. 3.641/2013 Exterior',
    type: DdrAccountType.FX_POSITION,
    elements: [83],
    isCalculated: false,
  },
  '131000': {
    code: '131000',
    name: 'Total das Demais Posições Compradas',
    type: DdrAccountType.FX_POSITION,
    elements: [83, 84],
    isCalculated: false,
  },
  '132000': {
    code: '132000',
    name: 'Total das Demais Posições Vendidas',
    type: DdrAccountType.FX_POSITION,
    elements: [83, 84],
    isCalculated: false,
  },
  '141000': {
    code: '141000',
    name: 'Total das Posições Líquidas Compradas',
    type: DdrAccountType.FX_POSITION,
    elements: [83, 84],
    isCalculated: true,
    formula: 'max(0, 111000 - 121000 + 131000 - 132000) por moeda/posição',
  },
  '151000': {
    code: '151000',
    name: 'Total das Posições Líquidas Vendidas',
    type: DdrAccountType.FX_POSITION,
    elements: [83, 84],
    isCalculated: true,
    formula: 'max(0, 121000 - 111000 + 132000 - 131000) por moeda/posição',
  },
  '161000': {
    code: '161000',
    name: 'Total das Posições Vendidas no Patrimônio Líquido',
    type: DdrAccountType.FX_POSITION,
    elements: [83, 84],
    isCalculated: false,
  },
  '171000': {
    code: '171000',
    name: 'Total das Posições em Investimento no Exterior',
    type: DdrAccountType.FX_POSITION,
    elements: [83, 84],
    isCalculated: false,
  },
  '181000': {
    code: '181000',
    name: 'Total do Excesso da Posição Vendida para Hedge Exterior',
    type: DdrAccountType.FX_POSITION,
    elements: [83],
    isCalculated: false,
  },

  // === Liquidity Accounts (elements 81+83) ===
  '210000': {
    code: '210000',
    name: 'Ativos de Alta Liquidez: Dinheiro em Espécie',
    type: DdrAccountType.LIQUIDITY,
    elements: [81, 83],
    isCalculated: false,
  },
  '220000': {
    code: '220000',
    name: 'Ativos de Alta Liquidez: Reservas Livres em BCs Exterior',
    type: DdrAccountType.LIQUIDITY,
    elements: [81, 83],
    isCalculated: false,
  },
  '230000': {
    code: '230000',
    name: 'Ativos de Alta Liquidez: Títulos Soberanos Exterior',
    type: DdrAccountType.LIQUIDITY,
    elements: [81, 83],
    isCalculated: false,
  },
  '240000': {
    code: '240000',
    name: 'Entradas de Caixa: Depósitos 30 dias IF Exterior',
    type: DdrAccountType.LIQUIDITY,
    elements: [81, 83],
    isCalculated: false,
  },

  // === RWACAM Accounts (no elements - single values) ===
  '310000': {
    code: '310000',
    name: 'Requerimento de Capital para o RWACAM',
    type: DdrAccountType.RWACAM,
    elements: [],
    isCalculated: true,
    formula: '310100 * (310105 / 100)',
  },
  '310100': {
    code: '310100',
    name: 'Valor Total da Exposição Cambial',
    type: DdrAccountType.RWACAM,
    elements: [],
    isCalculated: true,
    formula: '310101 + 310102 + 310103 + 310104',
  },
  '310101': {
    code: '310101',
    name: 'Exposição Líquida na Cesta de Moedas',
    type: DdrAccountType.RWACAM,
    elements: [],
    isCalculated: false,
  },
  '310102': {
    code: '310102',
    name: 'Exposição em Cada Moeda Fora da Cesta',
    type: DdrAccountType.RWACAM,
    elements: [],
    isCalculated: false,
  },
  '310103': {
    code: '310103',
    name: 'Diferencial das Exposições Líquidas na Cesta',
    type: DdrAccountType.RWACAM,
    elements: [],
    isCalculated: false,
  },
  '310104': {
    code: '310104',
    name: 'Diferencial das Posições Líquidas País/Exterior',
    type: DdrAccountType.RWACAM,
    elements: [],
    isCalculated: false,
  },
  '310105': {
    code: '310105',
    name: 'Fator F\'\'',
    type: DdrAccountType.RWACAM,
    elements: [],
    isCalculated: true,
    formula: 'min(0.22 + 8.5 * (EXP/PR)^2, 1) * 100',
  },

  // === Market Risk - RWAJUR1 ===
  '410100': {
    code: '410100',
    name: 'Fator de Incorporação RWAJUR1 - S',
    type: DdrAccountType.MARKET_RISK,
    elements: [],
    isCalculated: false,
  },
  '410101': {
    code: '410101',
    name: 'Multiplicador MPRE diário',
    type: DdrAccountType.MARKET_RISK,
    elements: [],
    isCalculated: false,
  },
  '410200': {
    code: '410200',
    name: 'VaR agregado normal e estressado',
    type: DdrAccountType.MARKET_RISK,
    elements: [],
    isCalculated: true,
    formula: '410201 + 410202',
  },
  '410201': {
    code: '410201',
    name: 'Valor em Risco',
    type: DdrAccountType.MARKET_RISK,
    elements: [],
    isCalculated: false,
  },
  '410202': {
    code: '410202',
    name: 'Valor em Risco Estressado',
    type: DdrAccountType.MARKET_RISK,
    elements: [],
    isCalculated: false,
  },
  '410300': {
    code: '410300',
    name: 'VaR médio agregado normal e estressado',
    type: DdrAccountType.MARKET_RISK,
    elements: [],
    isCalculated: true,
    formula: '410301 + 410302',
  },
  '410301': {
    code: '410301',
    name: 'Valor em Risco Médio',
    type: DdrAccountType.MARKET_RISK,
    elements: [],
    isCalculated: false,
  },
  '410302': {
    code: '410302',
    name: 'Valor em Risco Estressado Médio',
    type: DdrAccountType.MARKET_RISK,
    elements: [],
    isCalculated: false,
  },
  '410400': {
    code: '410400',
    name: 'Requerimento de Capital RWAJUR1',
    type: DdrAccountType.MARKET_RISK,
    elements: [],
    isCalculated: true,
    formula: '410401 + 410402',
  },
  '410401': {
    code: '410401',
    name: 'Requerimento Capital RWAJUR1 cenário normal',
    type: DdrAccountType.MARKET_RISK,
    elements: [],
    isCalculated: true,
    formula: 'max(410201, 410101 * 410301 / 100)',
  },
  '410402': {
    code: '410402',
    name: 'Requerimento Capital RWAJUR1 cenário estressado',
    type: DdrAccountType.MARKET_RISK,
    elements: [],
    isCalculated: true,
    formula: 'max(410202, 410302)',
  },

  // === Market Risk - RWAJUR2 ===
  '410500': {
    code: '410500',
    name: 'Requerimento de Capital RWAJUR2',
    type: DdrAccountType.MARKET_RISK,
    elements: [],
    isCalculated: true,
    formula: '410501 + 410502 + 410503 + 410504',
  },
  '410501': {
    code: '410501',
    name: 'Requerimento Capital Exposição Líquida RWAJUR2',
    type: DdrAccountType.MARKET_RISK,
    elements: [],
    isCalculated: false,
  },
  '410502': {
    code: '410502',
    name: 'Requerimento Capital Descasamento Vertical RWAJUR2',
    type: DdrAccountType.MARKET_RISK,
    elements: [],
    isCalculated: false,
  },
  '410503': {
    code: '410503',
    name: 'Requerimento Capital Descasamento Horizontal Dentro Zona RWAJUR2',
    type: DdrAccountType.MARKET_RISK,
    elements: [],
    isCalculated: false,
  },
  '410504': {
    code: '410504',
    name: 'Requerimento Capital Descasamento Horizontal Entre Zonas RWAJUR2',
    type: DdrAccountType.MARKET_RISK,
    elements: [],
    isCalculated: false,
  },

  // === Market Risk - RWAJUR3 ===
  '410600': {
    code: '410600',
    name: 'Requerimento de Capital RWAJUR3',
    type: DdrAccountType.MARKET_RISK,
    elements: [],
    isCalculated: true,
    formula: '410601 + 410602 + 410603 + 410604',
  },
  '410601': {
    code: '410601',
    name: 'Requerimento Capital Exposição Líquida RWAJUR3',
    type: DdrAccountType.MARKET_RISK,
    elements: [],
    isCalculated: false,
  },
  '410602': {
    code: '410602',
    name: 'Requerimento Capital Descasamento Vertical RWAJUR3',
    type: DdrAccountType.MARKET_RISK,
    elements: [],
    isCalculated: false,
  },
  '410603': {
    code: '410603',
    name: 'Requerimento Capital Descasamento Horizontal Dentro Zona RWAJUR3',
    type: DdrAccountType.MARKET_RISK,
    elements: [],
    isCalculated: false,
  },
  '410604': {
    code: '410604',
    name: 'Requerimento Capital Descasamento Horizontal Entre Zonas RWAJUR3',
    type: DdrAccountType.MARKET_RISK,
    elements: [],
    isCalculated: false,
  },

  // === Market Risk - RWAJUR4 ===
  '410700': {
    code: '410700',
    name: 'Requerimento de Capital RWAJUR4',
    type: DdrAccountType.MARKET_RISK,
    elements: [],
    isCalculated: true,
    formula: '410701 + 410702 + 410703 + 410704',
  },
  '410701': {
    code: '410701',
    name: 'Requerimento Capital Exposição Líquida RWAJUR4',
    type: DdrAccountType.MARKET_RISK,
    elements: [],
    isCalculated: false,
  },
  '410702': {
    code: '410702',
    name: 'Requerimento Capital Descasamento Vertical RWAJUR4',
    type: DdrAccountType.MARKET_RISK,
    elements: [],
    isCalculated: false,
  },
  '410703': {
    code: '410703',
    name: 'Requerimento Capital Descasamento Horizontal Dentro Zona RWAJUR4',
    type: DdrAccountType.MARKET_RISK,
    elements: [],
    isCalculated: false,
  },
  '410704': {
    code: '410704',
    name: 'Requerimento Capital Descasamento Horizontal Entre Zonas RWAJUR4',
    type: DdrAccountType.MARKET_RISK,
    elements: [],
    isCalculated: false,
  },

  // === Market Risk - RWACOM ===
  '410800': {
    code: '410800',
    name: 'Valor do RWACOM',
    type: DdrAccountType.MARKET_RISK,
    elements: [],
    isCalculated: true,
    formula: '410801 + 410802',
  },
  '410801': {
    code: '410801',
    name: 'Requerimento Capital Exposição Líquida RWACOM',
    type: DdrAccountType.MARKET_RISK,
    elements: [],
    isCalculated: false,
  },
  '410802': {
    code: '410802',
    name: 'Requerimento Capital Exposição Bruta RWACOM',
    type: DdrAccountType.MARKET_RISK,
    elements: [],
    isCalculated: false,
  },

  // === Market Risk - RWAACS ===
  '410900': {
    code: '410900',
    name: 'Requerimento de Capital RWAACS',
    type: DdrAccountType.MARKET_RISK,
    elements: [],
    isCalculated: true,
    formula: '410901 + 410904 + 410907 + 410908 + 410909 + 410910',
  },
  '410901': {
    code: '410901',
    name: 'Requerimento Capital Ações País ECVASELP',
    type: DdrAccountType.MARKET_RISK,
    elements: [],
    isCalculated: false,
  },
  '410904': {
    code: '410904',
    name: 'Requerimento Capital Ações Exterior ECVASELE',
    type: DdrAccountType.MARKET_RISK,
    elements: [],
    isCalculated: false,
  },
  '410907': {
    code: '410907',
    name: 'Requerimento Capital Ações País ECSVAELP',
    type: DdrAccountType.MARKET_RISK,
    elements: [],
    isCalculated: false,
  },
  '410908': {
    code: '410908',
    name: 'Requerimento Capital Ações Exterior ECSVAELE',
    type: DdrAccountType.MARKET_RISK,
    elements: [],
    isCalculated: false,
  },
  '410909': {
    code: '410909',
    name: 'Requerimento Capital Índices Ações País ECSVAELIP',
    type: DdrAccountType.MARKET_RISK,
    elements: [],
    isCalculated: false,
  },
  '410910': {
    code: '410910',
    name: 'Requerimento Capital Índices Ações Exterior ECSVAELIE',
    type: DdrAccountType.MARKET_RISK,
    elements: [],
    isCalculated: false,
  },

  // === Internal Model Accounts ===
  '501000': {
    code: '501000',
    name: 'Total Demais Posições Compradas no País',
    type: DdrAccountType.INTERNAL_MODEL,
    elements: [83],
    isCalculated: false,
  },
  '502000': {
    code: '502000',
    name: 'Total Demais Posições Vendidas no País',
    type: DdrAccountType.INTERNAL_MODEL,
    elements: [83],
    isCalculated: false,
  },
  '503000': {
    code: '503000',
    name: 'Requerimento de Capital RWAMPAD',
    type: DdrAccountType.INTERNAL_MODEL,
    elements: [],
    isCalculated: true,
    formula: '310000 + 410400 + 410500 + 410600 + 410700 + 410800 + 410900',
  },
  '504000': {
    code: '504000',
    name: 'Fator de Transição Modelos Internos S1',
    type: DdrAccountType.INTERNAL_MODEL,
    elements: [],
    isCalculated: false,
  },
  '505000': {
    code: '505000',
    name: 'Requerimento Capital Exposições Não Relevantes VADPAD',
    type: DdrAccountType.INTERNAL_MODEL,
    elements: [],
    isCalculated: false,
  },
  '506000': {
    code: '506000',
    name: 'Fator de Incorporação VaR Estressado S2',
    type: DdrAccountType.INTERNAL_MODEL,
    elements: [],
    isCalculated: false,
  },
};

export const DDR_STATUS = {
  DRAFT: 'DRAFT',
  PENDING_REVIEW: 'PENDING_REVIEW',
  APPROVED: 'APPROVED',
  SUBMITTED: 'SUBMITTED',
  REJECTED: 'REJECTED',
} as const;

export type DdrStatus = (typeof DDR_STATUS)[keyof typeof DDR_STATUS];

export const DDR_PARAMETER_CODES = {
  FACTOR_F: 'FACTOR_F',
  FACTOR_H: 'FACTOR_H',
  FACTOR_G: 'FACTOR_G',
  MPRE: 'MPRE',
  MEXT: 'MEXT',
  MPCO: 'MPCO',
  MJUR: 'MJUR',
  EXP_VALUE: 'EXP_VALUE',
  PR_VALUE: 'PR_VALUE',
} as const;
