import { Module } from '@nestjs/common';
import { ChartOfAccountsController } from './chart-of-accounts.controller';
import { ChartOfAccountsService } from './chart-of-accounts.service';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { AccountingPeriodController } from './accounting-period.controller';
import { AccountingPeriodService } from './accounting-period.service';
import { JournalEntryController } from './journal-entry.controller';
import { JournalEntryService } from './journal-entry.service';
import { StandardEntryController } from './standard-entry.controller';
import { StandardEntryService } from './standard-entry.service';
import { BalanceController } from './balance.controller';
import { BalanceService } from './balance.service';

@Module({
  controllers: [
    ChartOfAccountsController,
    AccountController,
    AccountingPeriodController,
    JournalEntryController,
    StandardEntryController,
    BalanceController,
  ],
  providers: [
    ChartOfAccountsService,
    AccountService,
    AccountingPeriodService,
    JournalEntryService,
    StandardEntryService,
    BalanceService,
  ],
  exports: [AccountService, JournalEntryService, BalanceService],
})
export class ContabilidadeModule {}
