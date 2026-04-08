import { useCarFormState, initialFormData } from "./useCarFormState";
import { useVehicleCascade } from "./useVehicleCascade";
import { useMediaUpload } from "./useMediaUpload";

export { initialFormData };

interface UseCarFormOptions {
  initialData?: Partial<import("@/types/car-form").FormData>;
}

export function useCarForm(options?: UseCarFormOptions) {
  const state = useCarFormState(options);
  const cascade = useVehicleCascade(
    state.formData,
    state.updateField,
    state.setActivePicker,
    state.setExpandedSections,
    state.setFormData,
    state.generationYearToRef,
  );
  const media = useMediaUpload(state.formData, state.setFormData);

  return {
    formData: state.formData,
    setFormData: state.setFormData,
    isLoading: state.isLoading,
    setIsLoading: state.setIsLoading,
    expandedSections: state.expandedSections,
    activePicker: state.activePicker,
    setActivePicker: state.setActivePicker,
    showPreview: state.showPreview,
    setShowPreview: state.setShowPreview,
    fullScreenImageIndex: state.fullScreenImageIndex,
    setFullScreenImageIndex: state.setFullScreenImageIndex,
    webTopInset: state.webTopInset,
    formProgress: state.formProgress,
    isAuthenticated: state.isAuthenticated,
    user: state.user,

    updateField: state.updateField,
    resetForm: state.resetForm,
    populateForm: state.populateForm,
    toggleEquipment: state.toggleEquipment,
    toggleSection: state.toggleSection,
    hasUnsavedChanges: state.hasUnsavedChanges,
    goBack: state.goBack,

    ...cascade,
    ...media,

    validateForm: state.validateForm,
    buildSubmitPayload: state.buildSubmitPayload,
  };
}
