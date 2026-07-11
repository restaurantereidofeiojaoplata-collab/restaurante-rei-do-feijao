# Fundacao da Integracao PagBank

## Regra central

O sistema pode iniciar sem a maquininha real, mas nao pode iniciar com pagamento improvisado.

## Modelo inicial

Todo pagamento deve passar por uma intencao de pagamento:

```text
Pedido -> payment_intent -> payment_transaction -> caixa/financeiro
```

## Providers previstos

- `CASH`: dinheiro fisico no caixa.
- `MANUAL`: cartao/Pix externo registrado pelo operador.
- `PAGBANK`: integracao futura via SmartPOS, PlugPag ou TEF.

## Estados obrigatorios

```text
DRAFT
PENDING
PROCESSING
APPROVED
SETTLED
DECLINED
CANCELLED
EXPIRED
INDETERMINATE
REFUND_PENDING
REFUNDED
```

`INDETERMINATE` bloqueia nova cobranca automatica ate consulta, webhook, conciliacao ou revisao autorizada.

