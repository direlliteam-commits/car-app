import { sql } from "drizzle-orm";
import { pgTable, text, integer, boolean, timestamp, serial, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  name: text("name").notNull(),
  cyrillicName: text("cyrillic_name"),
  country: text("country"),
  category: text("category"),
  vehicleType: text("vehicle_type").default("passenger").notNull(),
  popular: boolean("popular").default(false).notNull(),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const models = pgTable("models", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  brandId: integer("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  cyrillicName: text("cyrillic_name"),
  class: text("class"),
  yearFrom: integer("year_from"),
  yearTo: integer("year_to"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const generations = pgTable("generations", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  modelId: integer("model_id").notNull().references(() => models.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  yearFrom: integer("year_from"),
  yearTo: integer("year_to"),
  restyling: boolean("restyling").default(false).notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const configurations = pgTable("configurations", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  generationId: integer("generation_id").references(() => generations.id, { onDelete: "cascade" }),
  modelId: integer("model_id").references(() => models.id, { onDelete: "cascade" }),
  brandId: integer("brand_id").references(() => brands.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  bodyType: text("body_type"),
  doorsCount: integer("doors_count"),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const modifications = pgTable("modifications", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  configurationId: integer("configuration_id").references(() => configurations.id, { onDelete: "cascade" }),
  generationId: integer("generation_id").references(() => generations.id, { onDelete: "cascade" }),
  modelId: integer("model_id").references(() => models.id, { onDelete: "cascade" }),
  brandId: integer("brand_id").references(() => brands.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  horsePower: integer("horse_power"),
  engineCapacity: real("engine_capacity"),
  engineType: text("engine_type"),
  transmissionCode: text("transmission_code"),
  drive: text("drive"),
  acceleration: real("acceleration"),
  maxSpeed: integer("max_speed"),
  fuelConsumptionCity: real("fuel_consumption_city"),
  fuelConsumptionHighway: real("fuel_consumption_highway"),
  fuelConsumptionMixed: real("fuel_consumption_mixed"),
  length: integer("length"),
  width: integer("width"),
  height: integer("height"),
  wheelBase: integer("wheel_base"),
  clearance: integer("clearance"),
  weight: integer("weight"),
  fullWeight: integer("full_weight"),
  trunkMinCapacity: integer("trunk_min_capacity"),
  trunkMaxCapacity: integer("trunk_max_capacity"),
  fuelTankCapacity: integer("fuel_tank_capacity"),
  seats: text("seats"),
  cylinders: integer("cylinders"),
  volume: integer("volume"),
  moment: integer("moment"),
  gearCount: integer("gear_count"),
  petrolType: text("petrol_type"),
  safetyGrade: integer("safety_grade"),
  safetyRating: text("safety_rating"),
  wheelSize: text("wheel_size"),
  frontBrake: text("front_brake"),
  backBrake: text("back_brake"),
  frontSuspension: text("front_suspension"),
  backSuspension: text("back_suspension"),
  kvtPower: real("kvt_power"),
  momentRpm: integer("moment_rpm"),
  rpmPower: integer("rpm_power"),
  cylindersOrder: text("cylinders_order"),
  valves: integer("valves"),
  engineFeeding: text("engine_feeding"),
  compression: real("compression"),
  diameter: real("diameter"),
  pistonStroke: real("piston_stroke"),
  emissionEuroClass: text("emission_euro_class"),
  fuelEmission: real("fuel_emission"),
  frontWheelBase: integer("front_wheel_base"),
  backWheelBase: integer("back_wheel_base"),
  electricRange: integer("electric_range"),
  batteryCapacity: real("battery_capacity"),
  chargeTime: real("charge_time"),
  fullChargeTime: real("full_charge_time"),
  quickChargeTime: real("quick_charge_time"),
  steeringWheel: text("steering_wheel"),
  countryOrigin: text("country_origin"),
  autoClass: text("auto_class"),
  valvetrain: text("valvetrain"),
  engineCode: text("engine_code"),
  originTiresSize: text("origin_tires_size"),
  landingWheelsSize: text("landing_wheels_size"),
  diskSize: text("disk_size"),
  bodySize: text("body_size"),
  evBatteryType: text("ev_battery_type"),
  chargingPortTypes: text("charging_port_types"),
  consumptionKwt: real("consumption_kwt"),
  quickchargeDescription: text("quickcharge_description"),
  engineOrder: text("engine_order"),
  feeding: text("feeding"),
  groupName: text("group_name"),
  isClosed: integer("is_closed"),
  options: jsonb("options").$type<Record<string, number>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBrandSchema = createInsertSchema(brands).omit({ id: true, createdAt: true });
export const insertModelSchema = createInsertSchema(models).omit({ id: true, createdAt: true });
export const insertGenerationSchema = createInsertSchema(generations).omit({ id: true, createdAt: true });

export type Brand = typeof brands.$inferSelect;
export type InsertBrand = typeof insertBrandSchema._type;

export type Model = typeof models.$inferSelect;
export type InsertModel = typeof insertModelSchema._type;

export type Generation = typeof generations.$inferSelect;
export type InsertGeneration = typeof insertGenerationSchema._type;

export type Configuration = typeof configurations.$inferSelect;
export type Modification = typeof modifications.$inferSelect;
