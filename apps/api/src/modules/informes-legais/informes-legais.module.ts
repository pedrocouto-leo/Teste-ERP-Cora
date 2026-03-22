import { Module } from '@nestjs/common';
import { CadocController } from './cadoc.controller';
import { CadocService } from './cadoc.service';
import { ScrController } from './scr.controller';
import { ScrService } from './scr.service';
import { PddController } from './pdd.controller';
import { PddService } from './pdd.service';
import { BacenReportController } from './bacen-report.controller';
import { BacenReportService } from './bacen-report.service';
import { DdrController } from './ddr/ddr.controller';
import { DdrService } from './ddr/ddr.service';
import { DdrCalculationService } from './ddr/ddr-calculation.service';
import { DdrExportService } from './ddr/ddr-export.service';

@Module({
  controllers: [
    CadocController,
    ScrController,
    PddController,
    BacenReportController,
    DdrController,
  ],
  providers: [
    CadocService,
    ScrService,
    PddService,
    BacenReportService,
    DdrService,
    DdrCalculationService,
    DdrExportService,
  ],
  exports: [ScrService, PddService, DdrService],
})
export class InformesLegaisModule {}
