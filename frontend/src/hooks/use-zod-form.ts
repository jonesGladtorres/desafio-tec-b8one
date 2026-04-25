'use client';

import { useState } from 'react';
import { z, ZodSchema } from 'zod';

export function useZodForm<TSchema extends ZodSchema>(
  schema: TSchema,
  initialValues: z.infer<TSchema>,
) {
  type FormData = z.infer<TSchema>;

  const [values, setValues] = useState<FormData>(initialValues);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  function setValue(field: string, value: unknown) {
    setValues((prev: FormData) => ({ ...(prev as object), [field]: value }) as FormData);
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function validate(): FormData | null {
    const result = schema.safeParse(values);
    if (result.success) {
      setErrors({});
      return result.data as FormData;
    }

    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const field = String(issue.path[0]);
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    setErrors(fieldErrors);
    return null;
  }

  function reset() {
    setValues(initialValues);
    setErrors({});
  }

  return { values, errors, setValue, validate, reset };
}
