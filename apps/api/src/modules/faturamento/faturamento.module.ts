import { Module } from '@nestjs/common';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';
import { NfseService } from './nfse.service';

@Module({
  controllers: [InvoiceController],
  providers: [InvoiceService, NfseService],
  exports: [InvoiceService, NfseService],
})
export class FaturamentoModule {}
