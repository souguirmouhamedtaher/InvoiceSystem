import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ApplicationLayerModule } from '../application/applicationLayer.module';
import { InfrastructureLayerModule } from '../infrastructure/infrastructureLayer.module';
import { AccessTokenStrategy } from './auth-strategies/accessToken.strategy';
import { RefreshTokenStrategy } from './auth-strategies/refreshToken.strategy';
import {
    AuthController,
    FilesController,
    SAdminController,
    CompanyController,
    TaxSettingsController,
    LibelleController,
    InvoiceController,
    PurchaseInvoiceController,
    AnalysisController,
} from './controllers';

@Module({
    imports: [JwtModule.register({}), ApplicationLayerModule, InfrastructureLayerModule],
    controllers: [
        AuthController,
        SAdminController,
        FilesController,
        CompanyController,
        TaxSettingsController,
        LibelleController,
        InvoiceController,
        PurchaseInvoiceController,
        AnalysisController,
    ],
    providers: [AccessTokenStrategy, RefreshTokenStrategy],
})
export class PresentationLayerModule { }
