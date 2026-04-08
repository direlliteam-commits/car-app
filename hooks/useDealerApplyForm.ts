import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAlert } from "@/contexts/AlertContext";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { API } from "@/lib/api-endpoints";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSSEListener } from "@/hooks/useUserSSE";
import { useTranslation } from "@/lib/i18n";
import { uploadImage } from "@/lib/media";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";

export interface DealerRequest {
  id: number;
  status: string;
  companyName: string;
  legalForm?: string | null;
  taxId?: string | null;
  country?: string | null;
  city?: string | null;
  phone: string;
  email?: string | null;
  address?: string | null;
  website?: string | null;
  workingHours?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  documents?: string[] | null;
  createdAt: string;
  adminNote?: string | null;
  selectedPlanId?: number | null;
}

export interface DocumentItem {
  uri: string;
  name: string;
  uploaded?: string;
}

export function useDealerApplyForm() {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const LEGAL_FORMS = useMemo(() => [
    { label: t("dealerRequest.legalFormIP"), value: "ip" },
    { label: t("dealerRequest.legalFormOOO"), value: "ooo" },
    { label: t("dealerRequest.legalFormAO"), value: "ao" },
    { label: t("dealerRequest.legalFormOther"), value: "other" },
  ], [t]);

  const STEP_TITLES = useMemo(() => [
    t("dealerRequest.stepCompany"),
    t("dealerRequest.stepAddressSchedule"),
    t("dealerRequest.stepDetails"),
  ], [t]);

  const [step, setStep] = useState(0);
  const [companyName, setCompanyName] = useState("");
  const [legalForm, setLegalForm] = useState("");
  const [taxId, setTaxId] = useState("");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [docUploading, setDocUploading] = useState(false);
  const [forceShowForm, setForceShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showHoursPicker, setShowHoursPicker] = useState(false);

  useSSEListener((event) => {
    if (event.event === "dealer_status" || event.event === "account_update") {
      queryClient.invalidateQueries({ queryKey: [API.dealerRequests.my] });
    }
  });

  const existingRequest = useQuery<DealerRequest | null>({
    queryKey: [API.dealerRequests.my],
    enabled: !!user,
  });

  const canGoNext = useMemo(() => {
    if (step === 0) {
      return companyName.trim().length >= 2 && phone.trim().length >= 6 && taxId.trim().length > 0;
    }
    if (step === 1) {
      return city.length > 0 && address.trim().length > 0 && workingHours.length > 0;
    }
    return description.trim().length > 0;
  }, [step, companyName, phone, taxId, city, address, workingHours, description]);

  const canSubmit =
    companyName.trim().length >= 2 &&
    phone.trim().length >= 6 &&
    taxId.trim().length > 0 &&
    city.length > 0 &&
    address.trim().length > 0 &&
    description.trim().length > 0 &&
    workingHours.length > 0;

  const pickLogo = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    setLogoUploading(true);
    try {
      const resp = await uploadImage(result.assets[0].uri, API.dealerRequests.uploadLogo, "logo", "logo.jpg");
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || t("dealerRequest.uploadErrorMsg"));
      }
      const data = await resp.json();
      if (data.url) {
        const baseUrl = getApiUrl();
        const fullUrl = data.url.startsWith("/cloud/") ? `${baseUrl}${data.url.slice(1)}` : data.url;
        setLogoUri(fullUrl);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        throw new Error(t("dealerRequest.urlNotReceived"));
      }
    } catch (err: any) {
      showAlert(t("common.error"), err?.message || t("dealerRequest.logoUploadError"), undefined, "error");
    } finally {
      setLogoUploading(false);
    }
  }, [showAlert, t]);

  const pickDocument = useCallback(async () => {
    if (documents.length >= 5) {
      showAlert(t("dealerRequest.documentLimitTitle"), t("dealerRequest.documentLimitMsg"), undefined, "error");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    setDocUploading(true);
    try {
      const resp = await uploadImage(result.assets[0].uri, API.dealerRequests.uploadDocument, "document", result.assets[0].fileName || "document.jpg");
      const data = await resp.json();
      if (data.url) {
        setDocuments(prev => [...prev, { uri: data.url, name: data.name || "document.jpg", uploaded: data.url }]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      showAlert(t("common.error"), t("dealerRequest.documentUploadError"), undefined, "error");
    } finally {
      setDocUploading(false);
    }
  }, [documents.length, showAlert, t]);

  const removeDocument = useCallback((idx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDocuments(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await apiRequest("POST", API.dealerRequests.list, {
        companyName: companyName.trim(),
        legalForm: legalForm || undefined,
        taxId: taxId.trim() || undefined,
        country: t("dealerRequest.armenia"),
        city: city || undefined,
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        website: website.trim() || undefined,
        workingHours: workingHours || undefined,
        description: description.trim() || undefined,
        logoUrl: logoUri || undefined,
        documents: documents.filter(d => d.uploaded).map(d => d.uploaded!),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: [API.dealerRequests.my] });
      showAlert(
        t("dealerRequest.submitSuccess"),
        t("dealerRequest.submitSuccessMsg"),
        [{ text: "OK", onPress: () => { if (router.canGoBack()) router.back(); else router.replace("/(tabs)"); } }],
        "success"
      );
    } catch (err: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message = err instanceof Error ? err.message : t("dealerRequest.submitError");
      showAlert(t("common.error"), message, undefined, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await apiRequest("PUT", API.dealerRequests.my, {
        companyName: companyName.trim(),
        legalForm: legalForm || undefined,
        taxId: taxId.trim() || undefined,
        country: t("dealerRequest.armenia"),
        city: city || undefined,
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        website: website.trim() || undefined,
        workingHours: workingHours || undefined,
        description: description.trim() || undefined,
        logoUrl: logoUri || undefined,
        documents: documents.filter(d => d.uploaded).map(d => d.uploaded!),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: [API.dealerRequests.my] });
      setForceShowForm(false);
      showAlert(
        t("dealerRequest.updateSuccess"),
        t("dealerRequest.updateSuccessMsg"),
        undefined,
        "success"
      );
    } catch (err: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message = err instanceof Error ? err.message : t("dealerRequest.submitError");
      showAlert(t("common.error"), message, undefined, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const populateFromRequest = useCallback((req: DealerRequest) => {
    setCompanyName(req.companyName || "");
    setLegalForm(req.legalForm || "");
    setTaxId(req.taxId || "");
    setPhone(req.phone || user?.phone || "");
    setEmail(req.email || user?.email || "");
    setCity(req.city || "");
    setAddress(req.address || "");
    setWebsite(req.website || "");
    setDescription(req.description || "");
    setWorkingHours(req.workingHours || "");
    setLogoUri(req.logoUrl || null);
    const docs = req.documents as string[] | null;
    setDocuments(docs && docs.length > 0 ? docs.map((url, i) => ({ uri: url, name: `${t("dealerRequest.documentLabel")} ${i + 1}`, uploaded: url })) : []);
    setStep(0);
    setForceShowForm(true);
  }, [user?.phone, user?.email, t]);

  const isEditingPending = forceShowForm && existingRequest.data?.status === "pending";

  return {
    t,
    step, setStep,
    companyName, setCompanyName,
    legalForm, setLegalForm,
    taxId, setTaxId,
    phone, setPhone,
    email, setEmail,
    city, setCity,
    address, setAddress,
    website, setWebsite,
    description, setDescription,
    workingHours, setWorkingHours,
    submitting,
    logoUri, logoUploading,
    documents, docUploading,
    forceShowForm, setForceShowForm,
    showDetails, setShowDetails,
    showCityPicker, setShowCityPicker,
    showHoursPicker, setShowHoursPicker,
    existingRequest,
    canGoNext, canSubmit,
    pickLogo, pickDocument, removeDocument,
    handleSubmit, handleUpdate,
    populateFromRequest,
    isEditingPending,
    LEGAL_FORMS, STEP_TITLES,
  };
}
