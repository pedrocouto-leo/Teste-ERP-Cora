export const CURRENCIES = [
  { code: 'BRL', name: 'Real Brasileiro', symbol: 'R$', decimals: 2 },
  { code: 'USD', name: 'Dólar Americano', symbol: 'US$', decimals: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2 },
  { code: 'GBP', name: 'Libra Esterlina', symbol: '£', decimals: 2 },
  { code: 'JPY', name: 'Iene Japonês', symbol: '¥', decimals: 0 },
  { code: 'CHF', name: 'Franco Suíço', symbol: 'CHF', decimals: 2 },
  { code: 'ARS', name: 'Peso Argentino', symbol: 'AR$', decimals: 2 },
  { code: 'CLP', name: 'Peso Chileno', symbol: 'CL$', decimals: 0 },
  { code: 'COP', name: 'Peso Colombiano', symbol: 'CO$', decimals: 2 },
  { code: 'MXN', name: 'Peso Mexicano', symbol: 'MX$', decimals: 2 },
  { code: 'CNY', name: 'Yuan Chinês', symbol: '¥', decimals: 2 },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]['code'];
