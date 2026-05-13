import { Module } from '@nestjs/common';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';
import { NfseService } from './nfse.service';
import { NFSE_TRANSMITTER } from './transmitters/nfse-transmitter';
import { StubNfseTransmitter } from './transmitters/stub-nfse-transmitter';

@Module({
  controllers: [InvoiceController],
  providers: [
    InvoiceService,
    NfseService,
    StubNfseTransmitter,
    {
      provide: NFSE_TRANSMITTER,
      useExisting: StubNfseTransmitter,
    },
  ],
  exports: [InvoiceService, NfseService],
})
export class FaturamentoModule {}
