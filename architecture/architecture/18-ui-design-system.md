# Rule 18: UI Design System Invariant

## Principle

UI components are part of system architecture and must remain **standardized** across the application. Visual inconsistency is considered **architectural degradation**.

---

## 18.1 Standardized Components Only

All UI interactions must use shared standardized components from the design system. Creating ad-hoc UI components for the same purpose is **forbidden**.

This rule covers:

| Component Type | Shared Location |
|---|---|
| Pickers / Dropdowns | `components/add/AddFormPickerModals.tsx`, `components/filters/FilterPickerModals.tsx` |
| Form Field Rows | `components/add/FormFieldRow.tsx` |
| Buttons | `constants/colors.ts` + shared button patterns |
| Input Fields | `components/add/shared.ts` (addFormStyles) |
| Modal Dialogs | `contexts/AlertContext.tsx` |
| Badges / Status | Shared within screen-level components, no duplication |
| Empty States | `components/EmptyState.tsx` |

### Violation Examples
- Implementing a new dropdown picker instead of reusing `AddFormPickerModals`
- Creating a one-off modal instead of using `AlertContext`
- Defining local `StyleSheet` for form rows that already exist in `shared.ts`

---

## 18.2 Icon Consistency

Icons must come from **a single approved icon system**: `@expo/vector-icons` (`Ionicons` family).

Rules:
- The **same action** must always use the **same icon** across the application
- No mixed icon styles (e.g., mixing Ionicons with MaterialIcons for the same semantic meaning)
- No duplicate semantic meanings with different icons

### Canonical Icon Map

| Action | Icon |
|---|---|
| Edit | `create-outline` |
| Delete | `trash-outline` |
| Archive | `archive-outline` |
| Share | `share-outline` |
| Promote | `flash-outline` |
| Add / Create | `add-circle-outline` |
| Sold | `pricetag-outline` |
| Settings | `settings-outline` |
| Filter | `options-outline` |
| Search | `search-outline` |
| Favorite | `heart-outline` / `heart` |
| Back | `chevron-back` |
| Close | `close` |
| Check / Success | `checkmark-circle` |
| Info | `information-circle-outline` |
| Camera / Photo | `camera-outline` |

---

## 18.3 Interaction Consistency

Identical user actions must behave **identically everywhere**:

- **Selection flows**: use pickers from `AddFormPickerModals` / `FilterPickerModals`
- **Confirmation patterns**: use `AlertContext.showAlert` / `showConfirm`
- **Navigation actions**: use `expo-router` push/replace (never `navigate`)
- **Edit / Save / Cancel logic**: consistent header button placement (cancel left, save right)
- **Delete**: always requires confirmation dialog before action
- **Haptic feedback**: every significant action triggers `expo-haptics`

---

## 18.4 No Feature-Level UI Reinvention

Features **must reuse** existing UI patterns instead of introducing new visual logic.

If a new pattern is genuinely required:
1. It must be introduced as a **reusable shared component** in `components/`
2. It must be documented in this file
3. It replaces — not supplements — any ad-hoc implementation

---

## 18.5 Visual Style Invariants

The application uses a **monochromatic dark design system**:

- **Color palette**: sourced exclusively from `constants/colors.ts` via `useColors()`
- **No hardcoded color values** in component files (exception: transparent, white/black with opacity)
- **Typography**: Inter font, consistent size scale (12, 13, 14, 15, 16, 17, 18, 20, 22, 24, 28pt)
- **Spacing**: multiples of 4px
- **Border radius**: small=8, medium=12, large=16, extra=20
- **Shadows**: dark mode — subtle `#000` shadows; light mode — `#00000015` soft shadows
- **Blur effects**: `expo-blur` `BlurView` for overlays and modal backgrounds
- **Animations**: `react-native-reanimated` only — no `Animated` from react-native

---

## 18.6 Form Architecture for Add/Edit Flows

All add/edit forms follow the **4-step wizard pattern**:

```
Step 1: Vehicle Type + Basic Identity (brand, model, year, body type)
Step 2: Technical Specs (engine, transmission, drive — varies by vehicle type)
Step 3: Condition + Photos + Description
Step 4: Price + Seller Info
```

Rules:
- Steps use `WizardStepBar` for progress indication
- Each step is a separate section component in `components/add/`
- All section components use styles from `components/add/shared.ts`
- No section component defines its own `StyleSheet.create` for shared styles
- Field visibility is controlled by `lib/vehicle-field-visibility.ts` — not inline conditionals

---

## 18.7 Design System as Source of Truth

Shared UI components become the single source of truth for interaction behavior. UI must **not** implement business interaction logic independently.

---

## Enforcement

Before introducing any new picker, icon, modal, or interaction component:

1. Search `components/` for existing implementations
2. Reuse or extend — never duplicate
3. If a new pattern is needed, create it as a shared component first

> **Violation of this rule = architectural degradation = must be corrected before merge.**
