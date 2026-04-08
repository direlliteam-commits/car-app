import { useEffect, useRef } from "react";
import * as Haptics from "expo-haptics";

export function useAutoSkipEmptyStep(
  loading: boolean,
  dataLength: number,
  isActiveStep: boolean,
  hasParentId: boolean,
  onSkip: () => void,
) {
  const prevLoading = useRef(false);

  useEffect(() => {
    if (prevLoading.current && !loading && isActiveStep) {
      if (dataLength === 0 && hasParentId) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSkip();
      }
    }
    prevLoading.current = loading;
  }, [loading, dataLength, isActiveStep, hasParentId, onSkip]);
}
