import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module.js";
import { HealthController } from "./health/health.controller.js";
import { HealthService } from "./health/health.service.js";
import { AuditModule } from "./audit/audit.module.js";
import { RestaurantsModule } from "./restaurants/restaurants.module.js";
import { ProductsModule } from "./products/products.module.js";
import { TablesModule } from "./tables/tables.module.js";
import { OrdersModule } from "./orders/orders.module.js";
import { KitchenModule } from "./kitchen/kitchen.module.js";
import { CashRegistersModule } from "./cash-registers/cash-registers.module.js";
import { PaymentsModule } from "./payments/payments.module.js";
import { WebsocketsModule } from "./websockets/websockets.module.js";
import { MailModule } from "./mail/mail.module.js";
import { DeviceSessionsModule } from "./device-sessions/device-sessions.module.js";
import { BillsModule } from "./bills/bills.module.js";


@Module({
  controllers: [HealthController],
  imports: [
    AuthModule,
    AuditModule,
    RestaurantsModule,
    ProductsModule,
    TablesModule,
    OrdersModule,
    KitchenModule,
    CashRegistersModule,
    PaymentsModule,
    WebsocketsModule,
    MailModule,
    DeviceSessionsModule,
    BillsModule
  ],
  providers: [HealthService]
})
export class AppModule {}
