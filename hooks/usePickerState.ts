import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Platform, Keyboard } from "react-native";

export function usePickerState() {
  const [activePicker, setActivePickerRaw] = useState<string | null>(null);
  const pickerHasInputRef = useRef(false);

  const pickersWithInput = useMemo(() => new Set(["engineVolume", "horsepower", "vehicleCascade", "location"]), []);

  const setActivePicker = useCallback((picker: string | null) => {
    if (picker !== null) {
      pickerHasInputRef.current = pickersWithInput.has(picker);
      Keyboard.dismiss();
    } else {
      pickerHasInputRef.current = false;
    }
    setActivePickerRaw(picker);
  }, [pickersWithInput]);

  useEffect(() => {
    if (Platform.OS === "web") return;
    const sub = Keyboard.addListener("keyboardDidShow", () => {
      if (!pickerHasInputRef.current) {
        setActivePickerRaw(null);
      }
    });
    return () => sub.remove();
  }, []);

  return { activePicker, setActivePicker };
}
