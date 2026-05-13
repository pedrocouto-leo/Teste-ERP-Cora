import { Injectable, Logger } from '@nestjs/common';
import {
  NfseTransmitter,
  NfseTransmitResult,
  NfseCancelResult,
} from './nfse-transmitter';

/**
 * Transmitter de NFS-e que **não chama webservice nenhum** —
 * apenas loga o payload e devolve um protocolo simulado.
 *
 * Use em desenvolvimento, CI e no ambiente de homologação até
 * que um provider real (por município) seja contratado.
 */
@Injectable()
export class StubNfseTransmitter implements NfseTransmitter {
  private readonly logger = new Logger(StubNfseTransmitter.name);
  private sequence = 0;

  async transmit(payload: { rpsXml: string; cityCode: string }): Promise<NfseTransmitResult> {
    this.sequence += 1;
    const fakeNumber = `${payload.cityCode}-${Date.now()}-${this.sequence}`;
    this.logger.warn(
      `[STUB] NFS-e transmit municipality=${payload.cityCode} xmlLength=${payload.rpsXml.length} fakeNumber=${fakeNumber}`,
    );

    return {
      status: 'ACCEPTED',
      nfseNumber: fakeNumber,
      protocol: `PROT-${Date.now()}`,
      verificationCode: this.randomCode(8),
      responseXml: `<RetornoEnvioLoteRps><Protocolo>PROT-${Date.now()}</Protocolo></RetornoEnvioLoteRps>`,
      transmittedAt: new Date(),
    };
  }

  async cancel(payload: {
    nfseNumber: string;
    cityCode: string;
    reasonCode: string;
    reasonText: string;
  }): Promise<NfseCancelResult> {
    this.logger.warn(
      `[STUB] NFS-e cancel municipality=${payload.cityCode} nfse=${payload.nfseNumber} reason=${payload.reasonCode}`,
    );

    return {
      status: 'ACCEPTED',
      protocol: `CANCEL-${Date.now()}`,
      responseXml: `<RetornoCancelamento><Protocolo>CANCEL-${Date.now()}</Protocolo></RetornoCancelamento>`,
      cancelledAt: new Date(),
    };
  }

  private randomCode(len: number): string {
    const alphabet = 'ABCDEFGHIJKLMNPQRSTUVWXYZ0123456789';
    let s = '';
    for (let i = 0; i < len; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
    return s;
  }
}
