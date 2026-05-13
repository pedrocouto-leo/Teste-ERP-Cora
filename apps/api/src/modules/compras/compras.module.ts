import { Module } from '@nestjs/common';
import { PurchaseRequestController } from './purchase-request.controller';
import { PurchaseRequestService } from './purchase-request.service';
import { QuotationController } from './quotation.controller';
import { QuotationService } from './quotation.service';
import { PurchaseOrderController } from './purchase-order.controller';
import { PurchaseOrderService } from './purchase-order.service';
import { ReceivingController } from './receiving.controller';
import { ReceivingService } from './receiving.service';

@Module({
  controllers: [
    PurchaseRequestController,
    QuotationController,
    PurchaseOrderController,
    ReceivingController,
  ],
  providers: [
    PurchaseRequestService,
    QuotationService,
    PurchaseOrderService,
    ReceivingService,
  ],
  exports: [PurchaseOrderService, ReceivingService],
})
export class ComprasModule {}
