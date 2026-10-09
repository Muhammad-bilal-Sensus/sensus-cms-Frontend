import { useRef, type BaseSyntheticEvent } from "react";
import { useForm, type DefaultValues, type FieldValues, type SubmitErrorHandler, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

export function useSchemaForm<T extends FieldValues>(schema: z.ZodType<T, T>, defaultValues: DefaultValues<T>) {
  const form = useForm<T>({
    defaultValues,
    resolver: zodResolver(schema, undefined, { mode: "sync" }),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    shouldFocusError: false,
  });
  const submitting = useRef(false);

  // Validation can yield before React disables the button. Guard the complete
  // validation/submission cycle, including repeated Enter presses.
  function submitForm(onValid: SubmitHandler<T>, onInvalid?: SubmitErrorHandler<T>) {
    const handler = form.handleSubmit(onValid, onInvalid);
    return async (event?: BaseSyntheticEvent) => {
      event?.preventDefault();
      if (submitting.current) return;
      submitting.current = true;
      try {
        await handler(event);
      } finally {
        submitting.current = false;
      }
    };
  }

  return { ...form, submitForm };
}
