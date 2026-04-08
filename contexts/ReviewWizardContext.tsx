import React, { createContext, useContext, ReactNode } from "react";
import type { useColors } from "@/constants/colors";
import type { WizardStep } from "@/hooks/useReviewWizardState";

export interface ReviewWizardContextValue {
  currentStep: WizardStep;
  activeSteps: WizardStep[];
  setCurrentStep: (step: WizardStep) => void;
  isDark: boolean;
  colors: ReturnType<typeof useColors>;
  bottomPadding: number;
  ownershipPeriod: string;
  setOwnershipPeriod: (v: string) => void;
  pros: string[];
  setPros: React.Dispatch<React.SetStateAction<string[]>>;
  prosCustom: string;
  setProsCustom: (v: string) => void;
  cons: string[];
  setCons: React.Dispatch<React.SetStateAction<string[]>>;
  consCustom: string;
  setConsCustom: (v: string) => void;
  ratings: Record<string, number>;
  handleSetRating: (category: string, value: number) => void;
  toggleTag: (tag: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => void;
  selectedBrand: string;
  selectedModel: string;
  selectedGeneration: string;
  filledCount: number;
  totalFields: number;
  averageRating: number;
  title: string;
  setTitle: (v: string) => void;
  content: string;
  setContent: (v: string) => void;
  imageUris: string[];
  uploading: boolean;
  pickImages: () => void;
  removeImage: (idx: number) => void;
  t: (key: string) => string;
}

const ReviewWizardCtx = createContext<ReviewWizardContextValue | null>(null);

export function ReviewWizardProvider({ value, children }: { value: ReviewWizardContextValue; children: ReactNode }) {
  return <ReviewWizardCtx.Provider value={value}>{children}</ReviewWizardCtx.Provider>;
}

export function useReviewWizardContext(): ReviewWizardContextValue {
  const ctx = useContext(ReviewWizardCtx);
  if (!ctx) throw new Error("useReviewWizardContext must be used within ReviewWizardProvider");
  return ctx;
}
