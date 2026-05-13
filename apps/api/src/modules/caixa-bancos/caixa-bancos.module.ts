import { Module } from '@nestjs/common';
import { CashAccountController } from './cash-account.controller';
import { CashAccountService } from './cash-account.service';
import { CashMovementController } from './cash-movement.controller';
import { CashMovementService } from './cash-movement.service';
import { BankStatementController } from './bank-statement.controller';
import { BankStatementService } from './bank-statement.service';

@Module({
  controllers: [
    CashAccountController,
    CashMovementController,
    BankStatementController,
  ],
  providers: [
    CashAccountService,
    CashMovementService,
    BankStatementService,
  ],
  exports: [CashAccountService, CashMovementService],
})
export class CaixaBancosModule {}
