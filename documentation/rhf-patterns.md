# React Hook Form Patterns

## Detecting Prefilled vs Empty Fields / Post-Save Locking

**Pattern:** To lock a field (mask + disable) when it was prefilled from the server, use
`control._defaultValues.fieldName`. To lock it after the user saves, you need a different
signal — `getValues` won't work here because it reads the live value and locks on the
first keystroke.

- `control._defaultValues.fieldName` — snapshot at `useForm()` init time, never changes.
  Correct for "was this field prefilled from the server?" — won't accidentally lock while
  the user is typing.
- `methods.getValues('fieldName')` — reads the current live form value synchronously.
  **Do not use for editable-until-saved locking** — it turns truthy on the first keystroke
  and locks the field immediately.

**Post-save locking:** after `handleSaveAndNextPassenger` succeeds, the store is updated
and the passenger prop re-propagates, causing `defaultFormValues` to rebuild with the
newly saved values. The form is re-initialized (via `useForm` `defaultValues` change or
explicit `reset()`), which updates `_defaultValues` — so `_defaultValues` will reflect the
saved value on the next render and the field locks correctly without any extra state.

**Usage:**

```ts
const isPrefilled = Boolean(control._defaultValues.passportNumber);

<InputHiFi
  value={isPrefilled ? maskValue(value) : value}
  editable={!isPrefilled}
  ...
/>
```

Refs:

- `defaultFormValues` — `src/journeys/check-in/hooks/usePassengerDocumentForm.ts:52-71`
- `PassportSection` — `src/journeys/check-in/screens/TravelDocuments/components/PassportSection.tsx`

## `setValue` + `shouldValidate` vs `Controller`'s `field.onChange`

**Pattern:** `mode: 'onChange'` on `useForm` only auto-triggers validation (and sets
`dirtyFields`/`touchedFields`) for changes that go through the field's **registered**
change handler — i.e. `field.onChange` from `Controller`, or `register()`'s returned
`onChange`. It does **not** know about a change made via the imperative `setValue()` API.

`setValue(name, value, options)` is silent by default:
`{ shouldValidate: false, shouldDirty: false, shouldTouch: false }`. If a component wires
its input through a custom handler (e.g. sanitizing input before writing it back) and calls
`setValue` directly instead of `field.onChange`, `mode: 'onChange'` will not fire validation
on its own — `shouldValidate: true` must be passed explicitly to replicate that behavior.
Likewise `dirtyFields`/`touchedFields` for that field will never become `true` unless
`shouldDirty`/`shouldTouch` are also passed — do not gate UI logic (e.g. error display) on
those flags for a field wired this way unless the setValue call opts in.

**Known side effect:** because `zodResolver`/schema-based validation is async (returns a
Promise even for a sync schema), there's an inherent one-tick gap between the synchronous
value update from `setValue` and the asynchronous `errors` update from the triggered
validation. Any error-display condition that mixes a synchronous signal (e.g. `value.length
> 0`) with the (still-stale) `errors` object can flash a stale error for one render —
typically visible when a field transitions from empty/invalid back to a valid value quickly
(e.g. delete-then-retype). Prefer gating display on `formState.isValidating` (or correctly
wired `touchedFields`/`dirtyFields`, per above) rather than value length.

Refs:

- `useRetrievalForm` — `src/journeys/check-in/hooks/useRetrievalForm.ts:33-45`
- `InputArea` (`renderInputName` / `renderInputPNR`) — `src/journeys/check-in/screens/CheckInRetrieval/components/InputArea.tsx:78-145`

## `shouldValidate`, `trigger`, and `handleSubmit` are one call, not three

- `setValue(name, value, { shouldValidate: true })` internally just calls `trigger(name)`
  — same function, no separate/lighter path.
- `trigger` is async: typed `=> Promise<boolean>` (`form.d.ts:423`), vs `setValue`'s
  `=> void` (`form.d.ts:470`) — that's why the value looks instant while `errors` always
  lands a tick later. With `zodResolver` this is unavoidable: its compiled resolver wraps
  the parse in `Promise.resolve(...)` even with `{ mode: 'sync' }`, forcing a microtask.
- `handleSubmit(onSubmit)` already awaits the same internal resolver call trigger uses,
  before deciding whether to invoke `onSubmit` — no need to call `trigger()` first.

**Implication:** fire-and-forget `trigger()` calls (e.g. `methods.trigger();` with an
`eslint-disable-next-line @typescript-eslint/no-floating-promises` in
`GuestDetailsScreen.tsx:1001`, or `trigger('field').catch(() => {})` elsewhere) don't make
validation sync — they just mean nothing sequences on completion. Code reading
`errors`/`formState` right after assuming it already ran hits the same stale-error window.

Refs:

- `UseFormTrigger` / `UseFormSetValue` types — `node_modules/react-hook-form/dist/types/form.d.ts:423,470`
- Floating-`trigger()` example — `src/journeys/booking/screens/GuestDetails/GuestDetailsScreen.tsx:1001`

## Multiple correlated sub-inputs contributing to one logical field

**Principle:** when several UI inputs are really one conceptual field (a date made of
day/month/year, a phone number made of country code + digits), the schema needs a
declaration for every sub-part, but there are two different shapes that can take, each
with its own wiring style.

**Option 1 — single composite object field, one `Controller`, one `onChange`.**
Declare the field as an object in the schema; a single `Controller` handles all sub-inputs,
spreading `value` on every change so the untouched sub-parts are preserved.

```ts
// validation/passengerDocumentsSchema.ts:91-93
const passportExpirationDateSchema = z
  .object({ day: z.string(), month: z.string(), year: z.string() })
  .superRefine((data, ctx) => applyExpirationDateValidation(data, ctx, finalArrivalDate));
// used as: expirationDate: passportExpirationDateSchema
```

```tsx
// screens/TravelDocuments/components/PassportSection.tsx:104-138
<Controller
  control={control}
  name="expirationDate"
  render={({ field: { value, onChange } }) => (
    <MemorableDate
      day={value.day}
      month={value.month}
      year={value.year}
      onDayChange={(day) => onChange({ ...value, day: sanitizeMemorableDateInput(day, 2) })}
      onMonthChange={(month) => onChange({ ...value, month })}
      onYearChange={(year) => onChange({ ...value, year: sanitizeMemorableDateInput(year, 4) })}
      errorFieldName={errors.expirationDate ? ['day', 'month', 'year'] : []}
    />
  )}
/>
```

One field path (`expirationDate`), one dirty/touched/error state for the whole group,
validated together via `superRefine`.

**Option 2 — two separate top-level schema fields, wired together via `useController` +
`Controller`.** Declare each sub-part as its own field; one sub-field is bound to a visible
input through `<Controller>` in the usual way, the other has no `Controller` of its own in
this component — it's obtained via `useController({ control, name })` (which returns the
same `field` shape a `<Controller>` render prop would) and threaded in as a prop.

```ts
// validation/emergencyContactSchema.ts:8-12
export const emergencyContactBaseSchema = z.object({
  emergencyName: z.string().max(64),
  emergencyIso2: z.string(),
  emergencyNumber: z.string(),
});
```

```ts
// hooks/useEmergencyContactSection.ts:57
const { field: iso2Field } = useController({ control, name: 'emergencyIso2' });
```

```tsx
// components/EmergencyContactSection.tsx:57-89
<Controller
  control={control}
  name="emergencyNumber"
  render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
    <PhoneInputHiFi
      value={value}
      onChangeText={onChange}
      onBlur={onBlur}
      selectedCountry={selectedCountry ?? null}
      onSelectCountry={(country) => {
        iso2Field.onChange(country.iso2); // writes the *other* schema field directly
        trigger('emergencyNumber').catch(() => {
          //Handle error
        });
      }}
      error={error}
    />
  )}
/>
```

Because `useController` is the same registration mechanism `<Controller>` wraps, calling
`iso2Field.onChange(...)` correctly updates `emergencyIso2` in RHF's form state and
participates in `superRefine`-based cross-field validation. `iso2Field` **is** rendered —
`selectedCountry` (derived from `iso2Field.value`, looked up against `countryOptions`) drives
the flag icon and dial code shown by `PhoneInputHiFi`, and `validatePhoneNumber` reads that
same resolved country to validate `emergencyNumber`. The difference from Option 1 is that
`emergencyIso2` carries no validation of its own and isn't wired through the same `onChange`
path as `emergencyNumber`, so the two fields aren't auto-linked for revalidation the way
sub-parts of a composite object are — an explicit `trigger('emergencyNumber')` call is
required after `iso2Field.onChange` to re-run the cross-field check, whereas in Option 1 a
single `onChange` on the composite field is enough to revalidate the whole group.

**When to reach for which:** Option 1 (composite object) when the sub-inputs are always
edited together and should be validated/tracked as one unit via a single `onChange` (dates).
Option 2 (two fields + `useController`) when one sub-part is set through a different UI
interaction than the other (country picker vs. number typing) and needs its own field path
in the schema, at the cost of manually re-triggering validation on the correlated field
since RHF won't do it automatically across two independently-registered fields.

Refs:

- `PassportSection` — `src/journeys/check-in/screens/TravelDocuments/components/PassportSection.tsx:104-138`
- `passportExpirationDateSchema` — `src/journeys/check-in/validation/passengerDocumentsSchema.ts:91-93`
- `useEmergencyContactSection` — `src/journeys/check-in/hooks/useEmergencyContactSection.ts:57`
- `EmergencyContactSection` — `src/journeys/check-in/components/EmergencyContactSection.tsx:57-89`
- `emergencyContactBaseSchema` — `src/journeys/check-in/validation/emergencyContactSchema.ts:8-12`

## `.refine` vs chained `.refine` vs `.superRefine`, and layering `superRefine` on a base schema

**`.refine(fn, message)`** — `fn` returns one `boolean` → at most **one** issue, one path. To
report different messages for different failure reasons, `message` must be a function that
re-derives which branch failed, duplicating the same branching logic `fn` already encodes once.

**Chaining multiple `.refine()` calls** (`schema.refine(a).refine(b).refine(c)`) executes in
order, but by default a failing refine does **not** stop later ones from also running — "runs
first" and "short-circuits the rest" are different things in zod. Confirmed in zod's own test
suite (`node_modules/zod/src/v4/classic/tests/refine.test.ts:152-165`):

```ts
z.string().refine((_) => false, { abort: true }).refine((_) => false);
// .refine #2 never runs — issues.length === 1
z.string().refine((_) => false).refine((_) => false);
// without `abort: true`, both run — issues.length === 2
```

So for **dependent/sequential** checks — like `applyExpirationDateValidation`'s completeness →
calendar-validity → arrival-date-rule chain, where checking calendar validity on incomplete
data is meaningless — chained `.refine` needs an explicit `{ abort: true }` on each earlier
step to replicate `superRefine`'s early `return`. Even with that, each `.refine` predicate is a
separate function with no shared scope: the arrival-date check would have to recompute
`combineExpirationDate(day, month, year)` itself, since `superRefine`'s single function body
can compute `combined` once and reuse it across branches. That reuse — not just readability —
is `superRefine`'s concrete edge when a later check depends on a value derived earlier.

**Layering a `.superRefine` on top of a base object whose fields already have their own
validation** (e.g. `nationalitySchema` has `.min(1, ...)`, and a wrapping `.superRefine` also
adds an issue at `path: ['nationality']` for some cross-field rule) is safe, but only the
**first** issue per path survives. Confirmed by reading `@hookform/resolvers/zod`'s error
flattening (`node_modules/@hookform/resolvers/dist/resolvers.module.js`):

```js
for (var n = {}; r.length; ) {
  var t = r[0], a = t.path.join(".");
  if (!n[a]) n[a] = { message: t.message, type: t.code }; // first-per-path only
  ...
  r.shift();
}
```

Only one message per path survives unless `useForm({ criteriaMode: 'all' })` is set — not used
anywhere in this codebase currently — in which case RHF instead accumulates multiple into
`errors.field.types`, which nothing here reads.

Issue order matters here: a `ZodObject`'s own shape/field-level checks run during the inner
parse and get pushed into the shared issues list first; a `.superRefine` wrapping that object
(via `ZodEffects`) always runs *after*, even if a field already failed — a failed field marks
the parse "dirty," not "aborted," so effects still run. A base-schema field failure therefore
always wins over a duplicate check for the same path added by an enclosing `superRefine`; the
`superRefine`'s issue is silently dropped, not an overwrite or a crash.

**Template this suggests** for a schema file with several fields, some composite/cross-validated:

```ts
const fieldASchema = z.string().min(1, '...');           // leaf-level, own message
const fieldBObjectSchema = z.object({ x: z.string(), y: z.string() })
  .superRefine((data, ctx) => applyFieldBValidation(data, ctx)); // composite + cross-subfield

export const createSchema = (...args) =>
  z.object({
    fieldA: fieldASchema,
    fieldB: fieldBObjectSchema,
    fieldC: fieldCSchema,
  }).superRefine((data, ctx) => applyCrossFieldValidation(data, ctx, ...args));
  // only add issues here for paths that have no leaf-level check of their own,
  // or for paths outside the object entirely (cross-field rules) — a leaf check
  // on the same path always wins under default criteriaMode.
```

Refs:

- `applyExpirationDateValidation` — `src/journeys/check-in/validation/passengerDocumentsSchema.ts:56-89`
- `nationalitySchema` — `src/journeys/check-in/validation/passengerDocumentsSchema.ts:51-54`
- `abort: true` chained-refine behavior — `node_modules/zod/src/v4/classic/tests/refine.test.ts:152-165`
- error-flattening (`first issue per path wins`) — `node_modules/@hookform/resolvers/dist/resolvers.module.js`
- `zodResolver` issue ordering — `node_modules/@hookform/resolvers/zod/dist/zod.module.js`

## An issue on a nested leaf path marks the parent path errored too

**Pattern:** adding an issue only at `['expirationDate', 'day']` (not `['expirationDate']`
itself) still makes `errors.expirationDate` a truthy object, because RHF's error tree is
built by path segment:

```ts
errors.expirationDate = {
  day: { message: '...', type: 'custom' },
}
```

`errors.expirationDate` has no `.message` of its own and `month`/`year` are untouched, but
it's a non-empty object — so `Boolean(errors.expirationDate)` is `true` off a single subfield
failure. This is exactly what's relied on at `PassportSection.tsx:124`:

```tsx
errorFieldName={errors.expirationDate ? ['day', 'month', 'year'] : []}
```

— one erroring subfield is enough to highlight the whole day/month/year group.

Refs:

- `applyExpirationDateValidation` — `src/journeys/check-in/validation/passengerDocumentsSchema.ts:56-89`
- `PassportSection` — `src/journeys/check-in/screens/TravelDocuments/components/PassportSection.tsx:104-138`

## `useForm` → `control` → subscription hooks: what owns what, and the `formState` proxy trap

**Structure.** `useForm()` owns one internal store (values, `errors`, `dirtyFields`,
`touchedFields`, `isValid`, ...). `control` is a stable handle to that store, threaded down
so children can subscribe without forcing the parent to re-render. `methods.formState` is a
*second*, render-coupled way to read the same store:

```
useForm()
   │
   ├── internal store (values, errors, dirtyFields, touchedFields, isValid...)
   │
   └── returns `methods`
          │
          ├── register, handleSubmit, watch, setValue, reset, trigger, getValues
          ├── formState  ──────► Proxy getters (see below) — reading a field HERE,
          │                      during render, is what subscribes this component
          └── control    ──────► handle to the store, passed to children
                 │
                 ├── useFormState({ control })      → explicit state subscription
                 ├── useWatch({ control, name })     → explicit value subscription
                 ├── useFieldArray({ control, name }) → array field (append/remove/...)
                 ├── useController({ control, name }) → field-level {field, fieldState}
                 └── <Controller control={control} name="x" render={...} /> → JSX form
                                                          of useController
```

**The proxy trap.** `formState.x` is not a plain property — it's an
`Object.defineProperty` getter (`node_modules/react-hook-form/dist/index.cjs.js`, the
`k(...)` helper that builds the proxied object). Invoking the getter returns the value *and*
flips `control._proxyFormState[x] = true`, which is what arms (a) computing that field going
forward and (b) re-rendering this component when it changes. The catch: only a getter
invocation that happens **during render** counts as "the UI needs this." Reading
`methods.formState.isDirty` inside an event handler or `useEffect` still returns a value, but
if nothing ever read it in render first, RHF may never have armed it — so it can sit stuck at
its default (commonly `false`) even after the user visibly edits the form. Matches the
documented behavior at react-hook-form.com/advanced-usage ("make sure formState is read
before render to enable the Proxy").

Fix: either destructure the field where it's actually rendered (`const { formState: {
isDirty } } = methods` in the component body), or use `useFormState({ control })`, which
subscribes unconditionally the moment the hook runs — no render-timing dependency.

**When `methods.formState.x` (read in render) is right:** the value drives the same
component's JSX anyway, e.g. gating a submit button — no reason to add a second hook when
render already reads it.

**When to reach for `useFormState`/`useWatch`/`useController` instead of `methods.formState`
directly:** (a) the value is needed in a **child component** that only received `control`,
so subscribing there avoids re-rendering the whole form; (b) the value is needed **inside a
callback**, where a plain `methods.formState.x` read is exactly the stale-value trap above.

**General template:**

```ts
const methods = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues,
  mode: 'onChange',
});
const { control, handleSubmit, formState: { isDirty } } = methods;

const { fields } = useFieldArray({ control, name: 'items' });
const watchedItems = useWatch({ control, name: 'items' });
const { field } = useController({ control, name: 'someField' });
```

Everything hangs off `methods`/`control` from the one `useForm()` call — `control` gets
passed down to any child component or hook that needs to subscribe without re-rendering the
form owner.

Refs:

- Proxy getter mechanism — `node_modules/react-hook-form/dist/index.cjs.js` (`k(...)` /
  `_proxyFormState`)
- `useFieldArray` + `useWatch` on an array field — `src/journeys/check-in/hooks/useAddGoRewards.ts:53-63`
- `useWatch` (name-array form) + `useController` — `src/journeys/check-in/hooks/useEmergencyContactSection.ts:40-57`
- `isDirty`-via-`useFormState` fix — `src/journeys/check-in/hooks/usePassengerDocumentForm.ts:78-84`
