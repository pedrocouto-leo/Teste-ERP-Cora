import { Module } from '@nestjs/common';
import { CadocController } from './cadoc.controller';
import { CadocService } from './cadoc.service';
import { ScrController } from './scr.controller';
import { ScrService } from './scr.service';
import { PddController } from './pdd.controller';
import { PddService } from './pdd.service';
import { BacenReportController } from './bacen-report.controller';
import { BacenReportService } from './bacen-report.service';

@Module({
  controllers: [CadocController, ScrController, PddController, BacenReportController],
  providers: [CadocService, ScrService, PddService, BacenReportService],
  exports: [ScrService, PddService],
})
export class InformesLegaisModule {}
