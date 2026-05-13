export enum PersonType {
  PF = 'PF', // Pessoa Fisica
  PJ = 'PJ', // Pessoa Juridica
  EX = 'EX', // Exterior
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum BankAccountType {
  CC = 'CC', // Conta Corrente
  CP = 'CP', // Conta Poupanca
  CI = 'CI', // Conta de Investimento
}

export enum HolidayScope {
  NATIONAL = 'NATIONAL',
  STATE = 'STATE',
  MUNICIPAL = 'MUNICIPAL',
  COMPANY = 'COMPANY',
}

export enum TaxType {
  IR = 'IR',
  CSLL = 'CSLL',
  PIS = 'PIS',
  COFINS = 'COFINS',
  ISS = 'ISS',
  INSS = 'INSS',
  ISSQN = 'ISSQN',
}

export enum ProductServiceType {
  PRODUCT = 'PRODUCT',
  SERVICE = 'SERVICE',
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
}

export enum ContractType {
  FIXED = 'FIXED',           // Fixo
  VARIABLE = 'VARIABLE',     // Variavel
  INSTALLMENT = 'INSTALLMENT', // Parcela indeterminada
  INDEFINITE = 'INDEFINITE', // Indeterminado
}

export enum PaymentMethod {
  BOLETO = 'BOLETO',
  TED = 'TED',
  PIX = 'PIX',
  CHEQUE = 'CHEQUE',
  DDA = 'DDA',
  CNAB = 'CNAB',
  RECEIPT = 'RECEIPT', // Recibo
}

export enum TitleStatus {
  OPEN = 'OPEN',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  OVERDUE = 'OVERDUE',
}

export enum JournalEntryType {
  MANUAL = 'MANUAL',
  AUTO = 'AUTO',
  TEMPLATE = 'TEMPLATE',
}
