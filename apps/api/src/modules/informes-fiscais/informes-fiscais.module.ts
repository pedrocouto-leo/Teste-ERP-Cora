import { Module } from '@nestjs/common';
import { EfdReinfController } from './efd-reinf.controller';
import { EfdReinfService } from './efd-reinf.service';
import { EfdContribuicoesController } from './efd-contribuicoes.controller';
import { EfdContribuicoesService } from './efd-contribuicoes.service';
import { EcfController } from './ecf.controller';
import { EcfService } from './ecf.service';
import { DesIfController } from './des-if.controller';
import { DesIfService } from './des-if.service';
import { REINF_TRANSMITTER } from './transmitters/reinf-transmitter';
import { StubReinfTransmitter } from './transmitters/stub-reinf-transmitter';

@Module({
  controllers: [
    EfdReinfController,
    EfdContribuicoesController,
    EcfController,
    DesIfController,
  ],
  providers: [
    EfdReinfService,
    EfdContribuicoesService,
    EcfService,
    DesIfService,
    StubReinfTransmitter,
    {
      provide: REINF_TRANSMITTER,
      useExisting: StubReinfTransmitter,
    },
  ],
  exports: [EfdReinfService],
})
export class InformesFiscaisModule {}
