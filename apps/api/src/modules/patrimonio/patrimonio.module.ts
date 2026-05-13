import { Module } from '@nestjs/common';
import { AssetGroupController } from './asset-group.controller';
import { AssetGroupService } from './asset-group.service';
import { AssetController } from './asset.controller';
import { AssetService } from './asset.service';
import { DepreciationController } from './depreciation.controller';
import { DepreciationService } from './depreciation.service';

@Module({
  controllers: [
    AssetGroupController,
    AssetController,
    DepreciationController,
  ],
  providers: [
    AssetGroupService,
    AssetService,
    DepreciationService,
  ],
  exports: [AssetService, DepreciationService],
})
export class PatrimonioModule {}
