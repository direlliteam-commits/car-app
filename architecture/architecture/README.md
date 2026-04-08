The architecture directory defines mandatory system behavior and must be consulted before ANY implementation, refactor, or feature addition.

All implementation decisions must follow the architecture documents in this directory. These files define the system rules and must be consulted before implementing or modifying any functionality.

# AutoArmenia — Architecture Documentation

Эта папка содержит фундаментальную архитектурную документацию платформы AutoArmenia.

Все документы являются **source of truth** для архитектурных решений и должны учитываться при любой реализации.

## Структура документов

| Документ | Назначение | Правил |
|---|---|---|
| [**00-engineering-constitution.md**](./00-engineering-constitution.md) | **Engineering Constitution — highest priority architectural document** | **12** |
| [01-guardrails.md](./01-guardrails.md) | Базовые ограничения для каждого изменения | 10 |
| [02-self-diagnostics.md](./02-self-diagnostics.md) | Непрерывная диагностика во время разработки | 10 |
| [03-evolution-rules.md](./03-evolution-rules.md) | Защита от архитектурной деградации при росте | 10 |
| [04-marketplace-core-laws.md](./04-marketplace-core-laws.md) | Защита целостности ядра маркетплейса | 10 |
| [05-freeze-point.md](./05-freeze-point.md) | Заморозка core-архитектуры, расширение через слои | 10 |
| [06-system-invariants.md](./06-system-invariants.md) | Фундаментальные законы, истинные ВСЕГДА | 12 |
| [07-failure-architecture.md](./07-failure-architecture.md) | Устойчивость к сбоям, консистентность при ошибках | 13 |
| [08-observability.md](./08-observability.md) | Наблюдаемость состояния и поведения системы | 12 |
| [09-guardian.md](./09-guardian.md) | Обязательный workflow архитектурного контроля | 7 |
| [10-self-healing.md](./10-self-healing.md) | Автоматическое выявление и исправление архитектурных проблем (runtime) | 10 |
| [11-platform-sre-mode.md](./11-platform-sre-mode.md) | Эксплуатационная устойчивость и масштабирование (SRE) | 10 |
| [12-autonomous-health-check.md](./12-autonomous-health-check.md) | Проактивная архитектурная проверка без запроса пользователя | 10 |
| [13-product-platform-intelligence.md](./13-product-platform-intelligence.md) | Продуктовая эффективность, рост и пользовательское доверие | 10 |
| [14-controlled-growth-roadmap.md](./14-controlled-growth-roadmap.md) | Управляемые стадии роста платформы | 10 |
| [15-strategic-alignment.md](./15-strategic-alignment.md) | Долгосрочное стратегическое направление платформы | 10 |
| [16-data-advantage-architecture.md](./16-data-advantage-architecture.md) | Данные как конкурентное преимущество marketplace | 10 |
| [17-domain-language.md](./17-domain-language.md) | Единый доменный язык системы (Domain Language Lock) | 10 |
| [**18-ui-design-system.md**](./18-ui-design-system.md) | **UI Design System Invariant — стандартизация UI-компонентов как архитектурный инвариант** | **8** |
| [**19-credit-trust-and-affordability.md**](./19-credit-trust-and-affordability.md) | **Credit Trust & Affordability Invariant — прозрачность кредитных расчётов как часть доверия к маркетплейсу** | **5** |

## Иерархия контроля

```
Engineering Constitution   — фундамент всех уровней (наивысший приоритет)
  ↓
System Invariants          — фундаментальные законы (нарушение = архитектурная ошибка)
  ↓
Architecture Guardrails    — базовые ограничения для каждого изменения
  ↓
Architecture Freeze Point  — core заморожен, расширяется только через слои
  ↓
Marketplace Core Laws      — целостность маркетплейса как бизнес-системы
  ↓
Architecture Evolution     — защита от деградации при росте функциональности
  ↓
Failure Architecture       — устойчивость к сбоям и восстановление
  ↓
Observability Architecture — наблюдаемость и прозрачность системы
  ↓
System Self-Diagnostics    — непрерывная проверка во время разработки
  ↓
Self-Healing Architecture  — автоматическое выявление и исправление проблем (runtime)
  ↓
Architecture Guardian       — обязательный workflow контроля при каждом изменении
  ↓
Platform SRE + Architect   — эксплуатационная устойчивость и масштабирование
  ↓
Autonomous Health Check    — проактивная архитектурная проверка (автоматически)
  ↓
Product-Platform Intelligence — продуктовая эффективность, UX, доверие, monetization
  ↓
Controlled Growth Roadmap  — управляемые стадии роста, а не реактивное добавление функций
  ↓
Strategic Alignment        — долгосрочные стратегические ориентиры платформы
  ↓
Data Advantage Architecture — данные как конкурентное преимущество (стратегический уровень)
  ↓
Domain Language Lock       — единый доменный язык, единое значение терминов во всех доменах
  ↓
Credit Trust & Affordability — прозрачность кредитных расчётов как часть доверия к маркетплейсу
```

## Принцип применения

Перед каждым изменением:
1. Проверить, не нарушает ли изменение **System Invariants**
2. Убедиться, что изменение проходит **Architecture Guardrails**
3. Убедиться, что core не модифицируется напрямую (**Freeze Point**)
4. Проверить соответствие **Marketplace Core Laws**
5. Оценить влияние на эволюцию платформы (**Evolution Rules**)
6. Проверить поведение при сбоях (**Failure Architecture**)
7. Убедиться в наблюдаемости (**Observability**)
8. Провести **Self-Diagnostics** проверки

Если хотя бы один уровень нарушен — изменение требует переработки.
