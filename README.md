# CiteNest EMS

Multi-tenant employee management application built with Next.js, PostgreSQL, and Authentik OIDC.

## Local development

1. Copy `.env.example` to `.env` and replace every placeholder.
2. Start the dedicated EMS PostgreSQL container and local Authentik infrastructure.
3. Apply database migrations with `pnpm.cmd db:migrate` on Windows.
4. Start EMS with `pnpm.cmd dev` and open `http://localhost:3001`.

Never commit `.env`, Authentik API tokens, OIDC secrets, or database passwords.

## Tenant identity model

Every Authentik EMS user must have the attribute:

```yaml
citenest_ems_tenant_key: TENANT_KEY
```

For a tenant such as `acme`, provision these tenant-specific groups:

- `citenest-ems-acme-admins`
- `citenest-ems-acme-users`

An EMS administrator is assigned to `citenest-ems-all-users`, `citenest-ems-admins`, and the tenant administrator group. An EMS user is assigned to `citenest-ems-all-users`, `citenest-ems-users`, and the tenant user group.

The tenant administrator cannot select a tenant or arbitrary Authentik groups. The server derives them from the authenticated tenant context.

## Authentik user-management service account

Create a dedicated Authentik service account and API token for EMS automation. Configure:

```dotenv
AUTHENTIK_API_URL=http://localhost:9000/api/v3/
AUTHENTIK_API_TOKEN=REPLACE_WITH_SERVICE_ACCOUNT_API_TOKEN
```

Grant the service account only the permissions needed to view and create users, view EMS groups, change users created under `citenest/ems/`, and set user passwords.

Do not make the service account or tenant administrators superusers. Store the API token only in the server environment and rotate it regularly.

## Validation

```powershell
pnpm.cmd exec tsc --noEmit
pnpm.cmd lint
pnpm.cmd build
```
