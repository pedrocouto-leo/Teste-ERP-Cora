import {
  isValidCPF,
  isValidCNPJ,
  isValidCPFOrCNPJ,
  formatCPF,
  formatCNPJ,
} from '../cpf-cnpj.validator';

describe('CPF Validator', () => {
  it('should validate correct CPFs', () => {
    expect(isValidCPF('529.982.247-25')).toBe(true);
    expect(isValidCPF('52998224725')).toBe(true);
  });

  it('should reject invalid CPFs', () => {
    expect(isValidCPF('111.111.111-11')).toBe(false);
    expect(isValidCPF('000.000.000-00')).toBe(false);
    expect(isValidCPF('123.456.789-00')).toBe(false);
    expect(isValidCPF('12345')).toBe(false);
    expect(isValidCPF('')).toBe(false);
  });

  it('should format CPF correctly', () => {
    expect(formatCPF('52998224725')).toBe('529.982.247-25');
  });
});

describe('CNPJ Validator', () => {
  it('should validate correct CNPJs', () => {
    expect(isValidCNPJ('11.222.333/0001-81')).toBe(true);
    expect(isValidCNPJ('11222333000181')).toBe(true);
  });

  it('should reject invalid CNPJs', () => {
    expect(isValidCNPJ('11.111.111/1111-11')).toBe(false);
    expect(isValidCNPJ('00.000.000/0000-00')).toBe(false);
    expect(isValidCNPJ('12345')).toBe(false);
    expect(isValidCNPJ('')).toBe(false);
  });

  it('should format CNPJ correctly', () => {
    expect(formatCNPJ('11222333000181')).toBe('11.222.333/0001-81');
  });
});

describe('CPF or CNPJ Validator', () => {
  it('should validate CPF when 11 digits', () => {
    expect(isValidCPFOrCNPJ('52998224725')).toBe(true);
  });

  it('should validate CNPJ when 14 digits', () => {
    expect(isValidCPFOrCNPJ('11222333000181')).toBe(true);
  });

  it('should reject invalid lengths', () => {
    expect(isValidCPFOrCNPJ('12345')).toBe(false);
    expect(isValidCPFOrCNPJ('')).toBe(false);
  });
});
