import { useState, useCallback, useMemo } from "react";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useQuery } from "@tanstack/react-query";
import { useAlert } from "@/contexts/AlertContext";
import { useTranslation } from "@/lib/i18n";
import { apiRequest } from "@/lib/query-client";
import { API } from "@/lib/api-endpoints";
import { uploadImage } from "@/lib/media";
import { useProfileForm } from "@/hooks/useProfileForm";
import { useBanks } from "@/hooks/useBanks";
import type { DealerBranch } from "@/shared/schema";

export const SPECIALIZATION_KEYS = [
  "premium", "economy", "japanese", "german", "korean",
  "american", "chinese", "electric", "commercial", "suv",
  "trucks", "moto", "special",
] as const;

export const TERM_CHIPS = [6, 12, 24, 36, 48, 60, 72, 84, 96, 120] as const;
export const WARRANTY_OPTIONS = [1, 2, 3, 6, 9, 12, 18, 24, 30, 36, 48, 60, 72, 84, 96, 120] as const;

const makeBranchId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

function makeEmptyBranch(): DealerBranch {
  return {
    id: makeBranchId(), name: "", address: "", city: "",
    lat: null, lng: null, phones: [""], workingHours: "",
    callsOnlyDuringHours: false, callbackEnabled: false, photos: [], specializations: [],
    warrantyEnabled: false, warrantyMonths: 0,
    tradeInEnabled: false, tradeInMaxAge: 0, tradeInBonus: 0,
    creditProgramEnabled: false, creditInterestRate: 0, creditMaxTerm: 60, creditMinDownPayment: 0, partnerBankIds: [],
  };
}

export function useDealerEditForm() {
  const { showAlert } = useAlert();
  const { t, language } = useTranslation();

  const profileForm = useProfileForm({
    orderedErrorKeys: ["name", "phone", "companyName", "showroomAddress", "workingHours", "website"],
  });
  const {
    name, setName, phone, setPhone, city, setCity,
    saving, errors, scrollRef, fieldOffsets,
    clearError, hasErrors, getErrorCountText,
    user, refreshUser,
  } = profileForm;

  const dealerFeaturesQuery = useQuery<{ subscriptionEnd?: string; gracePeriod?: { graceDaysLeft: number }; active?: boolean }>({
    queryKey: [API.dealer.myFeatures],
    enabled: !!user && user.role === "dealer",
  });
  const dealerGracePeriod = dealerFeaturesQuery.data?.gracePeriod ?? null;
  const subscriptionDaysLeft = useMemo(() => {
    const end = dealerFeaturesQuery.data?.subscriptionEnd;
    if (!end) return null;
    const days = Math.ceil((new Date(end).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  }, [dealerFeaturesQuery.data?.subscriptionEnd]);

  const [about, setAbout] = useState(user?.about || "");
  const [companyName, setCompanyName] = useState(user?.companyName || "");
  const [companyDescription, setCompanyDescription] = useState(user?.companyDescription || "");
  const [workingHours, setWorkingHours] = useState(user?.workingHours || "");
  const [showroomAddress, setShowroomAddress] = useState(user?.showroomAddress || "");
  const [showroomLat, setShowroomLat] = useState<number | null>(user?.showroomLat ?? null);
  const [showroomLng, setShowroomLng] = useState<number | null>(user?.showroomLng ?? null);
  const [website, setWebsite] = useState(user?.website || "");

  const makeDefaultBranch = useCallback((fromUser?: boolean): DealerBranch => ({
    id: makeBranchId(),
    name: "",
    address: fromUser ? (user?.showroomAddress || "") : "",
    city: fromUser ? (user?.city || "") : "",
    lat: fromUser ? (user?.showroomLat ?? null) : null,
    lng: fromUser ? (user?.showroomLng ?? null) : null,
    phones: fromUser && user?.phone ? [user.phone] : [""],
    workingHours: fromUser ? (user?.workingHours || "") : "",
    callsOnlyDuringHours: false,
    callbackEnabled: false,
    photos: [],
    specializations: fromUser ? ((user?.dealerSpecialization || "").split(",").map((s: string) => s.trim()).filter(Boolean).filter((k) => (SPECIALIZATION_KEYS as readonly string[]).includes(k))) : [],
    warrantyEnabled: false,
    warrantyMonths: 0,
    tradeInEnabled: false,
    tradeInMaxAge: 0,
    tradeInBonus: 0,
    creditProgramEnabled: false,
    creditInterestRate: 0,
    creditMaxTerm: 60,
    creditMinDownPayment: 0,
    partnerBankIds: [],
  }), [user]);

  const [branches, setBranches] = useState<DealerBranch[]>(() => {
    const parseSpecs = () => (user?.dealerSpecialization || "").split(",").map((s: string) => s.trim()).filter(Boolean).filter((k) => (SPECIALIZATION_KEYS as readonly string[]).includes(k));
    const existing = user?.dealerBranches;
    if (Array.isArray(existing) && existing.length > 0) {
      return existing.map((b: any, idx: number) => {
        const base: DealerBranch = { ...makeEmptyBranch(), ...b,
          specializations: Array.isArray(b.specializations) ? b.specializations : [],
          partnerBankIds: Array.isArray(b.partnerBankIds) ? b.partnerBankIds : [],
          photos: Array.isArray(b.photos) ? b.photos : [],
        };
        if (idx === 0 && !('warrantyEnabled' in b)) {
          base.specializations = base.specializations.length > 0 ? base.specializations : parseSpecs();
          base.warrantyEnabled = user?.warrantyEnabled ?? false;
          base.warrantyMonths = user?.warrantyMonths ?? 0;
          base.tradeInEnabled = user?.tradeInEnabled ?? false;
          base.tradeInMaxAge = user?.tradeInMaxAge ?? 0;
          base.tradeInBonus = user?.tradeInBonus ?? 0;
          base.creditProgramEnabled = user?.creditProgramEnabled ?? false;
          base.creditInterestRate = user?.creditInterestRate ?? 0;
          base.creditMaxTerm = user?.creditMaxTerm ?? 60;
          base.creditMinDownPayment = user?.creditMinDownPayment ?? 0;
          base.partnerBankIds = Array.isArray(user?.partnerBankIds) ? (user.partnerBankIds as number[]) : [];
        }
        return base;
      });
    }
    return [{ ...makeEmptyBranch(),
      address: user?.showroomAddress || "", city: user?.city || "",
      lat: user?.showroomLat ?? null, lng: user?.showroomLng ?? null,
      phones: user?.phone ? [user.phone] : [""],
      workingHours: user?.workingHours || "",
      specializations: parseSpecs(),
    }];
  });

  const [editingBranchIdx, setEditingBranchIdx] = useState<number | null>(null);
  const [branchWorkingHoursIdx, setBranchWorkingHoursIdx] = useState<number | null>(null);
  const [activeBranchIdx, setActiveBranchIdx] = useState<number | null>(null);
  const [showroomPhotos, setShowroomPhotos] = useState<string[]>(
    Array.isArray(user?.showroomPhotos) ? (user.showroomPhotos as string[]) : []
  );

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [deletingLogo, setDeletingLogo] = useState(false);
  const [deletingCover, setDeletingCover] = useState(false);
  const [uploadingShowroom, setUploadingShowroom] = useState(false);
  const [uploadingBranchPhoto, setUploadingBranchPhoto] = useState<number | null>(null);

  const [showBankPicker, setShowBankPicker] = useState(false);
  const [showWarrantyPicker, setShowWarrantyPicker] = useState(false);
  const [showSpecPicker, setShowSpecPicker] = useState(false);
  const [showCreditTermsPicker, setShowCreditTermsPicker] = useState(false);
  const [showTradeInMaxAgePicker, setShowTradeInMaxAgePicker] = useState(false);
  const [showTradeInBonusPicker, setShowTradeInBonusPicker] = useState(false);

  const hasLogo = !!user?.companyLogoUrl;
  const hasCover = !!user?.companyCoverUrl;

  const validateDealerProfile = (): boolean => {
    const baseErrors = profileForm.validateBaseProfile();
    if (!companyName.trim() || companyName.trim().length < 2) {
      baseErrors.companyName = t("editProfile.companyNameRequired");
    }
    if (!showroomAddress.trim()) {
      baseErrors.showroomAddress = t("editProfile.addressRequired");
    }
    if (website.trim() && !/^https?:\/\/.+\..+/.test(website.trim())) {
      baseErrors.website = t("editProfile.websiteFormat");
    }
    if (workingHours.trim() && workingHours.trim().length < 5) {
      baseErrors.workingHours = t("editProfile.workingHoursRequired");
    }
    profileForm.setErrors(baseErrors);
    if (Object.keys(baseErrors).length > 0) {
      setTimeout(() => profileForm.scrollToFirstError(Object.keys(baseErrors)), 100);
    }
    return Object.keys(baseErrors).length === 0;
  };

  const toggleSpecialization = useCallback((key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (activeBranchIdx === null) return;
    setBranches(prev => prev.map((b, i) => {
      if (i !== activeBranchIdx) return b;
      const specs = b.specializations.includes(key) ? b.specializations.filter(k => k !== key) : [...b.specializations, key];
      return { ...b, specializations: specs };
    }));
  }, [activeBranchIdx]);

  const getCreditTermsSummary = (branch: DealerBranch) => {
    const parts: string[] = [];
    if (branch.creditInterestRate > 0) {
      parts.push(`${t("editProfile.creditInterestRateLabel")}: ${t("editProfile.creditInterestRateFromPrefix")} ${branch.creditInterestRate}%`);
    }
    if (branch.creditMaxTerm > 0) parts.push(`${t("editProfile.creditMaxTermLabel")}: ${branch.creditMaxTerm} ${t("editProfile.monthsShort")}`);
    if (branch.creditMinDownPayment > 0) parts.push(`${t("editProfile.creditMinDownPaymentLabel")}: ${branch.creditMinDownPayment}%`);
    return parts.join("\n");
  };

  const hasChanges =
    name !== (user?.name || "") ||
    phone !== (user?.phone || "") ||
    city !== (user?.city || "") ||
    about !== (user?.about || "") ||
    companyName !== (user?.companyName || "") ||
    companyDescription !== (user?.companyDescription || "") ||
    workingHours !== (user?.workingHours || "") ||
    showroomAddress !== (user?.showroomAddress || "") ||
    showroomLat !== (user?.showroomLat ?? null) ||
    showroomLng !== (user?.showroomLng ?? null) ||
    website !== (user?.website || "") ||
    JSON.stringify(branches) !== JSON.stringify(Array.isArray(user?.dealerBranches) && user.dealerBranches.length > 0 ? user.dealerBranches : [makeDefaultBranch(true)]);

  const anyCreditEnabled = branches.some(b => b.creditProgramEnabled);
  const banksQuery = useBanks(anyCreditEnabled || showBankPicker);
  const allBanks = banksQuery.data || [];

  const toggleBank = useCallback((id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (activeBranchIdx === null) return;
    setBranches(prev => prev.map((b, i) => {
      if (i !== activeBranchIdx) return b;
      const ids = b.partnerBankIds.includes(id) ? b.partnerBankIds.filter(x => x !== id) : [...b.partnerBankIds, id];
      return { ...b, partnerBankIds: ids };
    }));
  }, [activeBranchIdx]);

  const getBankName = useCallback((bank: { nameRu: string; nameEn: string; nameAm: string }) => {
    if (language === "hy") return bank.nameAm || bank.nameRu;
    if (language === "en") return bank.nameEn || bank.nameRu;
    return bank.nameRu;
  }, [language]);

  const handlePickDealerImage = async (type: "logo" | "cover") => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showAlert(t("editProfile.accessDenied"), t("editProfile.galleryAccessMsg"), undefined, "error");
        return;
      }
      const aspect: [number, number] = type === "cover" ? [3, 1] : [1, 1];
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"], allowsEditing: true, aspect, quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]) return;
      if (type === "logo") setUploadingLogo(true);
      else setUploadingCover(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await uploadImage(
        result.assets[0].uri, API.auth.dealerImage(type), "image", `dealer-${type}.jpg`
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || t("editProfile.uploadError"));
      }
      await refreshUser();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error(`Dealer ${type} upload error:`, error);
      showAlert(t("common.error"), type === "logo" ? t("editProfile.logoUploadError") : t("editProfile.coverUploadError"), undefined, "error");
    } finally {
      if (type === "logo") setUploadingLogo(false);
      else setUploadingCover(false);
    }
  };

  const handleDeleteCover = async () => {
    if (uploadingCover) return;
    try {
      setDeletingCover(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await apiRequest("PUT", API.auth.profile, { companyCoverUrl: null });
      await refreshUser();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("[DealerEdit] deleteCover error:", error);
      showAlert(t("common.error"), t("editProfile.saveError"), undefined, "error");
    } finally {
      setDeletingCover(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (uploadingLogo) return;
    try {
      setDeletingLogo(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await apiRequest("PUT", API.auth.profile, { companyLogoUrl: null });
      await refreshUser();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("[DealerEdit] deleteLogo error:", error);
      showAlert(t("common.error"), t("editProfile.saveError"), undefined, "error");
    } finally {
      setDeletingLogo(false);
    }
  };

  const handleAddShowroomPhotos = async () => {
    const remaining = 10 - showroomPhotos.length;
    if (remaining <= 0) {
      showAlert(t("editProfile.limitLabel"), t("editProfile.showroomLimit"));
      return;
    }
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showAlert(t("editProfile.accessDenied"), t("editProfile.galleryAccessMsg"), undefined, "error");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.length) return;

      setUploadingShowroom(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      let latestPhotos = showroomPhotos;
      for (const asset of result.assets) {
        try {
          const res = await uploadImage(asset.uri, API.auth.showroomPhoto, "photo", "showroom.jpg");
          if (!res.ok) continue;
          const data = await res.json();
          if (data.photos) latestPhotos = data.photos;
        } catch {
          continue;
        }
      }
      setShowroomPhotos(latestPhotos);
      await refreshUser();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Showroom photo upload error:", error);
      showAlert(t("common.error"), t("editProfile.photoUploadError"), undefined, "error");
    } finally {
      setUploadingShowroom(false);
    }
  };

  const handleDeleteShowroomPhoto = async (index: number) => {
    try {
      await apiRequest("DELETE", API.auth.showroomPhoto, { index });
      const updated = showroomPhotos.filter((_, i) => i !== index);
      setShowroomPhotos(updated);
      await refreshUser();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Showroom photo delete error:", error);
      showAlert(t("common.error"), t("editProfile.deletePhotoError"), undefined, "error");
    }
  };

  const handleAddBranchPhotos = async (bIdx: number) => {
    const branch = branches[bIdx];
    if (!branch) return;
    const remaining = 10 - branch.photos.length;
    if (remaining <= 0) {
      showAlert(t("editProfile.limitLabel"), t("editProfile.showroomLimit"));
      return;
    }
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showAlert(t("editProfile.accessDenied"), t("editProfile.galleryAccessMsg"), undefined, "error");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.length) return;

      setUploadingBranchPhoto(bIdx);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const newUrls: string[] = [];
      for (const asset of result.assets) {
        try {
          const res = await uploadImage(asset.uri, API.auth.branchPhoto, "photo", "branch.jpg");
          if (!res.ok) continue;
          const data = await res.json();
          if (data.url) newUrls.push(data.url);
        } catch {
          continue;
        }
      }
      if (newUrls.length > 0) {
        setBranches(prev => prev.map((b, i) => i === bIdx ? { ...b, photos: [...b.photos, ...newUrls] } : b));
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Branch photo upload error:", error);
      showAlert(t("common.error"), t("editProfile.photoUploadError"), undefined, "error");
    } finally {
      setUploadingBranchPhoto(null);
    }
  };

  const handleDeleteBranchPhoto = (bIdx: number, photoIdx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBranches(prev => prev.map((b, i) => i === bIdx ? { ...b, photos: b.photos.filter((_, pi) => pi !== photoIdx) } : b));
  };

  const onSave = async () => {
    if (!validateDealerProfile()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    const primaryBranch = branches[0];
    await profileForm.handleSave({
      name: name.trim(),
      phone: primaryBranch?.phones?.[0]?.trim() || phone.trim() || null,
      city: primaryBranch?.city || city.trim() || null,
      about: about.trim() || null,
      companyName: companyName.trim() || null,
      companyDescription: companyDescription.trim() || null,
      workingHours: primaryBranch?.workingHours || workingHours.trim() || null,
      showroomAddress: primaryBranch?.address || showroomAddress.trim() || null,
      showroomLat: primaryBranch?.lat ?? showroomLat,
      showroomLng: primaryBranch?.lng ?? showroomLng,
      website: website.trim() || null,
      dealerBranches: branches.filter(b => b.address || b.name || b.phones.some(p => p.trim())),
      callbackEnabled: branches.some(b => b.callbackEnabled),
      tradeInEnabled: primaryBranch?.tradeInEnabled ?? false,
      tradeInMaxAge: primaryBranch?.tradeInEnabled ? (primaryBranch.tradeInMaxAge || null) : null,
      tradeInBonus: primaryBranch?.tradeInEnabled ? (primaryBranch.tradeInBonus || null) : null,
      warrantyEnabled: primaryBranch?.warrantyEnabled ?? false,
      warrantyMonths: primaryBranch?.warrantyEnabled ? (primaryBranch.warrantyMonths || null) : null,
      dealerSpecialization: primaryBranch?.specializations?.length ? primaryBranch.specializations.join(",") : null,
      creditProgramEnabled: primaryBranch?.creditProgramEnabled ?? false,
      creditInterestRate: primaryBranch?.creditProgramEnabled ? primaryBranch.creditInterestRate : null,
      creditInterestRateTo: primaryBranch?.creditProgramEnabled ? primaryBranch.creditInterestRate : null,
      creditMaxTerm: primaryBranch?.creditProgramEnabled ? primaryBranch.creditMaxTerm : null,
      creditMinDownPayment: primaryBranch?.creditProgramEnabled ? primaryBranch.creditMinDownPayment : null,
      partnerBankIds: primaryBranch?.creditProgramEnabled ? primaryBranch.partnerBankIds : [],
    });
  };

  return {
    profileForm,
    name, setName, phone, setPhone, city, setCity,
    saving, errors, scrollRef, fieldOffsets,
    clearError, hasErrors, getErrorCountText,
    user, refreshUser,
    dealerGracePeriod, subscriptionDaysLeft,
    about, setAbout,
    companyName, setCompanyName,
    companyDescription, setCompanyDescription,
    workingHours, setWorkingHours,
    showroomAddress, setShowroomAddress,
    showroomLat, setShowroomLat,
    showroomLng, setShowroomLng,
    website, setWebsite,
    branches, setBranches,
    editingBranchIdx, setEditingBranchIdx,
    branchWorkingHoursIdx, setBranchWorkingHoursIdx,
    activeBranchIdx, setActiveBranchIdx,
    showroomPhotos, setShowroomPhotos,
    uploadingLogo, uploadingCover, deletingLogo, deletingCover, uploadingShowroom,
    uploadingBranchPhoto,
    hasLogo, hasCover,
    showBankPicker, setShowBankPicker,
    showWarrantyPicker, setShowWarrantyPicker,
    showSpecPicker, setShowSpecPicker,
    showCreditTermsPicker, setShowCreditTermsPicker,
    showTradeInMaxAgePicker, setShowTradeInMaxAgePicker,
    showTradeInBonusPicker, setShowTradeInBonusPicker,
    makeDefaultBranch,
    validateDealerProfile,
    toggleSpecialization,
    getCreditTermsSummary,
    hasChanges,
    banksQuery, allBanks,
    toggleBank, getBankName,
    handlePickDealerImage, handleDeleteCover, handleDeleteLogo,
    handleAddShowroomPhotos, handleDeleteShowroomPhoto,
    handleAddBranchPhotos, handleDeleteBranchPhoto,
    onSave,
    t, language,
  };
}
