import { translateRaw } from "./i18n";
import { CITY_TO_LOCATION_MAP, getRegionForCity, ARMENIAN_REGIONS } from "./armenian-regions";

const anyNameToCityId: Record<string, string> = {};
for (const [cityId, names] of Object.entries(CITY_TO_LOCATION_MAP)) {
  for (const n of names) {
    if (n) anyNameToCityId[n.toLowerCase()] = cityId;
  }
}

function resolveCityId(location: string): string | null {
  if (CITY_TO_LOCATION_MAP[location]) return location;
  const lower = location.toLowerCase();
  if (CITY_TO_LOCATION_MAP[lower]) return lower;
  return anyNameToCityId[lower] || null;
}

function getTranslatedCityName(cityId: string): string {
  const region = ARMENIAN_REGIONS.find(r => r.cities.some(c => c.id === cityId));
  if (region) {
    const city = region.cities.find(c => c.id === cityId);
    if (city) return city.name;
  }
  const names = CITY_TO_LOCATION_MAP[cityId];
  if (!names) return cityId;
  return names[0] || cityId;
}

export function getRegionCityLabel(location: string | null | undefined, language: string): string {
  if (!location) return "";
  const cityId = resolveCityId(location);
  if (!cityId) return translateLocation(location, language);
  const region = getRegionForCity(cityId);
  const cityName = getTranslatedCityName(cityId);
  if (!region) return cityName;
  if (region.id === "yerevan") {
    const yerevanName = region.name;
    if (cityId === "yerevan") return yerevanName;
    return `${yerevanName}, ${cityName}`;
  }
  const regionName = region.name;
  return `${regionName}, ${cityName}`;
}

export function formatLocationPill(cityIds: string[]): string {
  if (!cityIds || cityIds.length === 0) return "";

  const regionGroups: Record<string, string[]> = {};
  for (const cityId of cityIds) {
    const region = getRegionForCity(cityId);
    const regionId = region?.id || "unknown";
    if (!regionGroups[regionId]) regionGroups[regionId] = [];
    regionGroups[regionId].push(cityId);
  }

  const parts: string[] = [];
  for (const [regionId, cities] of Object.entries(regionGroups)) {
    const region = ARMENIAN_REGIONS.find(r => r.id === regionId);
    if (!region) {
      parts.push(...cities.map(c => getTranslatedCityName(c)));
      continue;
    }
    const totalCitiesInRegion = region.cities.length;
    const selectedCount = cities.length;

    if (selectedCount === totalCitiesInRegion) {
      parts.push(region.name);
    } else if (selectedCount === 1) {
      parts.push(`${region.name}, ${getTranslatedCityName(cities[0])}`);
    } else {
      const firstName = getTranslatedCityName(cities[0]);
      const rest = selectedCount - 1;
      parts.push(`${region.name}, ${firstName} +${rest}`);
    }
  }
  return parts.join("; ");
}

export function formatListingLocation(
  location: string | null | undefined,
  language: string,
  opts?: { showroomAddress?: string | null; isDealer?: boolean }
): string {
  if (!location) return "";
  const cityId = resolveCityId(location);
  if (!cityId) {
    const translated = translateLocation(location, language);
    if (opts?.isDealer && opts?.showroomAddress) {
      return `${translated}, ${opts.showroomAddress}`;
    }
    return translated;
  }

  const region = getRegionForCity(cityId);
  const cityName = getTranslatedCityName(cityId);

  let base: string;
  if (!region) {
    base = cityName;
  } else if (region.id === "yerevan") {
    if (cityId === "yerevan") {
      base = region.name;
    } else {
      base = `${region.name}, ${cityName}`;
    }
  } else {
    base = `${region.name}, ${cityName}`;
  }

  if (opts?.isDealer && opts?.showroomAddress) {
    return `${base}, ${opts.showroomAddress}`;
  }
  return base;
}

const RU_CITIES_DICT = [
  "\u0415\u0440\u0435\u0432\u0430\u043D",
  "\u0413\u044E\u043C\u0440\u0438",
  "\u0412\u0430\u043D\u0430\u0434\u0437\u043E\u0440",
  "\u0412\u0430\u0433\u0430\u0440\u0448\u0430\u043F\u0430\u0442 (\u042D\u0447\u043C\u0438\u0430\u0434\u0437\u0438\u043D)",
  "\u0410\u0431\u043E\u0432\u044F\u043D",
  "\u041A\u0430\u043F\u0430\u043D",
  "\u0420\u0430\u0437\u0434\u0430\u043D",
  "\u0410\u0440\u043C\u0430\u0432\u0438\u0440",
  "\u0410\u0440\u0442\u0430\u0448\u0430\u0442",
  "\u0413\u0430\u0432\u0430\u0440",
  "\u0418\u0434\u0436\u0435\u0432\u0430\u043D",
  "\u0413\u043E\u0440\u0438\u0441",
  "\u0427\u0430\u0440\u0435\u043D\u0446\u0430\u0432\u0430\u043D",
  "\u0421\u0435\u0432\u0430\u043D",
  "\u0410\u0448\u0442\u0430\u0440\u0430\u043A",
  "\u041C\u0430\u0441\u0438\u0441",
  "\u0410\u0440\u0442\u0438\u043A",
  "\u0421\u0438\u0441\u0438\u0430\u043D",
  "\u0414\u0438\u043B\u0438\u0436\u0430\u043D",
  "\u0415\u0445\u0435\u0433\u043D\u0430\u0434\u0437\u043E\u0440",
  "\u0421\u0442\u0435\u043F\u0430\u043D\u0430\u0432\u0430\u043D",
  "\u0421\u043F\u0438\u0442\u0430\u043A",
  "\u041C\u0430\u0440\u0442\u0443\u043D\u0438",
  "\u0411\u0435\u0440\u0434",
  "\u0412\u0430\u0440\u0434\u0435\u043D\u0438\u0441",
  "\u0422\u0430\u0448\u0438\u0440",
  "\u0410\u043B\u0430\u0432\u0435\u0440\u0434\u0438",
  "\u041C\u0435\u0433\u0440\u0430\u0434\u0437\u043E\u0440",
  "\u041D\u043E\u0440-\u0410\u0447\u0438\u043D",
];

const EN_EXTRA: Record<string, string> = {
  "\u0410\u0440\u0430\u0440\u0430\u0442": "Ararat",
  "\u0410\u0440\u0435\u043D\u0438": "Areni",
  "\u0414\u0436\u0435\u0440\u043C\u0443\u043A": "Jermuk",
  "\u0422\u0430\u0442\u0435\u0432": "Tatev",
  "\u042D\u0447\u043C\u0438\u0430\u0434\u0437\u0438\u043D": "Vagharshapat",
  "\u0412\u0430\u0433\u0430\u0440\u0448\u0430\u043F\u0430\u0442": "Vagharshapat",
};

const AM_EXTRA: Record<string, string> = {
  "\u0410\u0440\u0430\u0440\u0430\u0442": "\u0531\u0580\u0561\u0580\u0561\u057F",
  "\u0410\u0440\u0435\u043D\u0438": "\u0531\u0580\u0565\u0576\u056B",
  "\u0414\u0436\u0435\u0440\u043C\u0443\u043A": "\u054B\u0565\u0580\u0574\u0578\u0582\u056F",
  "\u0422\u0430\u0442\u0435\u0432": "\u054F\u0561\u0569\u0587",
  "\u042D\u0447\u043C\u0438\u0430\u0434\u0437\u0438\u043D": "\u0537\u057B\u0574\u056B\u0561\u056E\u056B\u0576",
  "\u0412\u0430\u0433\u0430\u0440\u0448\u0561\u043F\u0430\u0442": "\u054E\u0561\u0572\u0561\u0580\u0577\u0561\u057A\u0561\u057F",
};

function getDictIndex(ruCity: string): number {
  const exact = RU_CITIES_DICT.indexOf(ruCity);
  if (exact !== -1) return exact;
  const simplified = ruCity.split(" (")[0];
  return RU_CITIES_DICT.findIndex(
    c => c === simplified || c.split(" (")[0] === simplified
  );
}

function getCitiesArray(): string[] {
  try {
    const arr = translateRaw("dealerRequest.armenianCities");
    if (Array.isArray(arr)) return arr as string[];
  } catch {
    // fall through
  }
  return [];
}

export function translateLocation(ruCity: string | null | undefined, language: string): string {
  if (!ruCity) return "";
  if (language === "ru") return ruCity;

  const idx = getDictIndex(ruCity);
  if (idx !== -1) {
    const arr = getCitiesArray();
    if (arr[idx]) return arr[idx];
  }

  if (language === "en") {
    const extra = EN_EXTRA[ruCity];
    if (extra) return extra;
  }
  if (language === "hy" || language === "am") {
    const extra = AM_EXTRA[ruCity];
    if (extra) return extra;
  }

  return ruCity;
}

const SCHEDULE_RU_TO_HY: [RegExp, string][] = [
  [/Ежедневно/gi, "\u0531\u0574\u0565\u0576 \u0585\u0580"],
  [/Пн/g, "\u0535\u0580\u056F"],
  [/Вт/g, "\u0535\u0580\u0584"],
  [/Ср/g, "\u0549\u0578\u0580"],
  [/Чт/g, "\u0540\u0576\u0563"],
  [/Пт/g, "\u0548\u0582\u0580\u0562"],
  [/Сб/g, "\u0547\u0561\u0562"],
  [/Вс/g, "\u053F\u056B\u0580"],
];

const SCHEDULE_RU_TO_EN: [RegExp, string][] = [
  [/Ежедневно/gi, "Daily"],
  [/Пн/g, "Mon"],
  [/Вт/g, "Tue"],
  [/Ср/g, "Wed"],
  [/Чт/g, "Thu"],
  [/Пт/g, "Fri"],
  [/Сб/g, "Sat"],
  [/Вс/g, "Sun"],
];

export function translateWorkingHours(text: string | null | undefined, language: string): string {
  if (!text) return "";
  if (language === "ru") return text;
  const table = language === "en" ? SCHEDULE_RU_TO_EN : SCHEDULE_RU_TO_HY;
  let result = text;
  for (const [pattern, replacement] of table) {
    result = result.replace(pattern, replacement);
  }
  return result;
}
