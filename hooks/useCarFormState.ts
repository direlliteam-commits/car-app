import { useCarFormValues, initialFormData } from "./useCarFormValues";
import { useCarFormValidation } from "./useCarFormValidation";

export { initialFormData };

interface UseCarFormStateOptions {
  initialData?: Partial<import("@/types/car-form").FormData>;
}

export function useCarFormState(options?: UseCarFormStateOptions) {
  const values = useCarFormValues(options);
  const { validateForm, buildSubmitPayload } = useCarFormValidation({
    formData: values.formData,
  });

  return {
    ...values,
    validateForm,
    buildSubmitPayload,
  };
}
