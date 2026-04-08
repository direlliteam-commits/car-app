# Архитектурный аудит AutoArmenia — Полный отчёт

**Дата:** Февраль 2026
**Область:** Backend/Frontend синхронность, типизация, naming, error handling, SSE, i18n

---

## 1. MIDDLEWARE CHAIN И AUTH FLOW

### Порядок middleware (server/index.ts)
1. `trust proxy` → Helmet CSP → CORS → Origin Validation → Body Parsing → Request Logging
2. `authMiddleware` (глобальный, permissive — парсит токен, НЕ блокирует)
3. Rate limiters: `authLimiter` (20/15мин), `uploadLimiter` (10/60с), `apiLimiter` (120/60с)
4. Route registration → Error handler

### Auth guards
| Guard | Функция |
|---|---|
| `authMiddleware` | Парсит Bearer token → sets `req.userId`, не блокирует |
| `requireAuth` | 401 если нет userId |
| `requireAdmin` | 401+403, проверяет role=admin |
| `requireAdminRole(level)` | Иерархия: operator < senior < superadmin |

### Оценка: ✅ ХОРОШО
- Все мутации защищены requireAuth
- Публичные GET не требуют auth
- Admin операции используют requireAdmin/requireAdminRole
- 4 маршрута с manual auth checks — все обоснованы (SSE, optional personalization)
- **Нет незащищённых маршрутов**

---

## 2. ТИПИЗАЦИЯ — КРИТИЧЕСКИЕ НЕСООТВЕТСТВИЯ

### Data flow
```
DB (CarListing in shared/schema.ts)
  → Server Routes (возвращает raw CarListing)
    → Frontend ApiListing (types/listing.ts)
      → mapListingToCar() (lib/mappers.ts)
        → Car type (types/listing.ts)
          → Contexts & Components
```

### Несоответствия типов

| Поле | DB | ApiListing | Car | Проблема |
|---|---|---|---|---|
| `keysCount` | integer | `number?` | `1\|2` | ApiListing не ограничивает значения |
| `ownersCount` | text | `number?` | `OwnersCount (1\|2\|3\|4)` | Нет проверки на сервере |
| `suspensionType` | text | `string?` | `string?` | Нет SuspensionType union |
| `euroClass` | text | `string?` | `string?` | Нет EuroClass union |
| `availability` | text | `string?` | `Availability` | Рассинхронизация типов |
| `equipment` | jsonb | `string[]?` | `Equipment[]` | Type assertion в mapper |

### Типы, отсутствующие в shared/schema.ts
- `SuspensionType` — только в `types/vehicle.ts`
- `EuroClass` — только в `types/vehicle.ts`
- `Currency` — только в `types/filters.ts`
- `Equipment` — только в `types/equipment.ts`

### Проблемы mapper (lib/mappers.ts)
- `equipment: (listing.equipment || []) as Car["equipment"]` — unsafe type assertion
- `characteristics: (listing.characteristics || []) as Car["characteristics"]` — то же
- Множественные type assertions для body-related полей
- Нет runtime валидации при маппинге

### Рекомендации (Приоритет: ВЫСОКИЙ)
1. Перенести `SuspensionType`, `EuroClass`, `Currency`, `Equipment` в `shared/schema.ts`
2. Убрать type assertions в mapper — использовать proper types
3. Добавить Zod валидацию на response с сервера
4. Синхронизировать ApiListing с union types из vehicle.ts

### Validation Gap на бэкенде
- `server/lib/parse-filters.ts` конвертирует URL params → ListingFilters **БЕЗ валидации**
- Equipment values никогда не проверяются против 117 валидных опций
- Клиент может послать `bodyType: "excavator"` с `vehicleType: "passenger"` — сервер примет
- Рекомендация: Добавить Zod валидацию в parse-filters.ts

---

## 3. NAMING CONVENTIONS — API ENDPOINTS

### 121 бэкенд endpoint, 69 frontend API calls

### Проблемы именования

**Непоследовательная плюрализация:**
- `/api/dealer-plans` (вне namespace) vs `/api/dealer/my-features` (внутри namespace)
- `/api/dealer-requests` vs `/api/dealer/...`
- Рекомендация: Объединить под `/api/dealer/*`

**Непоследовательный kebab-case:**
- 60% kebab-case: `saved-searches`, `price-alerts`, `dealer-requests`
- 40% mixed: `send-image`, `listing-limits`, `db-stats`
- Рекомендация: Строгий kebab-case для всех multi-word path segments

**Непоследовательная глубина вложенности:**
- `/api/listings/:id/stats` (вложенный)
- `/api/seller/stats` (sibling level)
- `/api/seller/listing-stats` (compound naming)

**Регистрация роутов:**
- Основные: `registerXRoutes(app)` — консистентно ✓
- Admin: `export const adminCoreRouter = Router()` — другой паттерн ✗

### Рекомендации (Приоритет: СРЕДНИЙ)
1. Стандартизировать kebab-case для всех URL segments
2. Объединить dealer routes под единый namespace `/api/dealer/*`
3. Стандартизировать admin router registration на `registerAdminRoutes(app)`
4. Унифицировать глубину вложенности для stats endpoints

---

## 4. ERROR HANDLING

### Архитектура
- **SSOT**: `shared/error-codes.ts` — 239 error code constants
- **Backend**: Routes возвращают `{ error: ERROR_CODES.XXX }`
- **Frontend**: `lib/error-utils.ts` → `translateError()` → RU/HY/EN
- **Интеграция**: `lib/query-client.ts` вызывает `translateError(parsed.error)`

### Захардкоженные русские строки в error responses

| Файл | Строка | Текст | Рекомендация |
|---|---|---|---|
| `auth.routes.ts` | 115 | `"Email не предоставлен Google"` | Добавить ERROR_CODES.GOOGLE_EMAIL_NOT_PROVIDED |
| `upload.routes.ts` | 33 | `"Ошибка обработки видео"` | Использовать ERROR_CODES.ERROR_VIDEO_PROCESSING |
| `block.routes.ts` | 25 | `"Пользователь заблокирован"` | Добавить ERROR_CODES.USER_BLOCKED_SUCCESS |
| `block.routes.ts` | 46 | `"Пользователь разблокирован"` | Добавить ERROR_CODES.USER_UNBLOCKED_SUCCESS |
| `dealer.routes.ts` | 44 | `"Допускаются только изображения и PDF"` | Добавить ERROR_CODES.INVALID_FILE_TYPE |
| `listing.routes.ts` | 200 | `"Некорректные данные: ${fieldErrors}"` | Использовать ERROR_CODES.INVALID_DATA + details |
| `listing.routes.ts` | 211 | `"Достигнут лимит объявлений"` | Добавить ERROR_CODES.LISTING_LIMIT_REACHED |

### Допустимые hardcoded строки (не ошибки)
- Transaction descriptions в `dealer.routes.ts` (активация/продление тарифа)
- Default subject "Чат с поддержкой" в `support.routes.ts`
- Fallback names "Пользователь" в `interaction.routes.ts`

### Стандарт логирования
Рекомендуемый формат: `"[ModuleName] operationName error:"` для всех catch blocks.

---

## 5. SSE EVENT ARCHITECTURE

### Registry Status (18 events в shared/sse-registry.ts) ✅

| Event | Scope | Server ✓ | Frontend ✓ |
|---|---|---|---|
| listing_status | user | ✓ | ✓ |
| catalog_update | broadcast | ✓ | ✓ |
| new_notification | user | ✓ | ✓ |
| new_message | user | ✓ | ✓ |
| conversation_read | user | ✓ | ✓ |
| wallet_update | user | ✓ | ✓ |
| promotion_update | user | ✓ | ✓ |
| dealer_status | user | ✓ | ✓ |
| account_update | user | ✓ | ⚠️ |
| favorites_update | user | ✓ | ✓ |
| new_review | user | ✓ | ⚠️ |
| support_message | user | ✓ | ✓ |
| support_status | user | ✓ | ✓ |
| support_read | user | ✓ | ✓ |
| typing_indicator | user | ✓ | ✓ |
| typing_stop | user | ✗ | ✓ |
| heartbeat | broadcast | ✓ | ✓ |
| connected | user | ✓ | ✓ |

### Проблемы

1. **`typing_stop` event никогда не эмитится** — зарегистрирован, но сервер использует TTL cleanup
   - Рекомендация: Удалить из registry или реализовать эмиссию

2. **Отсутствует cache invalidation для account_update actions:**
   - `auto_renew_failed` — нет handler
   - `subscription_expired` — нет handler
   - `role_changed` — нет handler
   - Рекомендация: Добавить query invalidation в useUserSSE.ts

3. **Отсутствует `/api/auth/me` invalidation в `new_review` handler**
   - Registry указывает, фронтенд не инвалидирует
   - Влияние: Счётчик отзывов пользователя может не обновиться сразу

---

## 6. i18n ARCHITECTURE

### Исправленные проблемы
- **Циклическая зависимость** `ThemeContext.tsx ↔ lib/i18n.ts` — УСТРАНЕНА
  - `AppLanguage` тип перенесён в `lib/i18n.ts` (SSOT)
  - `ThemeContext.tsx` импортирует из `i18n.ts` (однонаправленная зависимость)
  - `useTranslation()` использует `useSyncExternalStore` вместо `useTheme()`
  - `setGlobalLanguage()` уведомляет подписчиков через listener pattern
  - Ноль require cycle warnings

### Аудит армянских переводов
- **132 translation fix** применены через Gemini AI аудит
- **0 кириллических строк** в HY секции (было 50+ до аудита)
- Секции: vehicle (7), equipment (2), catalog (9), carDetail (15), filters (17), auth/profile (10), analytics (10), time/units (9), settings (2), support (2), dealer (2), wallet/notifications/promote (11), options (11), about (5), chat (1), sort/shared/comparison (1)

---

## 7. FRONTEND-BACKEND SYNC

### React Query patterns ✅ ХОРОШО
- `apiRequest()` из `lib/query-client.ts` — единая точка входа
- Все contexts используют React Query с правильной инвалидацией
- SSE events → query invalidation через useUserSSE hook

### Потенциальные orphaned routes
1. `/api/recommendations` — нет вызова во фронтенде
2. `/api/listings/count` — не используется явно
3. `/api/admin/import` — утилитарный endpoint

---

## 8. СВОДКА РЕКОМЕНДАЦИЙ

| # | Рекомендация | Приоритет | Усилия |
|---|---|---|---|
| 1 | Заменить 7 hardcoded русских error strings на ERROR_CODES | 🔴 Высокий | ~2h |
| 2 | Перенести shared types (SuspensionType, EuroClass, Currency, Equipment) | 🔴 Высокий | ~2h |
| 3 | Добавить backend validation для equipment/bodyType constraints | 🔴 Высокий | ~3h |
| 4 | Убрать type assertions в mapper | 🟡 Средний | ~1h |
| 5 | Добавить `/api/auth/me` invalidation в new_review SSE handler | 🟡 Средний | ~15m |
| 6 | Добавить account_update handlers (subscription/role) | 🟡 Средний | ~30m |
| 7 | Стандартизировать error logging format | 🟡 Средний | ~3h |
| 8 | Унифицировать dealer route namespace | 🟡 Средний | ~2h |
| 9 | Удалить/реализовать typing_stop event | 🟢 Низкий | ~15m |
| 10 | Добавить Zod validation в parse-filters.ts | 🟢 Низкий | ~4h |
| 11 | Документировать/удалить orphaned routes | 🟢 Низкий | ~30m |

---

## 9. ОБЩАЯ ОЦЕНКА

| Область | Оценка | Комментарий |
|---|---|---|
| Auth & Security | ⭐⭐⭐⭐⭐ | Отлично, все маршруты защищены |
| SSE Architecture | ⭐⭐⭐⭐½ | Единый реестр, 3 minor gap |
| Frontend State | ⭐⭐⭐⭐ | Хорошо, React Query + contexts |
| i18n Coverage | ⭐⭐⭐⭐ | 0 Cyrillic в HY, 132 fixes applied |
| Type Safety | ⭐⭐⭐ | Требуется синхронизация типов |
| Naming Conventions | ⭐⭐⭐ | Некоторые несоответствия |
| Error Handling | ⭐⭐⭐½ | 7 hardcoded строк (было 393, улучшено) |
