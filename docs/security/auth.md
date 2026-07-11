# Auth Foundation

## Initial admin

The first admin is created by:

```powershell
pnpm db:seed
```

Default tenant values:

- Restaurant slug: `rei-do-feijao`
- Branch slug: `matriz`
- Admin email: `admin@reidofeijao.local`

The admin password must be set in `.env.local` as `SEED_ADMIN_PASSWORD`.

## Login endpoint

```http
POST /v1/auth/login
Content-Type: application/json
```

```json
{
  "restaurantSlug": "rei-do-feijao",
  "email": "admin@reidofeijao.local",
  "password": "<SEED_ADMIN_PASSWORD>"
}
```

Response:

```json
{
  "accessToken": "<signed-session-token>",
  "user": {
    "id": "<user-id>",
    "restaurantId": "<restaurant-id>",
    "branchId": "<branch-id>",
    "email": "admin@reidofeijao.local",
    "name": "Administrador",
    "permissions": ["system:admin"]
  }
}
```

## Permission model

The seed creates these initial permissions:

- `system:admin`
- `users:manage`
- `menu:manage`
- `orders:read`
- `orders:manage`
- `payments:read`
- `payments:manage`
- `cash-register:manage`
- `reports:read`
- `settings:manage`

`system:admin` bypasses narrower permission checks in the API guard.

## Token model

Tokens are HMAC SHA-256 signed with `JWT_SECRET` and carry only operational claims:

- `restaurantId`
- `branchId`
- `userId`
- `email`
- `permissions`
- `iat`
- `exp`

Do not put secrets, password hashes or payment-provider credentials inside token claims.
