import React, { useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { StatusBar } from "expo-status-bar";
import { AppIcons as I } from "@/constants/icons";

import { useColors } from "@/constants/colors";
import { CARD_GAP } from "@/constants/layout";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useTranslation } from "@/lib/i18n";
import { VehicleCascadePicker } from "@/components/filters/VehicleCascadePicker";
import { VehicleCascadeProvider } from "@/contexts/VehicleCascadeContext";
import { FilterPickerModals } from "@/components/filters/FilterPickerModals";
import { NonPassengerCascadePicker } from "@/components/filters/NonPassengerCascadePicker";

import { useFilterFormState } from "@/hooks/useFilterFormState";
import { FilterFormFields } from "@/components/filters/FilterFormFields";
import { FilterAdditionalSection } from "@/components/filters/FilterAdditionalSection";
import { FilterBottomBar, FilterSaveSearchSection } from "@/components/filters/FilterBottomBar";

export default function FiltersScreen() {
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const isDark = colorScheme === "dark";
  const { t } = useTranslation();

  const state = useFilterFormState();

  const pageBg = isDark ? colors.background : colors.surface;
  const headerBg = isDark ? colors.surface : colors.background;
  const cardBg = isDark ? colors.surface : colors.background;

  const filtersCascadeValue = useMemo(() => ({
    cascadeField: state.pickerField,
    filteredBrands: state.filteredBrands,
    filteredModels: state.filteredModels,
    cascadeGenerations: state.pickerGenerations,
    brandSearch: state.brandSearch, setBrandSearch: state.setBrandSearch,
    modelSearch: state.modelSearch, setModelSearch: state.setModelSearch,
    brandCategory: state.brandCategory, setBrandCategory: state.setBrandCategory,
    vehicleType: state.localFilters.vehicleType,
    brandsLoading: state.brandsLoading, modelsLoading: state.modelsLoading,
    generationsLoading: state.generationsLoading,
    configurationsLoading: false as const, modificationsLoading: false as const,
    onSelectBrand: (brand: { id: number; name: string }) => {
      state.setBrandSearch("");
      state.setBrandCategory("all");
      state.updateVehicleField(state.editingSelectionIndex, "brand", { brand: brand.name, brandId: brand.id });
    },
    onSelectModel: (model: { id: number; name: string }) => {
      state.setModelSearch("");
      state.updateVehicleField(state.editingSelectionIndex, "model", { model: model.name, modelId: model.id });
    },
    onSelectGeneration: (gen: { id: number; name: string; yearFrom?: number | null; yearTo?: number | null }) => {
      state.updateVehicleField(state.editingSelectionIndex, "generation", { generation: gen.name });
    },
    onManualModelSubmit: (model: string) => {
      state.updateVehicleField(state.editingSelectionIndex, "model", { model });
      state.closeFilterCascade();
    },
    onBack: () => {
      if (state.pickerField === "generation") {
        state.setPickerModelId(null);
        state.setPickerField("model");
      } else if (state.pickerField === "model" || state.pickerField === "manualModel") {
        state.setPickerBrandId(null);
        state.setPickerField("brand");
        state.setModelSearch("");
      }
    },
    colors, isDark,
    selectedBrandName: state.localFilters.vehicleSelections?.[state.editingSelectionIndex]?.brand,
    selectedModelName: state.localFilters.vehicleSelections?.[state.editingSelectionIndex]?.model,
    currentFilterParams: state.cascadeFilterParams,
  }), [
    state.pickerField, state.filteredBrands, state.filteredModels, state.pickerGenerations,
    state.brandSearch, state.setBrandSearch, state.modelSearch, state.setModelSearch,
    state.brandCategory, state.setBrandCategory, state.localFilters.vehicleType,
    state.brandsLoading, state.modelsLoading, state.generationsLoading,
    state.editingSelectionIndex, state.updateVehicleField, state.closeFilterCascade,
    state.setPickerModelId, state.setPickerField, state.setPickerBrandId,
    state.localFilters.vehicleSelections, state.cascadeFilterParams,
    colors, isDark,
  ]);

  return (
    <View style={[s.container, { backgroundColor: pageBg }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScreenHeader
        title={t("filters.title")}
        backgroundColor={headerBg}
        borderBottom
        borderColor={colors.divider}
        paddingBottom={8}
        rightActions={[{ icon: I.sync as any, onPress: state.handleClear }]}
      />

      <ScrollView
        ref={state.scrollViewRef}
        style={s.scrollView}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <FilterFormFields
          localFilters={state.localFilters}
          updateFilter={state.updateFilter}
          setActivePicker={state.setActivePicker}
          colors={colors}
          isDark={isDark}
          cardBg={cardBg}
          vis={state.vis}
          labels={{
            price: state.priceLabel, year: state.yearLabel, mileage: state.mileageLabel,
            body: state.bodyLabel, transmission: state.transmissionLabel, fuel: state.fuelLabel,
            availability: state.availabilityLabel, location: state.locationLabel,
            derivedCategory: state.derivedCategoryLabel, derivedBodyType: state.derivedBodyTypeLabels,
          }}
          isNonPassengerType={state.isNonPassengerType}
          actions={{
            addNewVehicleSelection: state.addNewVehicleSelection, openFieldPicker: state.openFieldPicker,
            clearVehicleField: state.clearVehicleField, openPurposePicker: state.openPurposePicker,
            openBodyTypePicker: state.openBodyTypePicker, handleClearPurpose: state.handleClearPurpose,
            handleClearBodyTypeNarrowing: state.handleClearBodyTypeNarrowing,
          }}
        />

        <FilterAdditionalSection
          localFilters={state.localFilters}
          updateFilter={state.updateFilter}
          setActivePicker={state.setActivePicker}
          colors={colors}
          isDark={isDark}
          cardBg={cardBg}
          vis={state.vis}
          additionalExpanded={state.additionalExpanded}
          setAdditionalExpanded={state.setAdditionalExpanded}
          scrollViewRef={state.scrollViewRef}
          additionalSectionY={state.additionalSectionY}
          engineLabel={state.engineLabel}
          driveLabel={state.driveLabel}
          horsepowerLabel={state.horsepowerLabel}
          steeringLabel={state.steeringLabel}
          sellerLabel={state.sellerLabel}
          truckFields={state.truckFields}
          specialEquipmentFields={state.specialEquipmentFields}
          motoFields={state.motoFields}
          getSpecialFieldLabel={state.getSpecialFieldLabel}
        />

        <FilterSaveSearchSection
          colors={colors}
          cardBg={cardBg}
          setActivePicker={state.setActivePicker}
        />

        <View style={{ height: 120 }} />
      </ScrollView>

      <FilterBottomBar
        colors={colors}
        pageBg={pageBg}
        cardBg={cardBg}
        displayCount={state.displayCount}
        isCountFetching={state.isCountFetching}
        handleApply={state.handleApply}
        activePicker={state.activePicker}
        setActivePicker={state.setActivePicker}
        searchName={state.searchName}
        setSearchName={state.setSearchName}
        searchNotifications={state.searchNotifications}
        setSearchNotifications={state.setSearchNotifications}
        handleSaveSearch={state.handleSaveSearch}
      />

      {state.activePicker === "vehicleCascade" && (
        <VehicleCascadeProvider value={filtersCascadeValue}>
          <VehicleCascadePicker
            visible={true}
            onClose={() => { state.resetPicker(); state.setActivePicker(null); }}
            onApply={() => { state.resetPicker(); state.setActivePicker(null); }}
          />
        </VehicleCascadeProvider>
      )}

      {state.isNonPassengerType && (
        <NonPassengerCascadePicker
          visible={state.activePicker === "bodyType"}
          onClose={() => {
            state.setActivePicker(null);
          }}
          vehicleType={state.localFilters.vehicleType || "special"}
          colors={colors}
          isDark={isDark}
          selectedBodyTypes={state.localFilters.bodyTypes}
          selectedCategoryValue={state.selectedNonPassengerCategory}
          onToggleBodyType={state.handleBodyTypeToggle}
          onSelectCategory={state.handleCategorySelect}
          onComplete={() => {
            state.setActivePicker(null);
          }}
          initialStep={state.cascadeInitialStep}
          currentFilterParams={state.cascadeFilterParams}
        />
      )}

      <FilterPickerModals
        activePicker={state.activePicker}
        setActivePicker={state.setActivePicker}
        localFilters={state.localFilters}
        updateFilter={state.updateFilter}
        colors={colors}
        resultCount={state.displayCount}
        isCountLoading={state.isCountFetching}
        vehicleType={state.localFilters.vehicleType}
        onSpecialBodyTypeChange={state.handleSpecialBodyTypeChange}
        onDraftChange={state.setDraftOverrides}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: CARD_GAP,
    paddingTop: 0,
    paddingHorizontal: 0,
  },
});
