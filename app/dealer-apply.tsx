import React from "react";
import {
  View,
  ScrollView,
  StyleSheet,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors } from "@/constants/colors";
import { ScreenHeader } from "@/components/ScreenHeader";
import { CityPickerSheet, WorkingHoursModal } from "@/components/forms";
import { CARD_GAP } from "@/constants/layout";
import { useDealerApplyForm } from "@/hooks/useDealerApplyForm";
import {
  StepIndicator,
  Step0,
  Step1,
} from "@/components/dealer/DealerApplyFormFields";
import {
  Step2,
  BottomActionBar,
} from "@/components/dealer/DealerApplyStepTwo";
import {
  PendingStatusView,
  ApprovedStatusView,
  RejectedStatusView,
} from "@/components/dealer/DealerApplyStatusViews";

export default function DealerApplyScreen() {
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  const form = useDealerApplyForm();

  const formFieldsProps = {
    isDark,
    colors,
    step: form.step,
    setStep: form.setStep,
    formData: {
      companyName: form.companyName, setCompanyName: form.setCompanyName,
      legalForm: form.legalForm, setLegalForm: form.setLegalForm,
      taxId: form.taxId, setTaxId: form.setTaxId,
      phone: form.phone, setPhone: form.setPhone,
      email: form.email, setEmail: form.setEmail,
      city: form.city, setCity: form.setCity,
      address: form.address, setAddress: form.setAddress,
      description: form.description, setDescription: form.setDescription,
      workingHours: form.workingHours,
    },
    media: {
      logoUri: form.logoUri, logoUploading: form.logoUploading,
      documents: form.documents, docUploading: form.docUploading,
      pickLogo: form.pickLogo, pickDocument: form.pickDocument, removeDocument: form.removeDocument,
    },
    config: {
      setShowCityPicker: form.setShowCityPicker, setShowHoursPicker: form.setShowHoursPicker,
      LEGAL_FORMS: form.LEGAL_FORMS, STEP_TITLES: form.STEP_TITLES,
    },
    t: form.t,
  };

  if (form.existingRequest.data && form.existingRequest.data.status === "pending" && !form.forceShowForm) {
    return (
      <PendingStatusView
        req={form.existingRequest.data}
        showDetails={form.showDetails}
        setShowDetails={form.setShowDetails}
        onEdit={() => form.populateFromRequest(form.existingRequest.data!)}
        isDark={isDark}
        colors={colors}
        t={form.t}
      />
    );
  }

  if (form.existingRequest.data && form.existingRequest.data.status === "approved") {
    return <ApprovedStatusView isDark={isDark} colors={colors} t={form.t} />;
  }

  if (form.existingRequest.data && form.existingRequest.data.status === "rejected" && !form.forceShowForm) {
    return (
      <RejectedStatusView
        req={form.existingRequest.data}
        showDetails={form.showDetails}
        setShowDetails={form.setShowDetails}
        onRetry={() => form.populateFromRequest(form.existingRequest.data!)}
        isDark={isDark}
        colors={colors}
        t={form.t}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
      <ScreenHeader
        title={form.t("dealerRequest.becomeDealer")}
        backgroundColor={isDark ? colors.surface : colors.background}
        onBack={() => {
          if (form.step > 0 && !form.existingRequest.data) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            form.setStep(form.step - 1);
          } else if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/(tabs)");
          }
        }}
      />
      <StepIndicator
        step={form.step}
        setStep={form.setStep}
        STEP_TITLES={form.STEP_TITLES}
        isDark={isDark}
        colors={colors}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {form.step === 0 && <Step0 {...formFieldsProps} />}
          {form.step === 1 && <Step1 {...formFieldsProps} />}
          {form.step === 2 && <Step2 {...formFieldsProps} />}
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomActionBar
        step={form.step}
        setStep={form.setStep}
        canGoNext={form.canGoNext}
        submitting={form.submitting}
        isEditingPending={form.isEditingPending}
        handleSubmit={form.handleSubmit}
        handleUpdate={form.handleUpdate}
        isDark={isDark}
        colors={colors}
        insets={{ bottom: insets.bottom }}
        t={form.t}
      />

      <CityPickerSheet
        visible={form.showCityPicker}
        onClose={() => form.setShowCityPicker(false)}
        currentCity={form.city}
        onSelect={form.setCity}
        colors={colors}
        isDark={isDark}
        insets={{ bottom: insets.bottom }}
      />

      <WorkingHoursModal
        visible={form.showHoursPicker}
        onClose={() => form.setShowHoursPicker(false)}
        value={form.workingHours}
        onSave={(val) => form.setWorkingHours(val)}
        colors={colors}
        isDark={isDark}
        insets={{ top: insets.top, bottom: insets.bottom }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: CARD_GAP },
});
