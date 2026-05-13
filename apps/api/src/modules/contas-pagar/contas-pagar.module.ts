import { Module } from '@nestjs/common';
import { PayableController } from './payable.controller';
import { PayableService } from './payable.service';
import { TaxCalculatorService } from './tax-calculator.service';

@Module({
  controllers: [PayableController],
  providers: [PayableService, TaxCalculatorService],
  exports: [PayableService, TaxCalculatorService],
})
export class ContasPagarModule {}
