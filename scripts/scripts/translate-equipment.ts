import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL!,
  },
});

const lang = process.argv[2] || "hy";

// Read the 92 missing equipment items (Russian labels)
const items: Record<string, string> = {
  "ac": "Кондиционер",
  "adaptive_cruise": "Адаптивный",
  "adaptive_headlights": "Адаптивные",
  "airbag_center": "Центральная",
  "airbag_driver_knee": "Коленей водителя",
  "airbag_front_side": "Боковые передние",
  "airbag_passenger_knee": "Коленей пассажира",
  "alloy_wheels": "Литые диски",
  "aluminum_trim": "Алюминиевые вставки",
  "ambient_lighting": "Подсветка салона",
  "armored_body": "Бронированный кузов",
  "auto_high_beam": "Автоматический дальний свет",
  "auto_parking": "Автоматическая парковка",
  "bang_olufsen": "Bang & Olufsen",
  "bose_audio": "Аудиосистема Bose",
  "brake_distribution_ebd": "Распределения тормозных усилий (BAS; EBD)",
  "burmester": "Burmester",
  "carbon_trim": "Карбоновые вставки",
  "climate_control": "Климат-контроль 1-зонный",
  "collision_prevention": "Предотвращения столкновения",
  "collision_warning": "Предупреждения о столкновении",
  "cornering_lights": "Подсветка поворотов",
  "cross_traffic_alert": "Контроль пересечения траектории",
  "dab_radio": "DAB радио",
  "digital_dashboard": "Электронная приборная панель",
  "drive_mode_selector": "Система выбора режима движения",
  "dual_climate": "Климат-контроль 2-зонный",
  "electric_seats_driver": "Электропривод сиденья водителя",
  "electric_seats_passenger": "Электропривод сиденья пассажира",
  "electrochromic_mirrors": "Электрохромные зеркала",
  "era_glonass": "ЭРА-ГЛОНАСС",
  "fatigue_sensor": "Датчик усталости водителя",
  "fog_lights": "Противотуманные фары",
  "folding_mirrors": "Складывание зеркал",
  "hands_free_trunk": "Открытие багажника без помощи рук",
  "harman_kardon": "Harman Kardon",
  "head_up_display": "Проекционный дисплей",
  "heated_mirrors": "Подогрев зеркал",
  "heated_seats_front": "Подогрев передних сидений",
  "heated_seats_rear": "Подогрев задних сидений",
  "heated_steering": "Подогрев руля",
  "hill_descent_control": "Контроль спуска с горы",
  "hill_start_assist": "Помощь при старте в гору",
  "jbl_audio": "JBL",
  "lane_departure_warning": "Предупреждения о выезде из полосы",
  "lane_keeping": "Удержания в полосе",
  "leather_steering": "Кожаный руль",
  "led_drl": "Дневные ходовые огни LED",
  "led_headlights": "Светодиодные (LED)",
  "led_taillights": "Задние фонари LED",
  "limiter": "Ограничитель скорости",
  "matrix_led": "Матричные LED",
  "memory_seats_driver": "Память сиденья водителя",
  "memory_seats_passenger": "Память сиденья пассажира",
  "multifunction_steering": "Мультифункциональное рулевое колесо",
  "panoramic_roof": "Панорамная крыша",
  "parking_camera_360": "Камера 360°",
  "parking_camera_front": "Камера переднего вида",
  "parking_camera_rear": "Камера заднего вида",
  "parking_sensors_360": "Парктроник 360°",
  "parking_sensors_front": "Парктроник передний",
  "parking_sensors_rear": "Парктроник задний",
  "power_trunk": "Электропривод крышки багажника",
  "power_windows_all": "Все",
  "power_windows_front": "Передние",
  "power_windows_rear": "Задние",
  "premium_audio": "Премиальная аудиосистема",
  "programmable_prestart": "Программируемый предпусковой подогреватель",
  "rear_climate": "Климат-контроль для задних пассажиров",
  "rear_door_lock": "Блокировка замков задних дверей",
  "rear_entertainment": "Мультимедиа для задних пассажиров",
  "remote_start": "Дистанционный запуск двигателя",
  "road_sign_recognition": "Распознавания дорожных знаков",
  "run_flat_tires": "Run Flat шины",
  "steering_electric": "С электроприводом",
  "steering_height": "По высоте",
  "steering_memory": "С памятью положения",
  "steering_reach": "По вылету",
  "steering_stabilization_vsm": "Стабилизации рулевого управления (VSM)",
  "sunroof": "Люк",
  "tinted_windows": "Тонировка стёкол",
  "tire_pressure_monitor": "Датчик давления в шинах",
  "traction_control_asr": "Антипробуксовочная (ASR)",
  "traffic_jam_assist": "Ассистент движения в пробке",
  "tri_zone_climate": "Климат-контроль 3-зонный",
  "usb_ports_front": "USB спереди",
  "usb_ports_rear": "USB сзади",
  "ventilated_seats_front": "Вентиляция передних сидений",
  "ventilated_seats_rear": "Вентиляция задних сидений",
  "wireless_charging": "Беспроводная зарядка",
  "wood_trim": "Деревянные вставки",
  "xenon_headlights": "Ксеноновые",
};

async function translateBatch(entries: [string, string][], targetLang: string): Promise<Record<string, string>> {
  const langName = targetLang === "hy" ? "Armenian" : "English";
  const formatted = entries.map(([k, v]) => `"${k}": "${v}"`).join("\n");
  
  const prompt = `Translate these car equipment feature names from Russian to ${langName}.
These are short labels for a car marketplace app. Keep brand names (Bang & Olufsen, Bose, Harman Kardon, JBL, Burmester) and technical abbreviations (LED, ABS, ASR, ESP, EBD, BAS, VSM, DAB, USB, Run Flat) unchanged.
For Armenian: use Armenian script, keep technical terms/abbreviations in Latin.
For English: use standard automotive terminology.

Context: These are equipment/feature checkboxes in a car listing.

Input (key: Russian label):
${formatted}

Output as valid JSON object with same keys and translated values. Return ONLY the JSON, no markdown.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const text = response.text?.trim() || "";
  // Remove markdown fences if present
  const clean = text.replace(/^```json?\n?/, "").replace(/\n?```$/, "").trim();
  return JSON.parse(clean);
}

async function main() {
  const entries = Object.entries(items);
  const batchSize = 30;
  const results: Record<string, string> = {};
  
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    console.log(`Translating batch ${Math.floor(i/batchSize)+1}/${Math.ceil(entries.length/batchSize)} (${batch.length} items) to ${lang}...`);
    try {
      const translated = await translateBatch(batch, lang);
      Object.assign(results, translated);
      console.log(`  Got ${Object.keys(translated).length} translations`);
    } catch (e: any) {
      console.error(`  Error: ${e.message}`);
      // Fallback: use Russian
      for (const [k, v] of batch) {
        results[k] = v;
      }
    }
  }
  
  // Output JSON
  console.log("\n=== TRANSLATIONS ===");
  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);
