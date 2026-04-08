# Architecture Guardrails

Все изменения должны пройти 10 архитектурных ограничений перед реализацией.

## Правила

### 1. SSOT (Single Source of Truth)
Единый источник истины для всех сущностей (типы, данные, логика).

### 2. State Flow
Server → Central State → UI.
UI никогда не является источником бизнес-состояния.

### 3. Real-Time Consistency
SSE синхронизирует через versioning, идемпотентно, не создаёт нового состояния.

### 4. Admin Impact
Admin-действия = system-wide события (listings, subscriptions, permissions, visibility, search, realtime).

### 5. Atomicity
Wallet, subscriptions, counters: никаких промежуточных состояний.

### 6. Unified Domain Model
Единая модель для listings, users, roles, subscriptions, permissions.

### 7. Filters & Search
Фильтры читают нормализованные данные, не содержат независимой бизнес-логики.

### 8. Permission Enforcement
Серверная авторизация — единственный источник безопасности. Frontend = UX only.

### 9. Scalability
Решения должны масштабироваться без переписывания модулей.

### 10. Refactor Priority
Архитектурные проблемы исправляются до работы над фичами.

## SSOT Sources of Truth

| Источник | Файл | Сущности |
|---|---|---|
| DB schema types | `shared/schema.ts` | CarListing, User, SafeUser |
| Vehicle domain enums | `types/vehicle.ts` | BodyType, FuelType, etc. — re-exported from `shared/schema.ts` |
| Currency type | `types/filters.ts` | Currency — re-exported from `shared/schema.ts` |
| Equipment type | `types/equipment.ts` | Equipment — re-exported from `shared/schema.ts` |
| Error codes | `shared/error-codes.ts` | ERROR_CODES — all API error responses |
| Error translations | `lib/error-utils.ts` | translateError — client-side RU/HY/EN |
| Frontend filter model | `types/filters.ts` | CarFilters |
| Backend filter model | `server/storage/listings.ts` | ListingFilters (synced with CarFilters) |
| SSE event registry | `shared/sse-registry.ts` | 18 events |
| Notification types | `shared/schema.ts` | NOTIFICATION_TYPES |
