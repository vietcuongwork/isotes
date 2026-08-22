# Zod + RHF — Generic Schema/Validation Separation Template

## Problem

Ad-hoc `superRefine` blocks tend to mix three concerns in one file: the shape of the
data (`z.object({...})`), the business rules (calling shared validators like
`validatePhoneNumber`), and the plumbing that turns a validator's result into a zod
`ctx.addIssue`. That plumbing is identical across forms — only the shape and the rules
differ — so it's worth factoring out once and reusing for any form, regardless of scale.

## Structure

```
src/utils/validation/fieldValidation.ts          ← generic, one-time, reused everywhere
src/journeys/<x>/validation/<form>/validation.ts ← field validators, no zod
src/journeys/<x>/validation/<form>/schema.ts     ← zod shape + the superRefine composition
```

**Why split `schema.ts` from `validation.ts`:** `validation.ts` stays pure and
unit-testable — plain functions, no zod, no `ctx.addIssue` plumbing, just
`(data, context) => FieldValidationResult`. `schema.ts` is the only file that touches
zod: it owns the object shape _and_ the composition that turns per-field results into
issues.

**The key relationship — `createSchema` is a thin wrapper around `superRefine` +
one centralized apply function:**

```
createEmergencyContactSchema(context)
  = emergencyContactBaseSchema.superRefine((data, ctx) =>
      applyEmergencyContactValidation(data, ctx, context)   ← the convergence point
    )

applyEmergencyContactValidation(data, ctx, context)
  = applyFieldValidators(data, ctx, emergencyContactValidators, context)
                                     ^^^^^^^^^^^^^^^^^^^^^^^^^
                                     every field validator from validation.ts
                                     runs through here and converges on one ctx
```

`applyFieldValidators` (generic core) is the only place that knows how to turn a
`FieldValidationResult` into `ctx.addIssue`. `applyEmergencyContactValidation`
(per-form) is the only place that knows _which_ validator map applies to _this_
schema. `createEmergencyContactSchema` just glues `superRefine` to that apply
function — nothing else happens in it.

## 1. Generic core (write once)

```ts
// src/utils/validation/fieldValidation.ts
import { RefinementCtx } from "zod";
import i18n from "@/i18n";

export interface FieldValidationResult {
  isValid: boolean;
  errorKey?: string;
  errorParams?: Record<string, unknown>;
  /** Pre-resolved message. Overrides errorKey/errorParams when a validator
   *  needs custom i18n handling (e.g. building params the generic path can't). */
  message?: string;
}

export type FieldValidator<TData, TContext = void> = (
  data: TData,
  context: TContext,
) => FieldValidationResult;

export type FieldValidatorMap<TData, TContext = void> = {
  [K in keyof TData]?: FieldValidator<TData, TContext>;
};

export const applyFieldValidators = <
  TData extends Record<string, unknown>,
  TContext = void,
>(
  data: TData,
  ctx: RefinementCtx,
  validators: FieldValidatorMap<TData, TContext>,
  context: TContext,
) => {
  (Object.keys(validators) as (keyof TData)[]).forEach((field) => {
    const validator = validators[field];
    if (!validator) return;

    const result = validator(data, context);
    if (result.isValid) return;

    const message =
      result.message ??
      (result.errorKey
        ? i18n.t(result.errorKey, result.errorParams)
        : undefined);
    if (!message) return;

    ctx.addIssue({
      code: "custom",
      path: [field as string],
      message,
    });
  });
};
```

`z` and `ZodTypeAny` aren't needed in this file anymore — `applyFieldValidators` never
touches a zod schema directly, only `RefinementCtx`. Each form's `schema.ts` is
responsible for calling it inside its own `superRefine`, which is what makes the
`createSchema → superRefine → applyFormValidation → applyFieldValidators` chain
explicit instead of hidden behind a generic factory.

## 2. Per-form example — Emergency Contact

### validation.ts (business rules, no zod — write this first)

```ts
// src/journeys/check-in/validation/emergencyContact/validation.ts
import { CountryDropdownItem } from "@/api/types/country";
import i18n from "@/i18n";
import {
  validateEmergencyName,
  validatePhoneNumber,
} from "@/journeys/customer/utils/validation";
import { FieldValidatorMap } from "@/utils/validation/fieldValidation";
// `import type` — schema.ts imports this file back for its validator map, so the
// FormData type must be a type-only import to avoid a runtime circular import.
import type { EmergencyContactFormData } from "./schema";

export interface EmergencyContactValidationContext {
  countryOptions: CountryDropdownItem[];
}

export const emergencyContactValidators: FieldValidatorMap<
  EmergencyContactFormData,
  EmergencyContactValidationContext
> = {
  emergencyName: (data) => validateEmergencyName(data.emergencyName, false),

  emergencyNumber: (data, { countryOptions }) => {
    const country = countryOptions.find((c) => c.iso2 === data.emergencyIso2);
    const result = validatePhoneNumber(data.emergencyNumber, country, false);

    if (result.isValid || !result.errorKey) return result;

    // validatePhoneNumber's errorParams.field is a mangled, already-lowercased
    // translation key (a bug in the shared validator), so resolve the real
    // label here instead of forwarding it untranslated.
    return {
      ...result,
      message: i18n.t(result.errorKey, {
        field: i18n.t("ditto.form.contactNumber.label").toLowerCase(),
      }),
    };
  },
};
```

### schema.ts (shape + the superRefine composition)

```ts
// src/journeys/check-in/validation/emergencyContact/schema.ts
import { RefinementCtx, z } from "zod";
import { applyFieldValidators } from "@/utils/validation/fieldValidation";
import {
  emergencyContactValidators,
  EmergencyContactValidationContext,
} from "./validation";

export const emergencyContactBaseSchema = z.object({
  emergencyName: z.string().max(64),
  emergencyIso2: z.string(),
  emergencyNumber: z.string(),
});

export type EmergencyContactFormData = z.infer<
  typeof emergencyContactBaseSchema
>;

/**
 * Centralized convergence point: every field validator declared in validation.ts
 * runs through here via applyFieldValidators, so this is the single place that
 * turns "which validators apply to this form" into zod issues.
 */
export const applyEmergencyContactValidation = (
  data: EmergencyContactFormData,
  ctx: RefinementCtx,
  context: EmergencyContactValidationContext,
) => applyFieldValidators(data, ctx, emergencyContactValidators, context);

export const createEmergencyContactSchema = (
  context: EmergencyContactValidationContext,
) =>
  emergencyContactBaseSchema.superRefine((data, ctx) =>
    applyEmergencyContactValidation(data, ctx, context),
  );
```

### Usage with react-hook-form

```tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMemo } from "react";
import {
  createEmergencyContactSchema,
  EmergencyContactFormData,
} from "@/journeys/check-in/validation/emergencyContact/schema";

const EmergencyContactForm = ({
  countryOptions,
}: {
  countryOptions: CountryDropdownItem[];
}) => {
  const schema = useMemo(
    () => createEmergencyContactSchema({ countryOptions }),
    [countryOptions],
  );

  const form = useForm<EmergencyContactFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      emergencyName: "",
      emergencyIso2: "",
      emergencyNumber: "",
    },
  });

  // ...
};
```

## Applying to a new form

1. `validation.ts` — declare a `FieldValidatorMap<FormData, Context>` (`Context = void`
   if the form needs no external data like `countryOptions`); one entry per field that
   needs a rule beyond what zod's own chain already expresses. `FormData` is a
   type-only import from the sibling `schema.ts` (breaks the circular runtime import).
2. `schema.ts` — declare the zod object + inferred type, then the three-line chain:
   `apply<Form>Validation` (calls `applyFieldValidators` with this form's validator
   map) → `create<Form>Schema` (calls `baseSchema.superRefine` with `apply<Form>Validation`).
3. In the component, call `create<Form>Schema(context)` (or with no args if
   `Context = void`) inside `useMemo`, pass the result to `zodResolver`.

## When a field needs more than one check

Combine checks inside the single validator function for that field — return on the
first failure:

```ts
emergencyNumber: (data, context) => {
  const lengthResult = checkLength(data.emergencyNumber);
  if (!lengthResult.isValid) return lengthResult;

  return checkCountryFormat(data.emergencyNumber, context);
},
```

Keeping one validator per field (not one per check) keeps `FieldValidatorMap`'s shape
(`Partial<Record<keyof TData, Validator>>`) simple and keeps `ctx.addIssue` to at most
one issue per field per submit.
