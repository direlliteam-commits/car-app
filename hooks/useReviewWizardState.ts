import { useState, useCallback, useMemo, useEffect } from "react";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { apiRequest, apiUploadRequest } from "@/lib/query-client";
import { API } from "@/lib/api-endpoints";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/lib/i18n";
import { useAlert } from "@/contexts/AlertContext";
import type { CascadeField } from "@/components/filters/VehicleCascadePicker";
import type { ApiConfiguration, ApiModification, BrandCategory } from "@/hooks/useCarHierarchy";
import {
  useBrands,
  useModels,
  useGenerations,
  useConfigurations,
  useModifications,
  useFilteredBrands,
} from "@/hooks/useCarHierarchy";
import type { ReviewEditData } from "@/components/ReviewWizard";

export const REVIEW_TAG_KEYS = [
  "tagSafety", "tagDynamics", "tagReliability", "tagHandling",
  "tagMaintenanceCost", "tagExterior", "tagFuelEconomy", "tagOffroad",
  "tagSuspension", "tagNoise", "tagComfort", "tagInterior",
  "tagBuildQuality", "tagTransmission", "tagCabinSpace", "tagMultimedia",
  "tagDimensions", "tagPrice", "tagTrunk",
] as const;

export const OWNERSHIP_KEYS = [
  "wizOwn6m", "wizOwn6to12m", "wizOwn1to2y", "wizOwn2to3y", "wizOwn3to5y", "wizOwn5plus",
] as const;

export const RATING_CATEGORY_KEYS = [
  { key: "appearance", labelKey: "wizAppearance" },
  { key: "safety", labelKey: "wizSafety" },
  { key: "comfort", labelKey: "wizComfort" },
  { key: "reliability", labelKey: "wizReliability" },
  { key: "driving", labelKey: "wizDriving" },
] as const;

export type WizardStep =
  | "brand"
  | "model"
  | "generation"
  | "configuration"
  | "modification"
  | "ownership"
  | "pros"
  | "cons"
  | "rating_appearance"
  | "rating_safety"
  | "rating_comfort"
  | "rating_reliability"
  | "rating_driving"
  | "final";

export const ALL_STEPS: WizardStep[] = [
  "brand",
  "model",
  "generation",
  "configuration",
  "modification",
  "ownership",
  "pros",
  "cons",
  "rating_appearance",
  "rating_safety",
  "rating_comfort",
  "rating_reliability",
  "rating_driving",
  "final",
];

export const VEHICLE_CASCADE_STEPS: CascadeField[] = ["brand", "model", "generation", "configuration", "modification"];

export const STEP_TITLE_KEYS: Record<WizardStep, string> = {
  brand: "wizBrand",
  model: "wizModel",
  generation: "wizGeneration",
  configuration: "wizConfiguration",
  modification: "wizModification",
  ownership: "wizOwnership",
  pros: "wizPros",
  cons: "wizCons",
  rating_appearance: "wizAppearance",
  rating_safety: "wizSafety",
  rating_comfort: "wizComfort",
  rating_reliability: "wizReliability",
  rating_driving: "wizDriving",
  final: "wizFinal",
};

export const MAX_REVIEW_IMAGES = 5;

export function useReviewWizardState(editData?: ReviewEditData, onClose?: () => void) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { showAlert } = useAlert();

  const isEditMode = !!editData;
  const [currentStep, setCurrentStep] = useState<WizardStep>(isEditMode ? "pros" : "brand");
  const [brandSearch, setBrandSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");
  const [brandCategory, setBrandCategory] = useState<BrandCategory>("popular");

  const [cascadeBrandId, setCascadeBrandId] = useState<number | null>(null);
  const [cascadeModelId, setCascadeModelId] = useState<number | null>(null);
  const [cascadeGenerationId, setCascadeGenerationId] = useState<number | null>(null);
  const [cascadeConfigurationId, setCascadeConfigurationId] = useState<number | null>(null);

  const [selectedBrand, setSelectedBrand] = useState(editData?.brand || "");
  const [selectedModel, setSelectedModel] = useState(editData?.model || "");
  const [selectedGeneration, setSelectedGeneration] = useState(editData?.generation || "");
  const [selectedBodyType, setSelectedBodyType] = useState(editData?.bodyType || "");
  const [selectedModification, setSelectedModification] = useState(editData?.modification || "");

  const [ownershipPeriod, setOwnershipPeriod] = useState(editData?.ownershipPeriod || "");
  const [pros, setPros] = useState<string[]>(editData?.pros || []);
  const [prosCustom, setProsCustom] = useState("");
  const [cons, setCons] = useState<string[]>(editData?.cons || []);
  const [consCustom, setConsCustom] = useState("");

  const [ratings, setRatings] = useState<Record<string, number>>(editData?.ratings || {
    appearance: 0,
    safety: 0,
    comfort: 0,
    reliability: 0,
    driving: 0,
  });

  const [title, setTitle] = useState(editData?.title || "");
  const [content, setContent] = useState(editData?.content || "");
  const [imageUris, setImageUris] = useState<string[]>(editData?.images || []);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    brands: apiBrands, popularBrands, chineseBrands, foreignBrands, russianBrands,
    loading: brandsLoading,
  } = useBrands("passenger");

  const categoryBrandsMap: Record<string, typeof apiBrands> = {
    all: apiBrands,
    popular: popularBrands,
    foreign: foreignBrands,
    chinese: chineseBrands,
    russian: russianBrands,
  };

  const filteredBrands = useFilteredBrands(
    categoryBrandsMap[brandCategory] ?? apiBrands,
    brandSearch
  );

  const { models: cascadeModels, loading: cascadeModelsLoading } = useModels(cascadeBrandId);
  const { generations: cascadeGenerations, loading: cascadeGenerationsLoading } = useGenerations(cascadeModelId);
  const { configurations: cascadeConfigurations, loading: cascadeConfigurationsLoading } = useConfigurations(cascadeGenerationId);
  const { modifications: cascadeModifications, loading: cascadeModificationsLoading } = useModifications(cascadeConfigurationId);

  const filteredModels = useMemo(() => {
    if (!modelSearch.trim()) return cascadeModels;
    const q = modelSearch.toLowerCase().trim();
    return cascadeModels.filter(m => m.name.toLowerCase().includes(q));
  }, [cascadeModels, modelSearch]);

  const activeSteps = useMemo(() => {
    if (isEditMode) {
      return ["pros", "cons", "rating_appearance", "rating_safety", "rating_comfort", "rating_reliability", "rating_driving", "final"] as WizardStep[];
    }
    const steps = [...ALL_STEPS];
    if (cascadeGenerationId && cascadeConfigurations.length === 0 && !cascadeConfigurationsLoading) {
      const idx = steps.indexOf("configuration");
      if (idx !== -1) steps.splice(idx, 1);
      const modIdx = steps.indexOf("modification");
      if (modIdx !== -1) steps.splice(modIdx, 1);
    } else if (cascadeConfigurationId && cascadeModifications.length === 0 && !cascadeModificationsLoading) {
      const idx = steps.indexOf("modification");
      if (idx !== -1) steps.splice(idx, 1);
    }
    return steps;
  }, [isEditMode, cascadeGenerationId, cascadeConfigurationId, cascadeConfigurations, cascadeModifications, cascadeConfigurationsLoading, cascadeModificationsLoading]);

  const currentStepIndex = activeSteps.indexOf(currentStep);
  const totalSteps = activeSteps.length;

  const filledCount = useMemo(() => {
    let count = 0;
    if (selectedBrand) count++;
    if (selectedModel) count++;
    if (selectedGeneration) count++;
    if (selectedBodyType) count++;
    if (selectedModification) count++;
    if (ownershipPeriod) count++;
    if (pros.length > 0) count++;
    if (cons.length > 0) count++;
    Object.values(ratings).forEach(r => { if (r > 0) count++; });
    if (title.trim()) count++;
    if (content.trim().length >= 500) count++;
    return count;
  }, [selectedBrand, selectedModel, selectedGeneration, selectedBodyType, selectedModification, ownershipPeriod, pros, cons, ratings, title, content]);

  const totalFields = 11 + Object.keys(ratings).length;

  const averageRating = useMemo(() => {
    const vals = Object.values(ratings).filter(v => v > 0);
    if (vals.length === 0) return 0;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
  }, [ratings]);

  const handleSelectBrand = useCallback((brand: { id: number; name: string }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCascadeBrandId(brand.id);
    setSelectedBrand(brand.name);
    setSelectedModel("");
    setSelectedGeneration("");
    setSelectedBodyType("");
    setSelectedModification("");
    setCascadeModelId(null);
    setCascadeGenerationId(null);
    setCascadeConfigurationId(null);
    setModelSearch("");
    setCurrentStep("model");
  }, []);

  const handleSelectModel = useCallback((model: { id: number; name: string }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCascadeModelId(model.id);
    setSelectedModel(model.name);
    setSelectedGeneration("");
    setSelectedBodyType("");
    setSelectedModification("");
    setCascadeGenerationId(null);
    setCascadeConfigurationId(null);
    setCurrentStep("generation");
  }, []);

  const handleSelectGeneration = useCallback((gen: { id: number; name: string }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCascadeGenerationId(gen.id);
    setSelectedGeneration(gen.name);
    setSelectedBodyType("");
    setSelectedModification("");
    setCascadeConfigurationId(null);
    setCurrentStep("configuration");
  }, []);

  const handleAutoSkipPrunedStep = useCallback(() => {
    if (currentStep !== "configuration" && currentStep !== "modification") return;
    if (activeSteps.includes(currentStep)) return;
    const idx = ALL_STEPS.indexOf(currentStep);
    for (let i = idx + 1; i < ALL_STEPS.length; i++) {
      if (activeSteps.includes(ALL_STEPS[i])) {
        setCurrentStep(ALL_STEPS[i]);
        return;
      }
    }
  }, [currentStep, activeSteps]);

  useEffect(() => {
    handleAutoSkipPrunedStep();
  }, [handleAutoSkipPrunedStep]);

  const handleSelectConfiguration = useCallback((config: ApiConfiguration) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCascadeConfigurationId(config.id);
    setSelectedBodyType(config.name);
    setSelectedModification("");
    setCurrentStep("modification");
  }, []);

  const handleSelectModification = useCallback((mod: ApiModification, config: ApiConfiguration | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedModification(mod.name);
    setCurrentStep("ownership");
  }, []);

  const handleSkipGeneration = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentStep("ownership");
  }, []);

  const handleSkipConfiguration = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentStep("ownership");
  }, []);

  const handleSkipModification = useCallback((configId: number | null, configs: ApiConfiguration[]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentStep("ownership");
  }, []);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let idx = activeSteps.indexOf(currentStep);
    if (idx === -1) {
      const allIdx = ALL_STEPS.indexOf(currentStep);
      for (let i = allIdx - 1; i >= 0; i--) {
        const stepIdx = activeSteps.indexOf(ALL_STEPS[i]);
        if (stepIdx !== -1) {
          idx = stepIdx + 1;
          break;
        }
      }
      if (idx === -1) idx = 0;
    }
    if (idx <= 0) {
      onClose?.();
      return;
    }
    const prevStep = activeSteps[idx - 1];
    if (prevStep === "model") {
      setCascadeModelId(null);
      setSelectedModel("");
    } else if (prevStep === "brand") {
      setCascadeBrandId(null);
      setSelectedBrand("");
      setBrandSearch("");
    } else if (prevStep === "generation") {
      setCascadeGenerationId(null);
      setSelectedGeneration("");
    } else if (prevStep === "configuration") {
      setCascadeConfigurationId(null);
      setSelectedBodyType("");
    }
    setCurrentStep(prevStep);
  }, [currentStep, activeSteps, onClose]);

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const idx = activeSteps.indexOf(currentStep);
    if (idx < activeSteps.length - 1) {
      setCurrentStep(activeSteps[idx + 1]);
    }
  }, [currentStep, activeSteps]);

  const toggleTag = useCallback((tag: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (list.includes(tag)) {
      setList(list.filter(t => t !== tag));
    } else {
      setList([...list, tag]);
    }
  }, []);

  const handleSetRating = useCallback((category: string, value: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRatings(prev => ({ ...prev, [category]: value }));
    setTimeout(() => {
      const idx = activeSteps.indexOf(currentStep);
      if (idx < activeSteps.length - 1) {
        setCurrentStep(activeSteps[idx + 1]);
      }
    }, 400);
  }, [activeSteps, currentStep]);

  const pickImages = useCallback(async () => {
    if (imageUris.length >= MAX_REVIEW_IMAGES) {
      showAlert(t("journal.imageLimit"), t("journal.maxImages").replace("{count}", String(MAX_REVIEW_IMAGES)), undefined, "warning");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_REVIEW_IMAGES - imageUris.length,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;

    setUploading(true);
    try {
      const formData = new FormData();
      for (const asset of result.assets) {
        const uri = asset.uri;
        const name = uri.split("/").pop() || `image_${Date.now()}.jpg`;
        const type = asset.mimeType || "image/jpeg";
        formData.append("images", { uri, name, type } as unknown as Blob);
      }
      const res = await apiUploadRequest("POST", API.upload, formData);
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      const urls: string[] = data.urls || [];
      setImageUris((prev) => [...prev, ...urls].slice(0, MAX_REVIEW_IMAGES));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      showAlert(t("journal.wizError"), t("journal.uploadError"), undefined, "error");
    } finally {
      setUploading(false);
    }
  }, [imageUris.length]);

  const removeImage = useCallback((idx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setImageUris((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      showAlert(t("journal.wizError"), t("journal.wizEnterTitle"), undefined, "error");
      return;
    }
    if (content.trim().length < 500) {
      showAlert(t("journal.wizError"), t("journal.wizMin500").replace("{count}", String(content.trim().length)), undefined, "error");
      return;
    }
    if (averageRating === 0) {
      showAlert(t("journal.wizError"), t("journal.wizSetRatings"), undefined, "error");
      return;
    }

    setSubmitting(true);
    try {
      const allPros = [...pros];
      if (prosCustom.trim()) {
        prosCustom.split(",").forEach(p => {
          const trimmed = p.trim();
          if (trimmed && !allPros.includes(trimmed)) allPros.push(trimmed);
        });
      }
      const allCons = [...cons];
      if (consCustom.trim()) {
        consCustom.split(",").forEach(c => {
          const trimmed = c.trim();
          if (trimmed && !allCons.includes(trimmed)) allCons.push(trimmed);
        });
      }

      const payload: Record<string, unknown> = {
        title: title.trim(),
        content: content.trim(),
        images: imageUris.length > 0 ? imageUris : [],
        brand: selectedBrand || null,
        model: selectedModel || null,
        generation: selectedGeneration || null,
        category: "reviews",
        rating: averageRating > 0 ? averageRating : null,
        reviewDetails: {
          bodyType: selectedBodyType || null,
          modification: selectedModification || null,
          ownershipPeriod: ownershipPeriod || null,
          pros: allPros,
          cons: allCons,
          ratings,
        },
      };

      if (isEditMode && editData) {
        await apiRequest("PUT", API.journal.update(editData.postId), payload);
      } else {
        await apiRequest("POST", API.journal.create, payload);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: [API.journal.feed] });
      queryClient.invalidateQueries({ queryKey: [API.modelReviews] });
      if (isEditMode && editData) {
        queryClient.invalidateQueries({ queryKey: [API.journal.postDetail(editData.postId)] });
      }
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: [API.journal.userPosts(user.id)] });
      }
      onClose?.();
    } catch {
      showAlert(t("journal.wizError"), t("journal.wizPublishError"), undefined, "error");
    } finally {
      setSubmitting(false);
    }
  }, [title, content, imageUris, selectedBrand, selectedModel, selectedGeneration, selectedBodyType, selectedModification, ownershipPeriod, pros, prosCustom, cons, consCustom, ratings, averageRating, isEditMode, editData, queryClient, user?.id, onClose, t]);

  const handleClose = useCallback(() => {
    showAlert(t("journal.wizCloseConfirm"), t("journal.wizProgressLost"), [
      { text: t("journal.cancel"), style: "cancel" },
      { text: t("journal.wizClose"), style: "destructive", onPress: onClose },
    ], "confirm");
  }, [onClose]);

  const isVehicleStep = VEHICLE_CASCADE_STEPS.includes(currentStep as CascadeField);

  const canContinue = () => {
    if (currentStep === "ownership") return !!ownershipPeriod;
    if (currentStep === "pros") return pros.length > 0 || prosCustom.trim().length > 0;
    if (currentStep === "cons") return cons.length > 0 || consCustom.trim().length > 0;
    if (currentStep.startsWith("rating_")) {
      const key = currentStep.replace("rating_", "");
      return (ratings[key] || 0) > 0;
    }
    return true;
  };

  const isRatingStep = currentStep.startsWith("rating_");
  const isOwnershipStep = currentStep === "ownership";
  const showContinueButton = !isVehicleStep && currentStep !== "final" && !isRatingStep && !isOwnershipStep;
  const showPublishButton = currentStep === "final";

  return {
    currentStep, setCurrentStep, brandSearch, setBrandSearch, modelSearch, setModelSearch,
    brandCategory, setBrandCategory, cascadeConfigurationId,
    filteredBrands, filteredModels, cascadeGenerations, cascadeConfigurations, cascadeModifications,
    brandsLoading, cascadeModelsLoading, cascadeGenerationsLoading, cascadeConfigurationsLoading, cascadeModificationsLoading,
    activeSteps, currentStepIndex, totalSteps, filledCount, totalFields, averageRating,
    isEditMode, isVehicleStep, showContinueButton, showPublishButton, canContinue,
    selectedBrand, selectedModel, selectedGeneration, selectedBodyType, selectedModification,
    ownershipPeriod, setOwnershipPeriod, pros, setPros, prosCustom, setProsCustom,
    cons, setCons, consCustom, setConsCustom, ratings, title, setTitle, content, setContent,
    imageUris, uploading, submitting,
    handleSelectBrand, handleSelectModel, handleSelectGeneration, handleSelectConfiguration,
    handleSelectModification, handleSkipGeneration, handleSkipConfiguration, handleSkipModification,
    handleBack, handleNext, toggleTag, handleSetRating, pickImages, removeImage, handleSubmit, handleClose, t,
  };
}
