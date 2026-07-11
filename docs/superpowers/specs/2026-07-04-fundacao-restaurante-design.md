# Fundacao Restaurante Rei do Feijao Design

## Objetivo

Criar a base tecnica do Sistema Restaurante Rei do Feijao sem bloquear o projeto na definicao da maquininha PagBank.

## Arquitetura

O sistema comeca como monorepo TypeScript. A aplicacao web fica em `apps/web`, a API em `apps/api` e as regras de negocio puras em `packages/domain`. Essa separacao permite testar pedido, caixa e pagamento sem depender de navegador, banco ou terminal fisico.

## Pagamentos

A integracao PagBank sera implementada como adaptador. O nucleo do sistema trabalha com `payment_intent`, `payment_transaction`, estados de pagamento, idempotencia e conciliacao. Enquanto a maquininha real nao estiver definida, o sistema pode suportar pagamentos manuais/simulados com auditoria e a mesma estrutura de dados.

## Escopo desta primeira etapa

- Criar configuracao de workspace.
- Criar shell inicial da API.
- Criar shell inicial do web app.
- Criar dominio inicial de pagamentos com teste automatizado.
- Deixar documentado que SmartPOS, PlugPag ou TEF serao decisao posterior.

## Fora do escopo agora

- Banco de dados real.
- Autenticacao completa.
- Integracao real PagBank.
- KDS, mesas, caixa e estoque completos.

