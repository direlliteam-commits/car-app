import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { AppIcons as I } from "@/constants/icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors, ColorScheme } from "@/constants/colors";
import { useCars } from "@/contexts/CarsContext";
import { EQUIPMENT_CATEGORIES } from "@/types/car";
import type { Car } from "@/types/car";
import { CategoryIcon } from "@/components/car-detail/EquipmentIcons";
import {
  formatEngineVolume,
  formatHorsepower,
  getFuelTypeLabel,
  getBodyTypeLabel,
  getTransmissionLabel,
  getDriveTypeLabel,
  getSteeringWheelLabel,
  getListingTitle,
  getColorLabel,
  getEquipmentCategory,
  getEquipmentLabel,
} from "@/lib/formatters";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { mapListingToCar } from "@/lib/mappers";
import { getBodyTypeImage } from "@/lib/body-type-images";
import { useTranslation, translate } from "@/lib/i18n";
import { CARD_RADIUS, CARD_PADDING, HEADER_CONTENT_PADDING_H, WEB_TOP_INSET } from "@/constants/layout";
import { API } from "@/lib/api-endpoints";

const EQUIPMENT_CATEGORY_KEYS: Record<string, string> = {
  safety: "equipment.categorySafety",
  assist: "equipment.categoryAssist",
  comfort: "equipment.categoryComfort",
  multimedia: "equipment.categoryMultimedia",
  interior: "equipment.categoryInterior",
  exterior: "equipment.categoryExterior",
  wheels: "equipment.categoryWheels",
};

function getCategoryLabel(cat: { id: string; label: string }): string {
  const key = EQUIPMENT_CATEGORY_KEYS[cat.id];
  if (key) {
    const translated = translate(key);
    if (translated !== key) return translated;
  }
  return cat.label;
}


function SpecLine({ label, value, colors }: { label: string; value: string; colors: ColorScheme }) {
  return (
    <View style={specLineStyles.row}>
      <Text style={[specLineStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[specLineStyles.value, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const specLineStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingVertical: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "400" as const,
    width: 110,
  },
  value: {
    fontSize: 14,
    fontWeight: "500" as const,
    flex: 1,
  },
});

export default function EquipmentScreen() {
  const { carId } = useLocalSearchParams<{ carId: string }>();
  const colorScheme = useAppColorScheme();
  const isDark = colorScheme === "dark";
  const colors = useColors(colorScheme);
  const insets = useSafeAreaInsets();
  const webTopInset = WEB_TOP_INSET;
  const { getCarById } = useCars();
  const { t } = useTranslation();

  const localCar = getCarById(carId || "");

  const listingQuery = useQuery<Car | null>({
    queryKey: [API.listings.list, carId, "equipment"],
    queryFn: async () => {
      try {
        const resp = await apiRequest("GET", API.listings.getById(carId));
        const data = await resp.json();
        return mapListingToCar(data);
      } catch {
        return null;
      }
    },
    enabled: !!carId && !localCar,
  });

  const car = localCar || listingQuery.data || undefined;
  const isLoading = !localCar && listingQuery.isLoading;
  const equipmentList = car?.equipment || [];

  const equipmentByCategory = React.useMemo(() => {
    const grouped: Record<string, string[]> = {};
    equipmentList.forEach((eq) => {
      const cat = getEquipmentCategory(eq);
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(eq);
    });
    return grouped;
  }, [equipmentList]);

  const categoriesWithData = EQUIPMENT_CATEGORIES.filter(
    (cat) => equipmentByCategory[cat.id] && equipmentByCategory[cat.id].length > 0
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + webTopInset + 8,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={() => { if (router.canGoBack()) router.back(); else router.replace("/(tabs)"); }}
          style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.6 : 1 }]}
          hitSlop={8}
        >
          <Ionicons name={I.back} size={28} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t("equipment.title")}</Text>
          {car && (
            <Text style={[styles.headerSubtitle, { color: colors.textTertiary }]} numberOfLines={1}>
              {getListingTitle(car)}
            </Text>
          )}
        </View>
        {car && (
          <View style={[styles.headerBadge, { backgroundColor: colors.accentBlue + "15" }]}>
            <Text style={[styles.headerBadgeText, { color: colors.accentBlue }]}>
              {equipmentList.length}
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingTop: 8, paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {car && (
          <View style={[styles.specsCard, { backgroundColor: isDark ? colors.surface : colors.background }]}>
            <Text style={[styles.specsTitle, { color: colors.text }]}>{t("equipment.specs")}</Text>
            {car.bodyType && (
              <View style={styles.bodyIconRow}>
                {car.vehicleType === "passenger" && getBodyTypeImage(car.bodyType) ? (
                  <Image
                    source={getBodyTypeImage(car.bodyType)!}
                    style={styles.bodyImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Image
                    source={{ uri: `${getApiUrl()}/body-types/${car.bodyType}.webp?v=5` }}
                    style={styles.bodyImage}
                    resizeMode="contain"
                  />
                )}
              </View>
            )}
            {car.year > 0 && <SpecLine label={t("equipment.yearLabel")} value={String(car.year)} colors={colors} />}
            {car.vehicleType === "passenger" && (
              <>
                <SpecLine label={t("equipment.body")} value={getBodyTypeLabel(car.bodyType)} colors={colors} />
                <SpecLine label={t("equipment.engine")} value={getFuelTypeLabel(car.fuelType)} colors={colors} />
                <SpecLine label={t("equipment.gearbox")} value={getTransmissionLabel(car.transmission)} colors={colors} />
                <SpecLine label={t("equipment.drive")} value={getDriveTypeLabel(car.driveType)} colors={colors} />
                {car.engineVolume > 0 && <SpecLine label={t("equipment.engineVolume")} value={formatEngineVolume(car.engineVolume)} colors={colors} />}
                {car.horsepower > 0 && <SpecLine label={t("equipment.power")} value={formatHorsepower(car.horsepower)} colors={colors} />}
                <SpecLine label={t("equipment.steering")} value={getSteeringWheelLabel(car.steeringWheel)} colors={colors} />
              </>
            )}
            {car.vehicleType === "truck" && (
              <>
                <SpecLine label={t("equipment.vehicleType")} value={getBodyTypeLabel(car.bodyType)} colors={colors} />
                {car.fuelType && car.fuelType !== "other" && <SpecLine label={t("equipment.engine")} value={getFuelTypeLabel(car.fuelType)} colors={colors} />}
                {car.transmission && car.transmission !== "other" && <SpecLine label={t("equipment.gearbox")} value={getTransmissionLabel(car.transmission)} colors={colors} />}
                {car.driveType && car.driveType !== "other" && <SpecLine label={t("equipment.drive")} value={getDriveTypeLabel(car.driveType)} colors={colors} />}
                {car.engineVolume > 0 && <SpecLine label={t("equipment.engineVolume")} value={formatEngineVolume(car.engineVolume)} colors={colors} />}
                {car.steeringWheel && <SpecLine label={t("equipment.steering")} value={getSteeringWheelLabel(car.steeringWheel)} colors={colors} />}
              </>
            )}
            {car.vehicleType === "moto" && (
              <>
                <SpecLine label={t("equipment.motoType")} value={getBodyTypeLabel(car.bodyType)} colors={colors} />
                {car.fuelType && car.fuelType !== "other" && <SpecLine label={t("equipment.engine")} value={getFuelTypeLabel(car.fuelType)} colors={colors} />}
                {car.transmission && car.transmission !== "other" && <SpecLine label={t("equipment.gearbox")} value={getTransmissionLabel(car.transmission)} colors={colors} />}
                {car.engineVolume > 0 && <SpecLine label={t("equipment.displacement")} value={formatEngineVolume(car.engineVolume, "moto")} colors={colors} />}
                {car.horsepower > 0 && <SpecLine label={t("equipment.power")} value={formatHorsepower(car.horsepower)} colors={colors} />}
              </>
            )}
            {car.vehicleType === "special" && (
              <>
                <SpecLine label={t("equipment.specialType")} value={getBodyTypeLabel(car.bodyType)} colors={colors} />
                {car.fuelType && car.fuelType !== "other" && <SpecLine label={t("equipment.engineType")} value={getFuelTypeLabel(car.fuelType)} colors={colors} />}
              </>
            )}
            {car.color && <SpecLine label={t("equipment.color")} value={getColorLabel(car.color)} colors={colors} />}
          </View>
        )}

        {categoriesWithData.map((cat, catIdx) => (
          <View key={cat.id}>
            <View
              style={[
                styles.categoryCard,
                { backgroundColor: isDark ? colors.surface : colors.background },
              ]}
            >
              <View style={styles.categoryHeader}>
                <CategoryIcon categoryId={cat.id} size={24} color={colors.primary} />
                <Text style={[styles.categoryTitle, { color: colors.text }]}>{getCategoryLabel(cat)}</Text>
                <View style={[styles.countBadge, { backgroundColor: colors.accentBlue + "15" }]}>
                  <Text style={[styles.countBadgeText, { color: colors.accentBlue }]}>
                    {equipmentByCategory[cat.id].length}
                  </Text>
                </View>
              </View>
              <View style={[styles.categoryDivider, { backgroundColor: colors.border }]} />
              <View style={styles.itemsList}>
                {equipmentByCategory[cat.id].map((eq, idx) => (
                  <View key={eq} style={styles.itemRow}>
                    <View style={[styles.checkIcon, { backgroundColor: colors.success }]}>
                      <Ionicons name={I.checkmark} size={10} color={colors.buttonPrimaryText} />
                    </View>
                    <Text style={[styles.itemText, { color: colors.text }]}>
                      {getEquipmentLabel(eq)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))}

        {isLoading && (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={colors.textTertiary} />
          </View>
        )}

        {!isLoading && equipmentList.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name={I.car} size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              {t("equipment.emptyEquipment")}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 12,
    paddingHorizontal: HEADER_CONTENT_PADDING_H,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "400" as const,
    marginTop: 2,
  },
  headerBadge: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: CARD_PADDING,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 8,
  },
  headerBadgeText: {
    fontSize: 14,
    fontWeight: "700" as const,
  },
  specsCard: {
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: CARD_RADIUS,
    padding: 16,
  },
  specsTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
    marginBottom: 4,
  },
  bodyIconRow: {
    alignItems: "center",
    marginBottom: 8,
  },
  bodyImage: {
    width: "100%" as any,
    height: 180,
  },
  vehicleTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    marginBottom: 4,
  },
  vehicleTypeLabel: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
  categoryCard: {
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: CARD_RADIUS,
    padding: 16,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: CARD_PADDING,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  categoryDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
  itemsList: {
    gap: 10,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: {
    fontSize: 15,
    fontWeight: "400" as const,
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "400" as const,
  },
});
