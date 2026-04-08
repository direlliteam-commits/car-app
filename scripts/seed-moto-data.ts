import { db } from "../server/db";
import { brands, models } from "../shared/schema";
import { eq, and, ilike } from "drizzle-orm";

interface BrandSeed {
  name: string;
  cyrillicName: string;
  country: string;
  category: string;
  models: ModelSeed[];
}

interface ModelSeed {
  name: string;
  class?: string;
}

const MOTO_BRANDS: BrandSeed[] = [
  {
    name: "Triumph",
    cyrillicName: "Триумф",
    country: "Великобритания",
    category: "foreign",
    models: [
      { name: "Street Triple", class: "naked" },
      { name: "Speed Triple", class: "naked" },
      { name: "Tiger 900", class: "adventure" },
      { name: "Tiger 1200", class: "adventure" },
      { name: "Tiger Sport 660", class: "sport_touring" },
      { name: "Trident 660", class: "naked" },
      { name: "Bonneville T120", class: "classic" },
      { name: "Bonneville T100", class: "classic" },
      { name: "Bonneville Bobber", class: "bobber" },
      { name: "Scrambler 900", class: "scrambler" },
      { name: "Scrambler 1200", class: "scrambler" },
      { name: "Speed 400", class: "naked" },
      { name: "Scrambler 400 X", class: "scrambler" },
      { name: "Rocket 3", class: "cruiser" },
      { name: "Thruxton RS", class: "cafe_racer" },
      { name: "Daytona 660", class: "sport" },
      { name: "Speed Twin 900", class: "classic" },
      { name: "Speed Twin 1200", class: "classic" },
      { name: "Street Scrambler", class: "scrambler" },
    ],
  },
  {
    name: "Aprilia",
    cyrillicName: "Априлия",
    country: "Италия",
    category: "foreign",
    models: [
      { name: "RSV4", class: "sport" },
      { name: "RSV4 Factory", class: "sport" },
      { name: "RS 660", class: "sport" },
      { name: "Tuono V4", class: "naked" },
      { name: "Tuono 660", class: "naked" },
      { name: "Tuareg 660", class: "adventure" },
      { name: "Dorsoduro 900", class: "supermoto" },
      { name: "Shiver 900", class: "naked" },
      { name: "SR GT 200", class: "scooter" },
      { name: "SXR 160", class: "scooter" },
      { name: "RS 457", class: "sport" },
    ],
  },
  {
    name: "Indian",
    cyrillicName: "Индиан",
    country: "США",
    category: "foreign",
    models: [
      { name: "Chief", class: "cruiser" },
      { name: "Chief Bobber", class: "bobber" },
      { name: "Chief Dark Horse", class: "cruiser" },
      { name: "Super Chief", class: "cruiser" },
      { name: "Scout", class: "cruiser" },
      { name: "Scout Bobber", class: "bobber" },
      { name: "Scout Rogue", class: "cruiser" },
      { name: "Challenger", class: "touring" },
      { name: "Pursuit", class: "touring" },
      { name: "Roadmaster", class: "touring" },
      { name: "Chieftain", class: "touring" },
      { name: "Springfield", class: "touring" },
      { name: "FTR", class: "naked" },
      { name: "FTR Rally", class: "scrambler" },
      { name: "FTR S", class: "naked" },
      { name: "101 Scout", class: "cruiser" },
    ],
  },
  {
    name: "Royal Enfield",
    cyrillicName: "Роял Энфилд",
    country: "Индия",
    category: "foreign",
    models: [
      { name: "Classic 350", class: "classic" },
      { name: "Bullet 350", class: "classic" },
      { name: "Meteor 350", class: "cruiser" },
      { name: "Hunter 350", class: "naked" },
      { name: "Himalayan 450", class: "adventure" },
      { name: "Guerrilla 450", class: "naked" },
      { name: "Interceptor 650", class: "classic" },
      { name: "Continental GT 650", class: "cafe_racer" },
      { name: "Super Meteor 650", class: "cruiser" },
      { name: "Shotgun 650", class: "bobber" },
      { name: "Scram 411", class: "adventure" },
      { name: "Bear 650", class: "scrambler" },
    ],
  },
  {
    name: "Husqvarna",
    cyrillicName: "Хускварна",
    country: "Австрия",
    category: "foreign",
    models: [
      { name: "Svartpilen 401", class: "naked" },
      { name: "Svartpilen 125", class: "naked" },
      { name: "Vitpilen 401", class: "cafe_racer" },
      { name: "Vitpilen 125", class: "cafe_racer" },
      { name: "Norden 901", class: "adventure" },
      { name: "701 Supermoto", class: "supermoto" },
      { name: "701 Enduro", class: "enduro" },
      { name: "FE 350", class: "enduro" },
      { name: "FE 501", class: "enduro" },
      { name: "TE 300i", class: "enduro" },
      { name: "FC 250", class: "motocross" },
      { name: "FC 450", class: "motocross" },
    ],
  },
  {
    name: "Benelli",
    cyrillicName: "Бенелли",
    country: "Италия",
    category: "foreign",
    models: [
      { name: "TNT 135", class: "naked" },
      { name: "302S", class: "naked" },
      { name: "Imperiale 400", class: "classic" },
      { name: "TRK 502", class: "adventure" },
      { name: "TRK 502X", class: "adventure" },
      { name: "Leoncino 500", class: "naked" },
      { name: "752S", class: "naked" },
      { name: "TRK 702", class: "adventure" },
      { name: "TRK 702X", class: "adventure" },
      { name: "502C", class: "cruiser" },
    ],
  },
  {
    name: "Bajaj",
    cyrillicName: "Баджадж",
    country: "Индия",
    category: "foreign",
    models: [
      { name: "Pulsar NS200", class: "naked" },
      { name: "Pulsar RS200", class: "sport" },
      { name: "Pulsar N250", class: "naked" },
      { name: "Pulsar F250", class: "sport" },
      { name: "Dominar 400", class: "sport_touring" },
      { name: "Dominar 250", class: "sport_touring" },
      { name: "Avenger 220 Cruise", class: "cruiser" },
      { name: "Avenger 160 Street", class: "cruiser" },
    ],
  },
  {
    name: "Lifan",
    cyrillicName: "Лифан",
    country: "Китай",
    category: "chinese",
    models: [
      { name: "KPV 150", class: "scooter" },
      { name: "KPS 250", class: "naked" },
      { name: "KPT 200", class: "adventure" },
      { name: "KP 200", class: "naked" },
      { name: "KP Mini", class: "minibike" },
      { name: "KPR 200", class: "sport" },
      { name: "LF250-D", class: "naked" },
    ],
  },
  {
    name: "Piaggio",
    cyrillicName: "Пьяджо",
    country: "Италия",
    category: "foreign",
    models: [
      { name: "Beverly 300", class: "scooter" },
      { name: "Beverly 400", class: "scooter" },
      { name: "Medley 150", class: "scooter" },
      { name: "MP3 500", class: "scooter" },
      { name: "Liberty 150", class: "scooter" },
    ],
  },
  {
    name: "Vespa",
    cyrillicName: "Веспа",
    country: "Италия",
    category: "foreign",
    models: [
      { name: "GTS 300", class: "scooter" },
      { name: "Sprint 150", class: "scooter" },
      { name: "Primavera 150", class: "scooter" },
      { name: "GTV 300", class: "scooter" },
      { name: "Elettrica", class: "scooter" },
    ],
  },
  {
    name: "MV Agusta",
    cyrillicName: "МВ Агуста",
    country: "Италия",
    category: "foreign",
    models: [
      { name: "F3 800", class: "sport" },
      { name: "Brutale 800", class: "naked" },
      { name: "Brutale 1000 RS", class: "naked" },
      { name: "Dragster 800", class: "naked" },
      { name: "Turismo Veloce", class: "sport_touring" },
      { name: "Superveloce 800", class: "sport" },
      { name: "Rush 1000", class: "naked" },
      { name: "Lucky Explorer 9.5", class: "adventure" },
    ],
  },
  {
    name: "CFMoto",
    cyrillicName: "СиЭфМото",
    country: "Китай",
    category: "chinese",
    models: [
      { name: "300NK", class: "naked" },
      { name: "300SR", class: "sport" },
      { name: "300SS", class: "sport" },
      { name: "450NK", class: "naked" },
      { name: "450SR", class: "sport" },
      { name: "650NK", class: "naked" },
      { name: "650GT", class: "sport_touring" },
      { name: "650MT", class: "adventure" },
      { name: "700CL-X", class: "classic" },
      { name: "700CL-X Sport", class: "cafe_racer" },
      { name: "800MT", class: "adventure" },
      { name: "CForce 600", class: "atv" },
      { name: "CForce 1000", class: "atv" },
      { name: "ZForce 950", class: "atv" },
    ],
  },
  {
    name: "Voge",
    cyrillicName: "Вогэ",
    country: "Китай",
    category: "chinese",
    models: [
      { name: "300R", class: "naked" },
      { name: "300RR", class: "sport" },
      { name: "300DS", class: "adventure" },
      { name: "500R", class: "naked" },
      { name: "500DS", class: "adventure" },
      { name: "525R", class: "naked" },
      { name: "525DSX", class: "adventure" },
      { name: "650DS", class: "adventure" },
      { name: "900DSX", class: "adventure" },
    ],
  },
  {
    name: "Zontes",
    cyrillicName: "Зонтес",
    country: "Китай",
    category: "chinese",
    models: [
      { name: "310R", class: "sport" },
      { name: "310T", class: "sport_touring" },
      { name: "310V", class: "cruiser" },
      { name: "310X", class: "adventure" },
      { name: "350D", class: "classic" },
      { name: "350E", class: "scrambler" },
      { name: "350GK", class: "sport_touring" },
    ],
  },
  {
    name: "Can-Am",
    cyrillicName: "Кан-Ам",
    country: "Канада",
    category: "foreign",
    models: [
      { name: "Ryker 600", class: "naked" },
      { name: "Ryker 900", class: "naked" },
      { name: "Spyder F3", class: "sport" },
      { name: "Spyder RT", class: "touring" },
      { name: "Pulse", class: "naked" },
      { name: "Origin", class: "adventure" },
      { name: "Outlander 700", class: "atv" },
      { name: "Outlander 1000R", class: "atv" },
      { name: "Renegade 1000R", class: "atv" },
    ],
  },
  {
    name: "Moto Guzzi",
    cyrillicName: "Мото Гуцци",
    country: "Италия",
    category: "foreign",
    models: [
      { name: "V7", class: "classic" },
      { name: "V85 TT", class: "adventure" },
      { name: "V100 Mandello", class: "sport_touring" },
      { name: "Stelvio", class: "adventure" },
      { name: "V9 Bobber", class: "bobber" },
      { name: "V9 Roamer", class: "classic" },
    ],
  },
  {
    name: "Polaris",
    cyrillicName: "Поларис",
    country: "США",
    category: "foreign",
    models: [
      { name: "Sportsman 570", class: "atv" },
      { name: "Sportsman 850", class: "atv" },
      { name: "Scrambler 850", class: "atv" },
      { name: "Scrambler 1000", class: "atv" },
      { name: "RZR XP 1000", class: "atv" },
      { name: "RZR Pro R", class: "atv" },
      { name: "Ranger XP 1000", class: "atv" },
      { name: "General 1000", class: "atv" },
      { name: "Outlaw 110", class: "atv" },
    ],
  },
  // Brands to ADD (not in database yet)
  {
    name: "GasGas",
    cyrillicName: "ГасГас",
    country: "Испания",
    category: "foreign",
    models: [
      { name: "MC 250F", class: "motocross" },
      { name: "MC 450F", class: "motocross" },
      { name: "EC 250", class: "enduro" },
      { name: "EC 350F", class: "enduro" },
      { name: "EX 250F", class: "enduro" },
      { name: "EX 350F", class: "enduro" },
      { name: "SM 700", class: "supermoto" },
      { name: "ES 700", class: "enduro" },
    ],
  },
  {
    name: "Beta",
    cyrillicName: "Бета",
    country: "Италия",
    category: "foreign",
    models: [
      { name: "RR 250", class: "enduro" },
      { name: "RR 300", class: "enduro" },
      { name: "RR 350", class: "enduro" },
      { name: "RR 390", class: "enduro" },
      { name: "RR 430", class: "enduro" },
      { name: "RR 480", class: "enduro" },
      { name: "Xtrainer 300", class: "enduro" },
      { name: "EVO 300", class: "trial" },
    ],
  },
  {
    name: "Zero",
    cyrillicName: "Зеро",
    country: "США",
    category: "foreign",
    models: [
      { name: "SR/F", class: "naked" },
      { name: "SR/S", class: "sport" },
      { name: "S", class: "naked" },
      { name: "DS", class: "adventure" },
      { name: "DSR/X", class: "adventure" },
      { name: "FX", class: "supermoto" },
      { name: "FXE", class: "supermoto" },
    ],
  },
  {
    name: "SYM",
    cyrillicName: "СИМ",
    country: "Тайвань",
    category: "foreign",
    models: [
      { name: "Maxsym TL 508", class: "scooter" },
      { name: "Cruisym 300", class: "scooter" },
      { name: "Joymax Z 300", class: "scooter" },
      { name: "NH T 200", class: "adventure" },
      { name: "Wolf 300", class: "naked" },
    ],
  },
  {
    name: "Kymco",
    cyrillicName: "Кимко",
    country: "Тайвань",
    category: "foreign",
    models: [
      { name: "AK 550", class: "scooter" },
      { name: "Downtown 350i", class: "scooter" },
      { name: "Like 200i", class: "scooter" },
      { name: "Agility City 125", class: "scooter" },
      { name: "X-Town CT 300i", class: "scooter" },
      { name: "MXU 700", class: "atv" },
      { name: "MXU 450i", class: "atv" },
    ],
  },
  {
    name: "Sherco",
    cyrillicName: "Шерко",
    country: "Франция",
    category: "foreign",
    models: [
      { name: "SE-R 250", class: "enduro" },
      { name: "SE-R 300", class: "enduro" },
      { name: "SEF-R 250", class: "enduro" },
      { name: "SEF-R 300", class: "enduro" },
      { name: "SEF-R 450", class: "enduro" },
      { name: "SEF-R 500", class: "enduro" },
      { name: "ST 300", class: "trial" },
    ],
  },
];

const ADDITIONAL_MODELS_FOR_EXISTING: Record<string, ModelSeed[]> = {
  Honda: [
    { name: "Monkey 125", class: "minibike" },
    { name: "Trail 125", class: "minibike" },
    { name: "Grom", class: "minibike" },
    { name: "Transalp 750", class: "adventure" },
    { name: "Shadow 750", class: "cruiser" },
    { name: "Fury", class: "cruiser" },
    { name: "CRF450R", class: "motocross" },
    { name: "CRF450X", class: "enduro" },
    { name: "CRF450L", class: "enduro" },
    { name: "CRF300 Rally", class: "adventure" },
    { name: "XR650L", class: "enduro" },
    { name: "Navi", class: "minibike" },
    { name: "ADV 160", class: "scooter" },
    { name: "Dio 110", class: "scooter" },
    { name: "Super Cub C125", class: "classic" },
    { name: "NT1100", class: "sport_touring" },
  ],
  Yamaha: [
    { name: "YZF-R7", class: "sport" },
    { name: "MT-03", class: "naked" },
    { name: "WR250F", class: "enduro" },
    { name: "WR450F", class: "enduro" },
    { name: "YZ250F", class: "motocross" },
    { name: "YZ450F", class: "motocross" },
    { name: "XT250", class: "enduro" },
    { name: "TW200", class: "enduro" },
    { name: "Bolt R-Spec", class: "cruiser" },
    { name: "V Star 250", class: "cruiser" },
    { name: "FJR1300", class: "sport_touring" },
    { name: "NMAX 155", class: "scooter" },
    { name: "Zuma 125", class: "scooter" },
    { name: "XSR700", class: "classic" },
    { name: "Fazer FZ-S", class: "naked" },
  ],
  Kawasaki: [
    { name: "Ninja ZX-4R", class: "sport" },
    { name: "Ninja 650", class: "sport" },
    { name: "Ninja 1000SX", class: "sport_touring" },
    { name: "Z400", class: "naked" },
    { name: "Z500", class: "naked" },
    { name: "Z800", class: "naked" },
    { name: "Eliminator", class: "cruiser" },
    { name: "Concours 14", class: "sport_touring" },
    { name: "KX250", class: "motocross" },
    { name: "KLX300", class: "enduro" },
    { name: "KLX300SM", class: "supermoto" },
    { name: "Versys 1000", class: "adventure" },
    { name: "Vulcan 900", class: "cruiser" },
    { name: "W800", class: "classic" },
    { name: "H2 SX", class: "sport_touring" },
    { name: "Ninja H2", class: "sport" },
  ],
  Suzuki: [
    { name: "GSX-8S", class: "naked" },
    { name: "GSX-8R", class: "sport" },
    { name: "GSX-S1000", class: "naked" },
    { name: "GSX-S1000GT", class: "sport_touring" },
    { name: "V-Strom 800DE", class: "adventure" },
    { name: "DR650S", class: "enduro" },
    { name: "DR-Z400S", class: "enduro" },
    { name: "DR-Z400SM", class: "supermoto" },
    { name: "RM-Z250", class: "motocross" },
    { name: "RM-Z450", class: "motocross" },
    { name: "Boulevard C50", class: "cruiser" },
    { name: "Boulevard M109R", class: "cruiser" },
    { name: "Boulevard S40", class: "cruiser" },
    { name: "Address 110", class: "scooter" },
  ],
  KTM: [
    { name: "1290 Super Duke R", class: "naked" },
    { name: "890 Adventure", class: "adventure" },
    { name: "690 SMC R", class: "supermoto" },
    { name: "690 Enduro R", class: "enduro" },
    { name: "500 EXC-F", class: "enduro" },
    { name: "450 SX-F", class: "motocross" },
    { name: "350 SX-F", class: "motocross" },
    { name: "250 SX-F", class: "motocross" },
    { name: "300 EXC TPI", class: "enduro" },
    { name: "250 Duke", class: "naked" },
    { name: "200 Duke", class: "naked" },
    { name: "125 Duke", class: "naked" },
    { name: "RC 125", class: "sport" },
    { name: "RC 200", class: "sport" },
    { name: "1290 Super Adventure S", class: "adventure" },
    { name: "790 Duke", class: "naked" },
    { name: "890 Duke R", class: "naked" },
  ],
  BMW: [
    { name: "R1300GS", class: "adventure" },
    { name: "R1250RT", class: "sport_touring" },
    { name: "K1600B", class: "touring" },
    { name: "K1600GTL", class: "touring" },
    { name: "S1000R", class: "naked" },
    { name: "S1000XR", class: "adventure" },
    { name: "F750GS", class: "adventure" },
    { name: "F900GS", class: "adventure" },
    { name: "R12", class: "cruiser" },
    { name: "R18", class: "cruiser" },
    { name: "R18 Transcontinental", class: "touring" },
    { name: "CE 04", class: "scooter" },
    { name: "G310GS", class: "adventure" },
    { name: "R nineT Scrambler", class: "scrambler" },
    { name: "R nineT Pure", class: "classic" },
    { name: "M1000RR", class: "sport" },
    { name: "C400X", class: "scooter" },
  ],
  Ducati: [
    { name: "Monster SP", class: "naked" },
    { name: "Multistrada V2", class: "adventure" },
    { name: "Hypermotard 698", class: "supermoto" },
    { name: "SuperSport 950", class: "sport" },
    { name: "XDiavel", class: "cruiser" },
    { name: "Panigale V2", class: "sport" },
    { name: "Scrambler Icon", class: "scrambler" },
    { name: "Scrambler Full Throttle", class: "scrambler" },
    { name: "Scrambler Nightshift", class: "scrambler" },
    { name: "Streetfighter V2", class: "naked" },
    { name: "Diavel V4", class: "cruiser" },
    { name: "Multistrada V4 Rally", class: "adventure" },
    { name: "Monster 937", class: "naked" },
  ],
  "Harley-Davidson": [
    { name: "Low Rider", class: "cruiser" },
    { name: "Low Rider S", class: "cruiser" },
    { name: "Low Rider ST", class: "sport_touring" },
    { name: "Heritage Classic", class: "cruiser" },
    { name: "Street Bob", class: "cruiser" },
    { name: "Nightster", class: "cruiser" },
    { name: "Forty-Eight", class: "cruiser" },
    { name: "Road Glide Special", class: "touring" },
    { name: "Street Glide Special", class: "touring" },
    { name: "Ultra Limited", class: "touring" },
    { name: "CVO Road Glide", class: "touring" },
    { name: "CVO Street Glide", class: "touring" },
    { name: "Tri Glide Ultra", class: "touring" },
    { name: "Freewheeler", class: "touring" },
    { name: "Electra Glide Highway King", class: "touring" },
    { name: "LiveWire", class: "naked" },
    { name: "X440", class: "cruiser" },
  ],
};

async function seedMotoData() {
  console.log("=== Seeding Moto Brands & Models ===\n");

  let totalBrandsInserted = 0;
  let totalModelsInserted = 0;
  let totalModelsSkipped = 0;

  for (const brandSeed of MOTO_BRANDS) {
    const existingBrands = await db
      .select()
      .from(brands)
      .where(
        and(
          ilike(brands.name, brandSeed.name),
          eq(brands.vehicleType, "moto")
        )
      );

    let brandId: number;

    if (existingBrands.length > 0) {
      brandId = existingBrands[0].id;
      console.log(`  Brand exists: ${brandSeed.name} (id: ${brandId})`);
    } else {
      const [created] = await db
        .insert(brands)
        .values({
          name: brandSeed.name,
          cyrillicName: brandSeed.cyrillicName,
          country: brandSeed.country,
          category: brandSeed.category,
          vehicleType: "moto",
          popular: false,
        })
        .returning();
      brandId = created.id;
      totalBrandsInserted++;
      console.log(`  Brand CREATED: ${brandSeed.name} (id: ${brandId})`);
    }

    const existingModels = await db
      .select()
      .from(models)
      .where(eq(models.brandId, brandId));

    const existingModelNames = new Set(
      existingModels.map((m) => m.name.toUpperCase())
    );

    const newModels = brandSeed.models.filter(
      (m) => !existingModelNames.has(m.name.toUpperCase())
    );

    if (newModels.length > 0) {
      await db.insert(models).values(
        newModels.map((m) => ({
          brandId,
          name: m.name,
          class: m.class || null,
        }))
      );
      totalModelsInserted += newModels.length;
      console.log(`    Added ${newModels.length} models for ${brandSeed.name}`);
    } else {
      totalModelsSkipped += brandSeed.models.length;
      console.log(
        `    All ${brandSeed.models.length} models already exist for ${brandSeed.name}`
      );
    }
  }

  console.log("\n--- Adding models to existing moto brands ---\n");

  for (const [brandName, modelSeeds] of Object.entries(
    ADDITIONAL_MODELS_FOR_EXISTING
  )) {
    const existingBrands = await db
      .select()
      .from(brands)
      .where(
        and(ilike(brands.name, brandName), eq(brands.vehicleType, "moto"))
      );

    if (existingBrands.length === 0) {
      console.log(`  Brand not found: ${brandName}, skipping`);
      continue;
    }

    const brandId = existingBrands[0].id;
    const existingModels = await db
      .select()
      .from(models)
      .where(eq(models.brandId, brandId));

    const existingModelNames = new Set(
      existingModels.map((m) => m.name.toUpperCase())
    );

    const newModels = modelSeeds.filter(
      (m) => !existingModelNames.has(m.name.toUpperCase())
    );

    if (newModels.length > 0) {
      await db.insert(models).values(
        newModels.map((m) => ({
          brandId,
          name: m.name,
          class: m.class || null,
        }))
      );
      totalModelsInserted += newModels.length;
      console.log(`  Added ${newModels.length} models to ${brandName}`);
    } else {
      console.log(`  All models already exist for ${brandName}`);
    }
  }

  console.log("\n=== Seed Complete ===");
  console.log(`Brands inserted: ${totalBrandsInserted}`);
  console.log(`Models inserted: ${totalModelsInserted}`);
  console.log(`Models skipped (already exist): ${totalModelsSkipped}`);
}

seedMotoData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
