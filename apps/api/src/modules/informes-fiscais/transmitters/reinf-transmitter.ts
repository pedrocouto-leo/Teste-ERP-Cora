/**
 * Resultado da transmissão de um lote EFD-Reinf ao webservice da RFB.
 */
export interface ReinfTransmitResult {
  status: 'ACCEPTED' | 'REJECTED' | 'PENDING';
  receipt?: string; // protocolo de recebimento da RFB
  rejectionCode?: string;
  rejectionMessage?: string;
  responseXml?: string;
  transmittedAt: Date;
}

/**
 * Contrato de transmissão EFD-Reinf.
 *
 * Implementações reais devem:
 *   - assinar o XML com certificado A1/A3 (XMLDSig);
 *   - chamar o WS específico (`producaoRestrita.efdreinf.gov.br` ou
 *     `efdreinf.receita.fazenda.gov.br`);
 *   - tratar protocolo, recibo e códigos de rejeição da SERPRO.
 */
export interface ReinfTransmitter {
  transmit(payload: {
    eventXml: string;
    eventType: 'R-1000' | 'R-4010' | 'R-4020' | 'R-9000';
  }): Promise<ReinfTransmitResult>;
}

export const REINF_TRANSMITTER = Symbol.for('ReinfTransmitter');
