import { translate } from "@/lib/i18n";

export interface ArmenianCity {
  id: string;
  get name(): string;
}

export interface ArmenianRegion {
  id: string;
  get name(): string;
  cities: ArmenianCity[];
}

const _city = (id: string): ArmenianCity => ({
  id,
  get name() { return translate(`armenianCities.${id}` as any); },
});

const _region = (id: string, cityIds: string[]): ArmenianRegion => ({
  id,
  get name() { return translate(`armenianRegions.${id}` as any); },
  cities: cityIds.map(_city),
});

export const ARMENIAN_REGIONS: ArmenianRegion[] = [
  _region("yerevan", ["kentron", "ajapnyak", "arabkir", "avan", "davtashen", "erebuni", "kanaker_zeytun", "malatia_sebastia", "nor_nork", "nork_marash", "nubarashen", "shengavit"]),
  _region("aragatsotn", ["ashtarak", "aparan", "talin", "byurakan"]),
  _region("ararat", ["artashat", "ararat_city", "masis", "vedi"]),
  _region("armavir", ["armavir", "vagharshapat", "metsamor"]),
  _region("gegharkunik", ["gavar", "sevan", "martuni", "vardenys", "chambarak"]),
  _region("lori", ["vanadzor", "spitak", "stepanavan", "alaverdi", "tashir"]),
  _region("kotayk", ["abovian", "razdan", "charentsavan", "hrazdan", "tsaghkadzor", "byureghavan"]),
  _region("shirak", ["gyumri", "artik", "maralik"]),
  _region("syunik", ["kapan", "goris", "sisyan", "meghri", "kajaran"]),
  _region("vayotsDzor", ["yeghegnadzor", "jermuk", "vayk"]),
  _region("tavush", ["ijevan", "dilijan", "berd", "noyemberyan"]),
];

export const YEREVAN_DISTRICT_IDS = [
  "kentron", "ajapnyak", "arabkir", "avan", "davtashen", "erebuni",
  "kanaker_zeytun", "malatia_sebastia", "nor_nork", "nork_marash", "nubarashen", "shengavit",
];

export function isYerevanDistrict(cityId: string): boolean {
  return YEREVAN_DISTRICT_IDS.includes(cityId);
}

export function cityIdMatchesYerevan(cityId: string): boolean {
  return cityId === "yerevan" || isYerevanDistrict(cityId);
}

export const CITY_TO_LOCATION_MAP: Record<string, string[]> = {
  yerevan: ["\u0415\u0440\u0435\u0432\u0430\u043D", "Yerevan", "\u0535\u0580\u0587\u0561\u0576"],
  kentron: ["\u041A\u0435\u043D\u0442\u0440\u043E\u043D", "Kentron", "\u053F\u0565\u0576\u057F\u0580\u0578\u0576", "\u0415\u0440\u0435\u0432\u0430\u043D", "Yerevan", "\u0535\u0580\u0587\u0561\u0576"],
  ajapnyak: ["\u0410\u0434\u0436\u0430\u043F\u043D\u044F\u043A", "Ajapnyak", "\u0531\u057B\u0561\u057A\u0576\u0575\u0561\u056F", "\u0415\u0440\u0435\u0432\u0430\u043D", "Yerevan", "\u0535\u0580\u0587\u0561\u0576"],
  arabkir: ["\u0410\u0440\u0430\u0431\u043A\u0438\u0440", "Arabkir", "\u0531\u0580\u0561\u0562\u056F\u056B\u0580", "\u0415\u0440\u0435\u0432\u0430\u043D", "Yerevan", "\u0535\u0580\u0587\u0561\u0576"],
  avan: ["\u0410\u0432\u0430\u043D", "Avan", "\u0531\u057E\u0561\u0576", "\u0415\u0440\u0435\u0432\u0430\u043D", "Yerevan", "\u0535\u0580\u0587\u0561\u0576"],
  davtashen: ["\u0414\u0430\u0432\u0442\u0430\u0448\u0435\u043D", "Davtashen", "\u0534\u0561\u057E\u0569\u0561\u0577\u0565\u0576", "\u0415\u0440\u0435\u0432\u0430\u043D", "Yerevan", "\u0535\u0580\u0587\u0561\u0576"],
  erebuni: ["\u042D\u0440\u0435\u0431\u0443\u043D\u0438", "Erebuni", "\u0537\u0580\u0565\u0562\u0578\u0582\u0576\u056B", "\u0415\u0440\u0435\u0432\u0430\u043D", "Yerevan", "\u0535\u0580\u0587\u0561\u0576"],
  kanaker_zeytun: ["\u041A\u0430\u043D\u0430\u043A\u0435\u0440-\u0417\u0435\u0439\u0442\u0443\u043D", "Kanaker-Zeytun", "\u0554\u0561\u0576\u0561\u0584\u0565\u057C-\u0536\u0565\u0575\u0569\u0578\u0582\u0576", "\u0415\u0440\u0435\u0432\u0430\u043D", "Yerevan", "\u0535\u0580\u0587\u0561\u0576"],
  malatia_sebastia: ["\u041C\u0430\u043B\u0430\u0442\u0438\u044F-\u0421\u0435\u0431\u0430\u0441\u0442\u0438\u044F", "Malatia-Sebastia", "\u0544\u0561\u056C\u0561\u0569\u056B\u0561-\u054D\u0565\u0562\u0561\u057D\u057F\u056B\u0561", "\u0415\u0440\u0435\u0432\u0430\u043D", "Yerevan", "\u0535\u0580\u0587\u0561\u0576"],
  nor_nork: ["\u041D\u043E\u0440 \u041D\u043E\u0440\u043A", "Nor Nork", "\u0546\u0578\u0580 \u0546\u0578\u0580\u0584", "\u0415\u0440\u0435\u0432\u0430\u043D", "Yerevan", "\u0535\u0580\u0587\u0561\u0576"],
  nork_marash: ["\u041D\u043E\u0440\u043A-\u041C\u0430\u0440\u0430\u0448", "Nork-Marash", "\u0546\u0578\u0580\u0584-\u0544\u0561\u0580\u0561\u0577", "\u0415\u0440\u0435\u0432\u0430\u043D", "Yerevan", "\u0535\u0580\u0587\u0561\u0576"],
  nubarashen: ["\u041D\u0443\u0431\u0430\u0440\u0430\u0448\u0435\u043D", "Nubarashen", "\u0546\u0578\u0582\u0562\u0561\u0580\u0561\u0577\u0565\u0576", "\u0415\u0440\u0435\u0432\u0430\u043D", "Yerevan", "\u0535\u0580\u0587\u0561\u0576"],
  shengavit: ["\u0428\u0435\u043D\u0433\u0430\u0432\u0438\u0442", "Shengavit", "\u0547\u0565\u0576\u0563\u0561\u057E\u056B\u0569", "\u0415\u0440\u0435\u0432\u0430\u043D", "Yerevan", "\u0535\u0580\u0587\u0561\u0576"],
  ashtarak: ["\u0410\u0448\u0442\u0430\u0440\u0430\u043A", "Ashtarak", "\u0531\u0577\u057F\u0561\u0580\u0561\u056F"],
  aparan: ["\u0410\u043F\u0430\u0440\u0430\u043D", "Aparan", "\u0531\u057A\u0561\u0580\u0561\u0576"],
  talin: ["\u0422\u0430\u043B\u0438\u043D", "Talin", "\u0539\u0561\u056C\u056B\u0576"],
  byurakan: ["\u0411\u044E\u0440\u0430\u043A\u0430\u043D", "Byurakan", "\u0532\u0575\u0578\u0582\u0580\u0561\u056F\u0561\u0576"],
  artashat: ["\u0410\u0440\u0442\u0430\u0448\u0430\u0442", "Artashat", "\u0531\u0580\u057F\u0561\u0577\u0561\u057F"],
  ararat_city: ["\u0410\u0440\u0430\u0440\u0430\u0442", "Ararat", "\u0531\u0580\u0561\u0580\u0561\u057F"],
  masis: ["\u041C\u0430\u0441\u0438\u0441", "Masis", "\u0544\u0561\u057D\u056B\u057D"],
  vedi: ["\u0412\u0435\u0434\u0438", "Vedi", "\u054E\u0565\u0564\u056B"],
  armavir: ["\u0410\u0440\u043C\u0430\u0432\u0438\u0440", "Armavir", "\u0531\u0580\u0574\u0561\u057E\u056B\u0580"],
  vagharshapat: ["\u0412\u0430\u0433\u0430\u0440\u0448\u0430\u043F\u0430\u0442", "Vagharshapat", "\u054E\u0561\u0572\u0561\u0580\u0577\u0561\u057A\u0561\u057F", "\u042D\u0447\u043C\u0438\u0430\u0434\u0437\u0438\u043D", "Echmiadzin"],
  metsamor: ["\u041C\u0435\u0446\u0430\u043C\u043E\u0440", "Metsamor", "\u0544\u0565\u056E\u0561\u0574\u0578\u0580"],
  gavar: ["\u0413\u0430\u0432\u0430\u0440", "Gavar", "\u0533\u0561\u057E\u0561\u057C"],
  sevan: ["\u0421\u0435\u0432\u0430\u043D", "Sevan", "\u054D\u0587\u0561\u0576"],
  martuni: ["\u041C\u0430\u0440\u0442\u0443\u043D\u0438", "Martuni", "\u0544\u0561\u0580\u057F\u0578\u0582\u0576\u056B"],
  vardenys: ["\u0412\u0430\u0440\u0434\u0435\u043D\u0438\u0441", "Vardenys", "\u054E\u0561\u0580\u0564\u0565\u0576\u056B\u057D"],
  chambarak: ["\u0427\u0430\u043C\u0431\u0430\u0440\u0430\u043A", "Chambarak", "\u0549\u0561\u0574\u0562\u0561\u0580\u0561\u056F"],
  vanadzor: ["\u0412\u0430\u043D\u0430\u0434\u0437\u043E\u0440", "Vanadzor", "\u054E\u0561\u0576\u0561\u0571\u0578\u0580"],
  spitak: ["\u0421\u043F\u0438\u0442\u0430\u043A", "Spitak", "\u054D\u057A\u056B\u057F\u0561\u056F"],
  stepanavan: ["\u0421\u0442\u0435\u043F\u0430\u043D\u0430\u0432\u0430\u043D", "Stepanavan", "\u054D\u057F\u0565\u057A\u0561\u0576\u0561\u057E\u0561\u0576"],
  alaverdi: ["\u0410\u043B\u0430\u0432\u0435\u0440\u0434\u0438", "Alaverdi", "\u0531\u056C\u0561\u057E\u0565\u0580\u0564\u056B"],
  tashir: ["\u0422\u0430\u0448\u0438\u0440", "Tashir", "\u054F\u0561\u0577\u056B\u0580"],
  abovian: ["\u0410\u0431\u043E\u0432\u044F\u043D", "Abovian", "\u0531\u0562\u0578\u057E\u0575\u0561\u0576"],
  razdan: ["\u0420\u0430\u0437\u0434\u0430\u043D", "Razdan", "\u0540\u0580\u0561\u0566\u0564\u0561\u0576"],
  charentsavan: ["\u0427\u0430\u0440\u0435\u043D\u0446\u0430\u0432\u0430\u043D", "Charentsavan", "\u0549\u0561\u0580\u0565\u0576\u0581\u0561\u057E\u0561\u0576"],
  hrazdan: ["\u0420\u0430\u0437\u0434\u0430\u043D", "Hrazdan", "\u0540\u0580\u0561\u0566\u0564\u0561\u0576"],
  tsaghkadzor: ["\u0426\u0430\u0445\u043A\u0430\u0434\u0437\u043E\u0440", "Tsaghkadzor", "\u053E\u0561\u0572\u056F\u0561\u0571\u0578\u0580"],
  byureghavan: ["\u0411\u044E\u0440\u0435\u0433\u0430\u0432\u0430\u043D", "Byureghavan", "\u0532\u0575\u0578\u0582\u0580\u0565\u0572\u0561\u057E\u0561\u0576"],
  gyumri: ["\u0413\u044E\u043C\u0440\u0438", "Gyumri", "\u0533\u0575\u0578\u0582\u0574\u0580\u056B"],
  artik: ["\u0410\u0440\u0442\u0438\u043A", "Artik", "\u0531\u0580\u057F\u056B\u056F"],
  maralik: ["\u041C\u0430\u0440\u0430\u043B\u0438\u043A", "Maralik", "\u0544\u0561\u0580\u0561\u056C\u056B\u056F"],
  kapan: ["\u041A\u0430\u043F\u0430\u043D", "Kapan", "\u053F\u0561\u057A\u0561\u0576"],
  goris: ["\u0413\u043E\u0440\u0438\u0441", "Goris", "\u0533\u0578\u0580\u056B\u057D"],
  sisyan: ["\u0421\u0438\u0441\u0438\u0430\u043D", "Sisyan", "\u054D\u056B\u057D\u056B\u0561\u0576"],
  meghri: ["\u041C\u0435\u0433\u0440\u0438", "Meghri", "\u0544\u0565\u0572\u0580\u056B"],
  kajaran: ["\u041A\u0430\u0434\u0436\u0430\u0440\u0430\u043D", "Kajaran", "\u053F\u0561\u057B\u0561\u0580\u0561\u0576"],
  yeghegnadzor: ["\u0415\u0445\u0435\u0433\u043D\u0430\u0434\u0437\u043E\u0440", "Yeghegnadzor", "\u0535\u0572\u0565\u0563\u0576\u0561\u0571\u0578\u0580"],
  jermuk: ["\u0414\u0436\u0435\u0440\u043C\u0443\u043A", "Jermuk", "\u054B\u0565\u0580\u0574\u0578\u0582\u056F"],
  vayk: ["\u0412\u0430\u0439\u043A", "Vayk", "\u054E\u0561\u0575\u0584"],
  ijevan: ["\u0418\u0434\u0436\u0435\u0432\u0430\u043D", "Ijevan", "\u053B\u057B\u0587\u0561\u0576"],
  dilijan: ["\u0414\u0438\u043B\u0438\u0436\u0430\u043D", "Dilijan", "\u0534\u056B\u056C\u056B\u057B\u0561\u0576"],
  berd: ["\u0411\u0435\u0440\u0434", "Berd", "\u0532\u0565\u0580\u0564"],
  noyemberyan: ["\u041D\u043E\u0435\u043C\u0431\u0435\u0440\u044F\u043D", "Noyemberyan", "\u0546\u0578\u0575\u0565\u0574\u0562\u0565\u0580\u0575\u0561\u0576"],
};

export function getLocationValuesForCities(cityIds: string[]): string[] {
  const locations: string[] = [];
  for (const cityId of cityIds) {
    if (cityId === "yerevan") {
      locations.push(...(CITY_TO_LOCATION_MAP["yerevan"] || []));
      for (const districtId of YEREVAN_DISTRICT_IDS) {
        const mappings = CITY_TO_LOCATION_MAP[districtId];
        if (mappings) locations.push(...mappings);
      }
    } else {
      const mappings = CITY_TO_LOCATION_MAP[cityId];
      if (mappings) locations.push(...mappings);
    }
  }
  return [...new Set(locations)];
}

export function getRegionForCity(cityId: string): ArmenianRegion | undefined {
  return ARMENIAN_REGIONS.find(r => r.cities.some(c => c.id === cityId));
}

export function getAllCityIdsForRegion(regionId: string): string[] {
  const region = ARMENIAN_REGIONS.find(r => r.id === regionId);
  return region ? region.cities.map(c => c.id) : [];
}
