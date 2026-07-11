# Restaurante Rei do Feijao

Sistema web de gestao operacional, PDV, cozinha, caixa, pagamentos e conciliacao para restaurante.

## Decisoes iniciais

- Monorepo com `pnpm workspaces` e Turborepo.
- `apps/web`: interface web em Next.js.
- `apps/api`: API NestJS/Fastify.
- `packages/domain`: regras puras de negocio, comecando por pagamentos.
- PagBank entra como adaptador futuro; o dominio ja nasce com estados, idempotencia e conciliacao.

## Comandos

```powershell
pnpm install
pnpm test
pnpm typecheck
pnpm dev
```

## Portas padrao

- Web: `http://localhost:3000`
- API: `http://localhost:3333`

