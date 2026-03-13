import { Module } from '@nestjs/common';
import { SupplierController } from './supplier.controller';
import { SupplierService } from './supplier.service';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';
import { CostCenterController } from './cost-center.controller';
import { CostCenterService } from './cost-center.service';
import { BankController, OwnBankAccountController } from './bank.controller';
import { BankService } from './bank.service';
import { CurrencyController } from './currency.controller';
import { CurrencyService } from './currency.service';
import { HolidayController } from './holiday.controller';
import { HolidayService } from './holiday.service';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';

@Module({
  controllers: [
    SupplierController,
    ClientController,
    CostCenterController,
    BankController,
    OwnBankAccountController,
    CurrencyController,
    HolidayController,
    ProjectController,
  ],
  providers: [
    SupplierService,
    ClientService,
    CostCenterService,
    BankService,
    CurrencyService,
    HolidayService,
    ProjectService,
  ],
  exports: [SupplierService, ClientService, CostCenterService, BankService],
})
export class CadastroModule {}
