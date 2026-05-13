import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './modules/prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { CadastroModule } from './modules/cadastro/cadastro.module';
import { ContabilidadeModule } from './modules/contabilidade/contabilidade.module';
import { OrcamentoModule } from './modules/orcamento/orcamento.module';
import { CaixaBancosModule } from './modules/caixa-bancos/caixa-bancos.module';
import { ContasPagarModule } from './modules/contas-pagar/contas-pagar.module';
import { ContasReceberModule } from './modules/contas-receber/contas-receber.module';
import { ComprasModule } from './modules/compras/compras.module';
import { ContratosModule } from './modules/contratos/contratos.module';
import { FaturamentoModule } from './modules/faturamento/faturamento.module';
import { PatrimonioModule } from './modules/patrimonio/patrimonio.module';
import { LiquidacaoModule } from './modules/liquidacao/liquidacao.module';
import { InformesFiscaisModule } from './modules/informes-fiscais/informes-fiscais.module';
import { InformesLegaisModule } from './modules/informes-legais/informes-legais.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    EventEmitterModule.forRoot(),

    // Infrastructure
    PrismaModule,
    HealthModule,

    // Modulo 7 - Controle de Acesso
    AuthModule,

    // Modulo 1 - Cadastros Gerais
    CadastroModule,

    // Modulo 10 - Gestao Contabil
    ContabilidadeModule,

    // Modulo 6 - Controle Orcamentario
    OrcamentoModule,

    // Modulo 2 - Caixas e Bancos
    CaixaBancosModule,

    // Modulo 4 - Contas a Pagar
    ContasPagarModule,

    // Modulo 5 - Contas a Receber
    ContasReceberModule,

    // Modulo 3 - Compras e Recebimento
    ComprasModule,

    // Modulo 8 - Controle de Contratos
    ContratosModule,

    // Modulo 9 - Faturamento
    FaturamentoModule,

    // Modulo 11 - Gestao Patrimonial
    PatrimonioModule,

    // Modulo 14 - Liquidacao Financeira
    LiquidacaoModule,

    // Modulo 12 - Informes Fiscais
    InformesFiscaisModule,

    // Modulo 13 - Informes Legais
    InformesLegaisModule,
  ],
})
export class AppModule {}
