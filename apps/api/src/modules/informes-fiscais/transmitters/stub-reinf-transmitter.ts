import { Injectable, Logger } from '@nestjs/common';
import {
  ReinfTransmitter,
  ReinfTransmitResult,
} from './reinf-transmitter';

@Injectable()
export class StubReinfTransmitter implements ReinfTransmitter {
  private readonly logger = new Logger(StubReinfTransmitter.name);

  async transmit(payload: {
    eventXml: string;
    eventType: string;
  }): Promise<ReinfTransmitResult> {
    this.logger.warn(
      `[STUB] EFD-Reinf transmit type=${payload.eventType} xmlLength=${payload.eventXml.length}`,
    );

    return {
      status: 'ACCEPTED',
      receipt: `REINF-${Date.now()}`,
      responseXml: `<retornoRecibo><recibo>REINF-${Date.now()}</recibo></retornoRecibo>`,
      transmittedAt: new Date(),
    };
  }
}
