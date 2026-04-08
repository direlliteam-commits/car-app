# AutoArmenia Domain Language Lock

Платформа использует единый доменный язык (Domain Language), который определяет точный смысл ключевых сущностей системы.

Одинаковые термины должны иметь одинаковое значение во всех доменах: backend, frontend, admin, realtime, subscriptions и analytics.

## Domain Language Rules

### 1. Single Meaning Rule
Каждый термин системы имеет одно официальное значение.

### 2. Lifecycle Vocabulary Protection
Статусы listings и lifecycle состояния не могут переопределяться в отдельных модулях.

### 3. No Semantic Overloading
Запрещено использовать существующий статус или термин для нового смысла.

### 4. Explicit Extension Rule
Если появляется новый смысл — создаётся новый явно определённый domain concept.

### 5. UI Mirrors Domain
UI отображает доменную модель, но не переопределяет её смысл.

### 6. Admin Consistency
Admin интерфейс использует те же определения состояний, что и marketplace.

### 7. Documentation Authority
Определения терминов фиксируются и считаются источником истины.

### 8. Naming Stability
Переименование или изменение смысла терминов требует архитектурной проверки.

### 9. Cross-Domain Consistency
Listings, subscriptions, visibility и permissions используют согласованный язык состояний.

### 10. Semantic Integrity Principle
Система должна оставаться логически понятной через годы развития.

Главный принцип: если два разработчика объясняют состояние по-разному — архитектура считается нарушенной.
