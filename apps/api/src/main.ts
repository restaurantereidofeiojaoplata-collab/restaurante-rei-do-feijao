import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module.js";
import { RateLimitGuard } from "./auth/rate-limit.guard.js";
import { AuditService } from "./audit/audit.service.js";
import { XssSanitizerPipe } from "./common/pipes/xss-sanitizer.pipe.js";
import { ZodValidationFilter } from "./common/filters/zod-validation.filter.js";

// @ts-ignore
import express from "express";
// @ts-ignore
import compression from "compression";

const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3333);

// CORS origin: accept comma-separated list or wildcard from env.
// Example: CORS_ORIGIN=http://localhost:5173,https://meurestaurante.com.br
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000";

async function bootstrap(): Promise<void> {
  // NestJS Express (default) is required for Socket.IO (used by WebsocketsModule).
  // Fastify does not support Socket.IO without extra adapters.
  const app = await NestFactory.create(AppModule, { logger: ["warn", "error", "log"] });

  // Enable dynamic gzip compression for all routes
  app.use(compression());

  // Disable X-Powered-By header to hide Express/NestJS identity
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.disable("x-powered-by");

  // Enforce JSON and URLencoded payload size limits (Anti-DoS)
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));

  // HTTP Security Headers (OWASP recommendations)
  app.use((req: any, res: any, next: any) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "no-referrer");
    // HSTS só deve ser enviado em produção (HTTPS). Em localhost causaria problemas de conexão.
    if (process.env.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains; preload");
    }
    next();
  });

  app.useGlobalGuards(new RateLimitGuard());
  app.useGlobalPipes(new XssSanitizerPipe());
  app.useGlobalFilters(new ZodValidationFilter());

  app.enableCors({
    origin: corsOrigin.split(",").map((o) => o.trim()),
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  });

  app.setGlobalPrefix("v1");

  // Swagger UI disponível APENAS em desenvolvimento — nunca expor em produção
  if (process.env.NODE_ENV !== "production") {
    const documentConfig = new DocumentBuilder()
      .setTitle("Restaurante Rei do Feijao API")
      .setDescription("API operacional para PDV, pedidos, caixa e pagamentos.")
      .setVersion("0.1.0")
      .addBearerAuth()
      .build();

    SwaggerModule.setup(
      "docs",
      app,
      SwaggerModule.createDocument(app, documentConfig)
    );
  }

  const auditService = app.get(AuditService);
  await auditService.ensureAuditTableExists();

  await app.listen(port);
}

await bootstrap();
