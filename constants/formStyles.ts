import { StyleSheet } from "react-native";

export const formStyles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden" as const,
    padding: 16,
    gap: 12,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
    marginBottom: 0,
  },
  selectField: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
  },
  selectFieldText: {
    flex: 1,
    fontSize: 15,
  },
  fieldColumn: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  textInput: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 15,
  },
  textInputSmall: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 15,
  },
  textInputMultiline: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: "top" as const,
  },
  switchRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingVertical: 4,
  },
  switchLabel: {
    fontSize: 15,
  },
  autoFillBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  scrollContent: {
    gap: 10,
    paddingTop: 8,
    paddingHorizontal: 12,
  },
});
