/**
 * Resultado de uma transmissão de NFS-e ao webservice municipal.
 */
export interface NfseTransmitResult {
  status: 'ACCEPTED' | 'REJECTED' | 'PENDING';
  nfseNumber?: string;
  protocol?: string;
  verificationCode?: string;
  rejectionCode?: string;
  rejectionMessage?: string;
  responseXml?: string;
  transmittedAt: Date;
}

/**
 * Resultado de um cancelamento de NFS-e.
 */
export interface NfseCancelResult {
  status: 'ACCEPTED' | 'REJECTED';
  protocol?: string;
  rejectionCode?: string;
  rejectionMessage?: string;
  responseXml?: string;
  cancelledAt: Date;
}

/**
 * Contrato para emissão / cancelamento de NFS-e contra webservices municipais.
 *
 * Implementações reais (por município) devem:
 *   - assinar o XML com certificado A1/A3 do contribuinte;
 *   - chamar o endpoint SOAP correto (ABRASF 2.0, 2.04, GINFES, IPM, etc.);
 *   - tratar timeouts/retries;
 *   - extrair número de NFS-e, protocolo e código de verificação da resposta.
 *
 * O StubNfseTransmitter abaixo só registra o payload — útil em dev/teste.
 */
export interface NfseTransmitter {
  transmit(payload: { rpsXml: string; cityCode: string }): Promise<NfseTransmitResult>;
  cancel(payload: {
    nfseNumber: string;
    cityCode: string;
    reasonCode: string;
    reasonText: string;
  }): Promise<NfseCancelResult>;
}

/**
 * Token de injeção do NestJS para o transmitter — permite swap por município
 * via custom provider em testes ou produção.
 */
export const NFSE_TRANSMITTER = Symbol.for('NfseTransmitter');
