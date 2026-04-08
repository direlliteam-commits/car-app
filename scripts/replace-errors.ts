import * as fs from "fs";
import * as path from "path";

const ERROR_MAP: Record<string, string> = {
  "Не авторизован": "ERROR_CODES.AUTH_REQUIRED",
  "Требуется авторизация": "ERROR_CODES.AUTH_REQUIRED",
  "Токен не предоставлен": "ERROR_CODES.TOKEN_NOT_PROVIDED",
  "Токен не указан": "ERROR_CODES.TOKEN_NOT_PROVIDED",
  "Невалидный токен Google": "ERROR_CODES.GOOGLE_AUTH_INVALID_TOKEN",
  "Пользователь не найден": "ERROR_CODES.USER_NOT_FOUND",
  "Администратор не найден": "ERROR_CODES.ADMIN_NOT_FOUND",
  "Доступ запрещён": "ERROR_CODES.ACCESS_DENIED",
  "Только для дилеров": "ERROR_CODES.DEALERS_ONLY",
  "Доступно только для дилеров": "ERROR_CODES.DEALERS_ONLY",
  "Вы не являетесь дилером": "ERROR_CODES.NOT_DEALER",
  "Недопустимая роль": "ERROR_CODES.INVALID_ROLE",
  "Некорректная роль": "ERROR_CODES.INVALID_ROLE",
  "Нельзя изменить свою роль": "ERROR_CODES.CANNOT_CHANGE_OWN_ROLE",
  "Нельзя менять свою роль": "ERROR_CODES.CANNOT_CHANGE_OWN_ROLE",
  "Только суперадмин может менять роли": "ERROR_CODES.SUPERADMIN_REQUIRED",
  "Указанный пользователь не является администратором": "ERROR_CODES.NOT_ADMIN",
  "Слишком частые подключения. Повторите через секунду.": "ERROR_CODES.RATE_LIMIT_SSE",

  "Некорректные данные": "ERROR_CODES.INVALID_DATA",
  "Некорректный ID": "ERROR_CODES.INVALID_ID",
  "Неверный ID": "ERROR_CODES.INVALID_ID",
  "Некорректный ID бренда": "ERROR_CODES.INVALID_BRAND_ID",
  "Некорректный ID марки": "ERROR_CODES.INVALID_BRAND_ID",
  "Некорректный ID модели": "ERROR_CODES.INVALID_MODEL_ID",
  "Некорректный ID поколения": "ERROR_CODES.INVALID_GENERATION_ID",
  "Некорректный ID конфигурации": "ERROR_CODES.INVALID_CONFIGURATION_ID",
  "Некорректный ID модификации": "ERROR_CODES.INVALID_MODIFICATION_ID",
  "Некорректный ID пользователя": "ERROR_CODES.INVALID_USER_ID",
  "Некорректный статус": "ERROR_CODES.INVALID_STATUS",
  "Недопустимый статус": "ERROR_CODES.INVALID_STATUS",
  "Некорректный интервал": "ERROR_CODES.INVALID_INTERVAL",
  "Некорректная цена": "ERROR_CODES.INVALID_PRICE",
  "Некорректные данные объявления": "ERROR_CODES.INVALID_LISTING_DATA",
  "Неверный индекс": "ERROR_CODES.INVALID_INDEX",
  "Сумма должна быть ненулевым целым числом": "ERROR_CODES.AMOUNT_MUST_BE_NONZERO_INT",
  "Длительность должна быть положительным числом": "ERROR_CODES.DURATION_MUST_BE_POSITIVE",
  "Лимит объявлений должен быть положительным числом": "ERROR_CODES.LISTING_LIMIT_MUST_BE_POSITIVE",
  "Поле name обязательно": "ERROR_CODES.NAME_REQUIRED",
  "Код, название и положительная цена обязательны": "ERROR_CODES.CODE_NAME_PRICE_REQUIRED",
  "Поля code, name и priceAmd обязательны": "ERROR_CODES.CODE_NAME_PRICE_REQUIRED",
  "Поля name и vehicleType обязательны": "ERROR_CODES.NAME_VEHICLE_TYPE_REQUIRED",
  "Заголовок и текст обязательны": "ERROR_CODES.TITLE_TEXT_REQUIRED",
  "Необходим параметр brand": "ERROR_CODES.BRAND_REQUIRED",
  "Необходимы параметры brand и model": "ERROR_CODES.BRAND_MODEL_REQUIRED",
  "Введите сообщение": "ERROR_CODES.MESSAGE_REQUIRED",
  "Необходимо указать объявление или пользователя": "ERROR_CODES.SPECIFY_LISTING_OR_USER",
  'Укажите autoRenew: true/false': "ERROR_CODES.SPECIFY_AUTO_RENEW",
  "Укажите индекс фото": "ERROR_CODES.SPECIFY_PHOTO_INDEX",
  "Укажите причину корректировки": "ERROR_CODES.SPECIFY_ADJUSTMENT_REASON",
  "Укажите тарифный план": "ERROR_CODES.SPECIFY_TARIFF_PLAN",
  "Нет данных для обновления": "ERROR_CODES.NO_UPDATE_DATA",

  "Объявление не найдено": "ERROR_CODES.LISTING_NOT_FOUND",
  "Объявление не найдено или нет доступа": "ERROR_CODES.LISTING_NOT_FOUND_OR_NO_ACCESS",
  "Объявление не найдено, нет доступа или не является активным": "ERROR_CODES.LISTING_NOT_FOUND_OR_NOT_ACTIVE",
  "Объявление на паузе после поднятия": "ERROR_CODES.LISTING_BUMPED_COOLDOWN",
  "Бренд не найден": "ERROR_CODES.BRAND_NOT_FOUND",
  "Модель не найдена": "ERROR_CODES.MODEL_NOT_FOUND",
  "Модификация не найдена": "ERROR_CODES.MODIFICATION_NOT_FOUND",
  "Пакет не найден": "ERROR_CODES.PACKAGE_NOT_FOUND",
  "Тариф не найден": "ERROR_CODES.PLAN_NOT_FOUND",
  "Тариф не найден или деактивирован": "ERROR_CODES.PLAN_NOT_FOUND_OR_DEACTIVATED",
  "Тарифный план не найден или деактивирован": "ERROR_CODES.PLAN_NOT_FOUND_OR_DEACTIVATED",
  "Поиск не найден": "ERROR_CODES.SEARCH_NOT_FOUND",
  "Оповещение не найдено": "ERROR_CODES.ALERT_NOT_FOUND",
  "Отзыв не найден": "ERROR_CODES.REVIEW_NOT_FOUND",
  "Жалоба не найдена": "ERROR_CODES.REPORT_NOT_FOUND",
  "Чат не найден": "ERROR_CODES.CHAT_NOT_FOUND",
  "Тикет не найден": "ERROR_CODES.TICKET_NOT_FOUND",
  "Обращение не найдено": "ERROR_CODES.TICKET_NOT_FOUND",
  "Заявка не найдена": "ERROR_CODES.REQUEST_NOT_FOUND",
  "Уведомление не найдено": "ERROR_CODES.NOTIFICATION_NOT_FOUND",
  "Блокировка не найдена": "ERROR_CODES.BLOCK_NOT_FOUND",
  "Заявка не одобрена": "ERROR_CODES.REQUEST_NOT_APPROVED",

  "Недостаточно средств": "ERROR_CODES.INSUFFICIENT_FUNDS",
  "Вы уже являетесь дилером": "ERROR_CODES.ALREADY_DEALER",
  "Вы уже на этом тарифе. Используйте продление.": "ERROR_CODES.ALREADY_ON_THIS_PLAN",
  "У вас уже есть активная заявка на рассмотрении": "ERROR_CODES.ACTIVE_REQUEST_PENDING",
  "Нельзя заблокировать самого себя": "ERROR_CODES.CANNOT_BLOCK_SELF",
  "Невозможно отправить сообщение": "ERROR_CODES.CANNOT_SEND_MESSAGE",
  "Нет активной подписки": "ERROR_CODES.NO_ACTIVE_SUBSCRIPTION",
  "Нет активной подписки для продления": "ERROR_CODES.NO_ACTIVE_SUBSCRIPTION_TO_RENEW",
  "Нет доступа к статистике": "ERROR_CODES.NO_STATS_ACCESS",
  "Сначала выберите тарифный план": "ERROR_CODES.SELECT_PLAN_FIRST",
  "Бесплатное обновление ещё не доступно": "ERROR_CODES.FREE_BUMP_NOT_AVAILABLE",
  "Нельзя удалить активный пакет. Сначала деактивируйте его.": "ERROR_CODES.CANNOT_DELETE_ACTIVE_PACKAGE",
  "Нельзя удалить пакет — есть действующие продвижения с этим пакетом. Дождитесь их завершения.": "ERROR_CODES.CANNOT_DELETE_PACKAGE_IN_USE",
  "Максимум 10 фото шоурума": "ERROR_CODES.MAX_SHOWROOM_PHOTOS",
  "Превышен лимит жалоб. Попробуйте позже.": "ERROR_CODES.REPORT_LIMIT_EXCEEDED",
  "Расширенная аналитика недоступна в вашем тарифе": "ERROR_CODES.ADVANCED_ANALYTICS_UNAVAILABLE",
  "Тикет уже назначен другому оператору": "ERROR_CODES.TICKET_ASSIGNED_TO_OTHER",
  "Операторы не могут переназначать тикеты": "ERROR_CODES.OPERATORS_CANNOT_REASSIGN",
  "Ошибка авторизации через Google": "ERROR_CODES.ERROR_GOOGLE_AUTH",

  "Файл не загружен": "ERROR_CODES.FILE_NOT_UPLOADED",
  "Файлы не загружены": "ERROR_CODES.FILES_NOT_UPLOADED",
  "Фото не загружено": "ERROR_CODES.PHOTO_NOT_UPLOADED",
  "Видео не загружено": "ERROR_CODES.VIDEO_NOT_UPLOADED",

  "Ошибка": "ERROR_CODES.SERVER_ERROR",
  "Ошибка входа": "ERROR_CODES.ERROR_LOGIN",
  "Ошибка регистрации": "ERROR_CODES.ERROR_REGISTER",
  "Ошибка выхода": "ERROR_CODES.ERROR_LOGOUT",
  "Ошибка обновления профиля": "ERROR_CODES.ERROR_PROFILE_UPDATE",
  "Ошибка смены пароля": "ERROR_CODES.ERROR_PASSWORD_CHANGE",
  "Ошибка сброса пароля": "ERROR_CODES.ERROR_PASSWORD_RESET",
  "Ошибка отправки кода восстановления": "ERROR_CODES.ERROR_SEND_RESET_CODE",
  "Ошибка удаления аккаунта": "ERROR_CODES.ERROR_ACCOUNT_DELETE",
  "Ошибка загрузки аватара": "ERROR_CODES.ERROR_AVATAR_UPLOAD",
  "Ошибка регистрации токена": "ERROR_CODES.ERROR_TOKEN_REGISTER",
  "Ошибка удаления токена": "ERROR_CODES.ERROR_TOKEN_DELETE",
  "Ошибка получения профиля": "ERROR_CODES.ERROR_GET_PROFILE",
  "Ошибка получения данных пользователя": "ERROR_CODES.ERROR_GET_USER_DATA",
  "Ошибка получения лимитов": "ERROR_CODES.ERROR_GET_LIMITS",

  "Ошибка создания объявления": "ERROR_CODES.ERROR_CREATE_LISTING",
  "Ошибка обновления объявления": "ERROR_CODES.ERROR_UPDATE_LISTING",
  "Ошибка удаления объявления": "ERROR_CODES.ERROR_DELETE_LISTING",
  "Ошибка получения объявления": "ERROR_CODES.ERROR_GET_LISTING",
  "Ошибка получения объявлений": "ERROR_CODES.ERROR_GET_LISTINGS",
  "Ошибка подсчёта объявлений": "ERROR_CODES.ERROR_LISTING_COUNT",
  "Ошибка получения похожих объявлений": "ERROR_CODES.ERROR_GET_SIMILAR",
  "Ошибка получения рекомендаций": "ERROR_CODES.ERROR_GET_RECOMMENDATIONS",
  "Ошибка получения секций каталога": "ERROR_CODES.ERROR_GET_CATALOG_SECTIONS",
  "Ошибка получения историй": "ERROR_CODES.ERROR_GET_STORIES",
  "Ошибка получения статистики объявлений": "ERROR_CODES.ERROR_LISTING_STATS",
  "Ошибка получения статистики продавца": "ERROR_CODES.ERROR_SELLER_STATS",
  "Ошибка получения истории цен": "ERROR_CODES.ERROR_PRICE_HISTORY",
  "Ошибка получения истории просмотров": "ERROR_CODES.ERROR_VIEW_HISTORY",
  "Ошибка статистики рынка": "ERROR_CODES.ERROR_MARKET_STATS",

  "Ошибка получения избранного": "ERROR_CODES.ERROR_GET_FAVORITES",
  "Ошибка обновления избранного": "ERROR_CODES.ERROR_UPDATE_FAVORITES",
  "Ошибка сохранения поиска": "ERROR_CODES.ERROR_SAVE_SEARCH",
  "Ошибка получения сохранённых поисков": "ERROR_CODES.ERROR_GET_SAVED_SEARCHES",
  "Ошибка удаления поиска": "ERROR_CODES.ERROR_DELETE_SEARCH",
  "Ошибка создания оповещения": "ERROR_CODES.ERROR_CREATE_ALERT",
  "Ошибка получения оповещений о ценах": "ERROR_CODES.ERROR_GET_ALERTS",
  "Ошибка получения оповещения": "ERROR_CODES.ERROR_GET_ALERT",
  "Ошибка обновления оповещения": "ERROR_CODES.ERROR_UPDATE_ALERT",
  "Ошибка удаления оповещения": "ERROR_CODES.ERROR_DELETE_ALERT",
  "Ошибка создания отзыва": "ERROR_CODES.ERROR_CREATE_REVIEW",
  "Ошибка получения отзывов": "ERROR_CODES.ERROR_GET_REVIEWS",
  "Ошибка удаления отзыва": "ERROR_CODES.ERROR_DELETE_REVIEW",

  "Ошибка получения чатов": "ERROR_CODES.ERROR_GET_CHATS",
  "Ошибка получения чата": "ERROR_CODES.ERROR_GET_CHAT",
  "Ошибка создания чата": "ERROR_CODES.ERROR_CREATE_CHAT",
  "Ошибка получения сообщений": "ERROR_CODES.ERROR_GET_MESSAGES",
  "Ошибка отправки сообщения": "ERROR_CODES.ERROR_SEND_MESSAGE",
  "Ошибка отправки изображения": "ERROR_CODES.ERROR_SEND_IMAGE",
  "Ошибка отправки": "ERROR_CODES.ERROR_SEND_MESSAGE",

  "Ошибка получения уведомлений": "ERROR_CODES.ERROR_GET_NOTIFICATIONS",
  "Ошибка подсчёта уведомлений": "ERROR_CODES.ERROR_NOTIFICATION_COUNT",
  "Ошибка обновления уведомления": "ERROR_CODES.ERROR_UPDATE_NOTIFICATION",
  "Ошибка обновления уведомлений": "ERROR_CODES.ERROR_UPDATE_NOTIFICATIONS",

  "Ошибка получения баланса": "ERROR_CODES.ERROR_GET_BALANCE",
  "Ошибка пополнения кошелька": "ERROR_CODES.ERROR_WALLET_TOPUP",
  "Ошибка получения транзакций": "ERROR_CODES.ERROR_GET_TRANSACTIONS",
  "Ошибка загрузки истории транзакций": "ERROR_CODES.ERROR_GET_TRANSACTIONS",
  "Ошибка корректировки баланса": "ERROR_CODES.ERROR_BALANCE_ADJUST",

  "Ошибка загрузки пакетов": "ERROR_CODES.ERROR_GET_PACKAGES",
  "Ошибка получения пакетов продвижения": "ERROR_CODES.ERROR_GET_PACKAGES",
  "Ошибка создания пакета": "ERROR_CODES.ERROR_CREATE_PACKAGE",
  "Ошибка обновления пакета": "ERROR_CODES.ERROR_UPDATE_PACKAGE",
  "Ошибка удаления пакета": "ERROR_CODES.ERROR_DELETE_PACKAGE",
  "Ошибка при покупке продвижения": "ERROR_CODES.ERROR_BUY_PROMOTION",
  "Ошибка получения продвижений": "ERROR_CODES.ERROR_GET_PROMOTIONS",
  "Ошибка загрузки продвижений": "ERROR_CODES.ERROR_GET_PROMOTIONS",
  "Ошибка загрузки активных продвижений": "ERROR_CODES.ERROR_GET_ACTIVE_PROMOTIONS",
  "Ошибка деактивации продвижения": "ERROR_CODES.ERROR_DEACTIVATE_PROMOTION",
  "Ошибка получения квоты продвижений": "ERROR_CODES.ERROR_GET_PROMOTION_QUOTA",

  "Ошибка блокировки пользователя": "ERROR_CODES.ERROR_BLOCK_USER",
  "Ошибка разблокировки пользователя": "ERROR_CODES.ERROR_UNBLOCK_USER",
  "Ошибка проверки блокировки": "ERROR_CODES.ERROR_CHECK_BLOCK",
  "Ошибка получения списка заблокированных": "ERROR_CODES.ERROR_GET_BLOCKED",

  "Ошибка создания жалобы": "ERROR_CODES.ERROR_CREATE_REPORT",
  "Ошибка получения жалоб": "ERROR_CODES.ERROR_GET_REPORTS",
  "Ошибка обновления жалобы": "ERROR_CODES.ERROR_UPDATE_REPORT",

  "Ошибка создания заявки": "ERROR_CODES.ERROR_CREATE_REQUEST",
  "Ошибка получения заявки": "ERROR_CODES.ERROR_GET_REQUEST",
  "Ошибка получения заявок": "ERROR_CODES.ERROR_GET_REQUESTS",
  "Ошибка обновления заявки": "ERROR_CODES.ERROR_UPDATE_REQUEST",
  "Ошибка удаления заявки": "ERROR_CODES.ERROR_DELETE_REQUEST",
  "Ошибка активации": "ERROR_CODES.ERROR_ACTIVATION",
  "Ошибка выбора тарифа": "ERROR_CODES.ERROR_PLAN_SELECTION",
  "Ошибка смены тарифа": "ERROR_CODES.ERROR_PLAN_CHANGE",
  "Ошибка продления подписки": "ERROR_CODES.ERROR_PLAN_RENEW",
  "Ошибка настройки авто-продления": "ERROR_CODES.ERROR_AUTO_RENEW",
  "Ошибка получения тарифов": "ERROR_CODES.ERROR_GET_PLANS",
  "Ошибка создания тарифа": "ERROR_CODES.ERROR_CREATE_PLAN",
  "Ошибка обновления тарифа": "ERROR_CODES.ERROR_UPDATE_PLAN",
  "Ошибка загрузки логотипа": "ERROR_CODES.ERROR_LOGO_UPLOAD",
  "Ошибка обработки логотипа": "ERROR_CODES.ERROR_LOGO_PROCESSING",
  "Ошибка загрузки документа": "ERROR_CODES.ERROR_DOCUMENT_UPLOAD",
  "Ошибка загрузки фото": "ERROR_CODES.ERROR_PHOTO_UPLOAD",
  "Ошибка удаления фото": "ERROR_CODES.ERROR_PHOTO_DELETE",
  "Ошибка загрузки файлов": "ERROR_CODES.ERROR_FILE_UPLOAD",
  "Ошибка загрузки видео": "ERROR_CODES.ERROR_VIDEO_UPLOAD",
  "Ошибка обработки видео": "ERROR_CODES.ERROR_VIDEO_PROCESSING",

  "Не удалось загрузить изображение": "ERROR_CODES.ERROR_UPLOAD_IMAGE",
  "Ошибка загрузки изображения": "ERROR_CODES.ERROR_UPLOAD_IMAGE",

  "Ошибка получения пользователей": "ERROR_CODES.ERROR_GET_USERS",
  "Ошибка получения пользователя": "ERROR_CODES.ERROR_GET_USER",
  "Ошибка обновления роли": "ERROR_CODES.ERROR_UPDATE_ROLE",
  "Ошибка обновления верификации": "ERROR_CODES.ERROR_UPDATE_VERIFICATION",
  "Ошибка модерации объявления": "ERROR_CODES.ERROR_MODERATION",
  "Ошибка назначения": "ERROR_CODES.ERROR_ASSIGNMENT",
  "Ошибка отправки рассылки": "ERROR_CODES.ERROR_BROADCAST",
  "Ошибка загрузки истории рассылок": "ERROR_CODES.ERROR_GET_BROADCAST_HISTORY",
  "Ошибка сохранения настроек": "ERROR_CODES.ERROR_SAVE_SETTINGS",
  "Ошибка загрузки настроек": "ERROR_CODES.ERROR_GET_SETTINGS",
  "Ошибка создания бренда": "ERROR_CODES.ERROR_CREATE_BRAND",
  "Ошибка обновления бренда": "ERROR_CODES.ERROR_UPDATE_BRAND",
  "Ошибка удаления бренда": "ERROR_CODES.ERROR_DELETE_BRAND",
  "Ошибка создания модели": "ERROR_CODES.ERROR_CREATE_MODEL",
  "Ошибка обновления модели": "ERROR_CODES.ERROR_UPDATE_MODEL",
  "Ошибка удаления модели": "ERROR_CODES.ERROR_DELETE_MODEL",
  "Ошибка получения счётчиков": "ERROR_CODES.ERROR_GET_COUNTERS",
  "Ошибка получения финансовой статистики": "ERROR_CODES.ERROR_FINANCIAL_STATS",
  "Не удалось загрузить статистику базы данных": "ERROR_CODES.ERROR_DB_STATS",
  "Ошибка аналитики": "ERROR_CODES.ERROR_ANALYTICS",
  "Ошибка получения аналитики": "ERROR_CODES.ERROR_GET_ANALYTICS",
  "Импорт не удался": "ERROR_CODES.ERROR_IMPORT",

  "Не удалось загрузить марки": "ERROR_CODES.ERROR_GET_BRANDS",
  "Ошибка получения брендов": "ERROR_CODES.ERROR_GET_BRANDS",
  "Не удалось загрузить модели": "ERROR_CODES.ERROR_GET_MODELS",
  "Ошибка получения моделей": "ERROR_CODES.ERROR_GET_MODELS",
  "Не удалось загрузить поколения": "ERROR_CODES.ERROR_GET_GENERATIONS",
  "Не удалось загрузить конфигурации": "ERROR_CODES.ERROR_GET_CONFIGURATIONS",
  "Не удалось загрузить модификации": "ERROR_CODES.ERROR_GET_MODIFICATIONS",
  "Не удалось загрузить модификацию": "ERROR_CODES.ERROR_GET_MODIFICATION",
  "Не удалось загрузить характеристики": "ERROR_CODES.ERROR_GET_CHARACTERISTICS",
  "Не удалось загрузить курсы валют": "ERROR_CODES.ERROR_EXCHANGE_RATES",

  "Ошибка получения обращений": "ERROR_CODES.ERROR_GET_SUPPORT_TICKETS",
  "Ошибка получения статистики": "ERROR_CODES.ERROR_GET_DATA",
  "Ошибка получения данных": "ERROR_CODES.ERROR_GET_DATA",
  "Ошибка получения информации": "ERROR_CODES.ERROR_GET_INFO",
  "Ошибка получения непрочитанных": "ERROR_CODES.ERROR_GET_UNREAD",
};

function processFile(filePath: string): { replacements: number; lines: string[] } {
  let content = fs.readFileSync(filePath, "utf8");
  let replacements = 0;
  const unreplaced: string[] = [];

  const sortedKeys = Object.keys(ERROR_MAP).sort((a, b) => b.length - a.length);

  for (const ruText of sortedKeys) {
    const code = ERROR_MAP[ruText];
    const patterns = [
      { search: `error: "${ruText}"`, replace: `error: ${code}` },
      { search: `error: "${ruText}",`, replace: `error: ${code},` },
      { search: `error: \`${ruText}\``, replace: `error: ${code}` },
    ];

    for (const { search, replace } of patterns) {
      while (content.includes(search)) {
        content = content.replace(search, replace);
        replacements++;
      }
    }
  }

  const remaining = content.match(/error: "[А-Яа-яЁё][^"]*"/g);
  if (remaining) {
    for (const r of remaining) {
      unreplaced.push(r);
    }
  }

  if (replacements > 0) {
    if (!content.includes('import { ERROR_CODES }')) {
      const relPath = path.relative(path.dirname(filePath), "shared/error-codes");
      const importPath = relPath.startsWith('.') ? relPath : `./${relPath}`;
      const importStatement = `import { ERROR_CODES } from "${importPath.replace(/\\/g, '/')}";\n`;

      const firstImportIdx = content.indexOf('import ');
      if (firstImportIdx !== -1) {
        const lineEnd = content.indexOf('\n', firstImportIdx);
        content = content.substring(0, lineEnd + 1) + importStatement + content.substring(lineEnd + 1);
      } else {
        content = importStatement + content;
      }
    }
    fs.writeFileSync(filePath, content, "utf8");
  }

  return { replacements, lines: unreplaced };
}

const routeFiles = [
  ...fs.readdirSync("server/routes").filter(f => f.endsWith(".ts") && f !== "index.ts").map(f => `server/routes/${f}`),
  ...fs.readdirSync("server/routes/admin").filter(f => f.endsWith(".ts")).map(f => `server/routes/admin/${f}`),
];

let totalReplacements = 0;
const allUnreplaced: string[] = [];

for (const file of routeFiles) {
  const { replacements, lines } = processFile(file);
  if (replacements > 0) {
    console.log(`  ${file}: ${replacements} replacements`);
  }
  totalReplacements += replacements;
  allUnreplaced.push(...lines.map(l => `  ${file}: ${l}`));
}

console.log(`\nTotal: ${totalReplacements} replacements across ${routeFiles.length} files`);

if (allUnreplaced.length > 0) {
  console.log(`\nUnreplaced Russian errors (${allUnreplaced.length}):`);
  for (const line of [...new Set(allUnreplaced)]) {
    console.log(line);
  }
}
