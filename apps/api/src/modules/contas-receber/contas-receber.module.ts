import { Module } from '@nestjs/common';
import { ReceivableController } from './receivable.controller';
import { ReceivableService } from './receivable.service';
import { BoletoController } from './boleto.controller';
import { BoletoService } from './boleto.service';

@Module({
  controllers: [ReceivableController, BoletoController],
  providers: [ReceivableService, BoletoService],
  exports: [ReceivableService, BoletoService],
})
export class ContasReceberModule {}
