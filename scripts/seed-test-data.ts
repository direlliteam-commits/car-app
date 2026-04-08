import bcrypt from "bcrypt";
import { db } from "../server/db";
import { users, carListings, conversations, messages, favorites, listingViews, recentlyViewed, listingPromotions, transactions, reviews, notifications, supportTickets, supportMessages } from "../shared/schema";
import { sql } from "drizzle-orm";

const BASE_URL = "http://localhost:5000";

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function seed() {
  console.log("=== SEED: Creating test data ===\n");

  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000);

  const password = await hashPassword("Test123!");

  const testUsers = [
    {
      username: "admin_armen",
      email: "admin@autoarmenia.am",
      phone: "+37491000001",
      name: "Армен Саргсян",
      password,
      role: "admin",
      adminRole: "super_admin",
      city: "Ереван",
      about: "Главный администратор AutoArmenia",
      verified: true,
      walletBalance: 100000,
      createdAt: daysAgo(180),
    },
    {
      username: "dealer_autostar",
      email: "info@autostar.am",
      phone: "+37494100100",
      name: "AutoStar Armenia",
      password,
      role: "dealer",
      city: "Ереван",
      about: "Официальный дилер премиальных автомобилей в Армении",
      verified: true,
      dealerVerified: true,
      companyName: "AutoStar Armenia LLC",
      companyDescription: "Премиальный автосалон с 10-летним опытом. Продажа новых и подержанных автомобилей BMW, Mercedes-Benz, Audi. Кредитование, Trade-In, гарантия.",
      dealerSpecialization: "Премиальные автомобили",
      workingHours: "Пн-Сб: 09:00–19:00, Вс: 10:00–17:00",
      showroomAddress: "ул. Тиграна Меца 52, Ереван",
      website: "https://autostar.am",
      creditProgramEnabled: true,
      creditInterestRate: 12.5,
      creditMaxTerm: 60,
      creditMinDownPayment: 20,
      tradeInEnabled: true,
      warrantyEnabled: true,
      walletBalance: 250000,
      listingsCount: 0,
      rating: 4.8,
      reviewsCount: 0,
      successfulDeals: 47,
      avgResponseTime: 15,
      createdAt: daysAgo(365),
    },
    {
      username: "dealer_erevan_motors",
      email: "sales@erevanmotors.am",
      phone: "+37477200200",
      name: "Erevan Motors",
      password,
      role: "dealer",
      city: "Ереван",
      about: "Крупнейший мультибрендовый автосалон. Более 200 авто в наличии.",
      verified: true,
      dealerVerified: true,
      companyName: "Erevan Motors CJSC",
      companyDescription: "Мультибрендовый автосалон: Toyota, Hyundai, Kia, Nissan, Honda. Более 200 авто в наличии. Гарантия юридической чистоты.",
      dealerSpecialization: "Японские и корейские авто",
      workingHours: "Пн-Вс: 09:00–20:00",
      showroomAddress: "пр. Маштоца 74, Ереван",
      creditProgramEnabled: true,
      creditInterestRate: 14.0,
      creditMaxTerm: 48,
      creditMinDownPayment: 15,
      tradeInEnabled: true,
      warrantyEnabled: false,
      walletBalance: 180000,
      listingsCount: 0,
      rating: 4.5,
      reviewsCount: 0,
      successfulDeals: 123,
      avgResponseTime: 8,
      createdAt: daysAgo(500),
    },
    {
      username: "seller_aram",
      email: "aram.hovhannisyan@gmail.com",
      phone: "+37498300300",
      name: "Арам Ованнисян",
      password,
      role: "user",
      city: "Ереван",
      about: "Продаю личные автомобили",
      verified: true,
      walletBalance: 15000,
      createdAt: daysAgo(90),
    },
    {
      username: "seller_tigran",
      email: "tigran.petrosyan@mail.am",
      phone: "+37493400400",
      name: "Тигран Петросян",
      password,
      role: "user",
      city: "Гюмри",
      about: "Перегонщик авто из Грузии и ОАЭ. Помогу подобрать и доставить авто.",
      verified: true,
      walletBalance: 50000,
      rating: 4.2,
      reviewsCount: 0,
      successfulDeals: 18,
      createdAt: daysAgo(200),
    },
    {
      username: "buyer_anna",
      email: "anna.grigoryan@yandex.ru",
      phone: "+37491500500",
      name: "Анна Григорян",
      password,
      role: "user",
      city: "Ереван",
      about: "",
      verified: true,
      walletBalance: 5000,
      createdAt: daysAgo(30),
    },
    {
      username: "buyer_david",
      email: "david.mkrtchyan@gmail.com",
      phone: "+37477600600",
      name: "Давид Мкртчян",
      password,
      role: "user",
      city: "Ванадзор",
      about: "Ищу авто для семьи",
      verified: true,
      walletBalance: 0,
      createdAt: daysAgo(14),
    },
    {
      username: "new_user_gohar",
      email: "gohar.harutyunyan@gmail.com",
      phone: "+37494700700",
      name: "Гоар Арутюнян",
      password,
      role: "user",
      city: "Ереван",
      verified: false,
      walletBalance: 0,
      createdAt: daysAgo(2),
    },
  ];

  console.log("Creating users...");
  const createdUsers: Record<string, string> = {};
  for (const u of testUsers) {
    const [user] = await db.insert(users).values(u as any).returning({ id: users.id });
    createdUsers[u.username] = user.id;
    console.log(`  ✓ ${u.username} (${u.role}) → ${user.id}`);
  }

  const adminId = createdUsers["admin_armen"];
  const dealerAutostarId = createdUsers["dealer_autostar"];
  const dealerErevanId = createdUsers["dealer_erevan_motors"];
  const aramId = createdUsers["seller_aram"];
  const tigranId = createdUsers["seller_tigran"];
  const annaId = createdUsers["buyer_anna"];
  const davidId = createdUsers["buyer_david"];
  const goharId = createdUsers["new_user_gohar"];

  const cities = ["Ереван", "Гюмри", "Ванадзор", "Абовян", "Капан", "Раздан", "Армавир", "Арташат", "Аштарак", "Степанакерт"];

  const listings = [
    // === DEALER AUTOSTAR - premium cars ===
    { userId: dealerAutostarId, brand: "BMW", model: "X5", year: 2023, price: 65000, currency: "USD", mileage: 12000, bodyType: "suv_5d", fuelType: "diesel", transmission: "automatic", driveType: "all", engineVolume: 3.0, horsepower: 286, color: "black", condition: "used", location: "Ереван", steeringWheel: "left", customsCleared: true, sellerName: "AutoStar Armenia", sellerPhone: "+37494100100", sellerType: "dealer", status: "active", description: "BMW X5 xDrive30d, М-пакет, панорама, проекция, Harman Kardon. Один владелец, полная история обслуживания у официального дилера.", equipment: ["leather", "panoramic_roof", "navigation", "parking_sensors", "camera_360", "heated_seats", "ventilated_seats", "adaptive_cruise", "lane_assist", "blind_spot"], images: ["/uploads/seed/bmw-x5-1.jpg", "/uploads/seed/bmw-x5-2.jpg", "/uploads/seed/bmw-x5-3.jpg", "/uploads/seed/bmw-x5-4.jpg"], createdAt: daysAgo(5), vin: "WBAJF01060B123456" },
    { userId: dealerAutostarId, brand: "Mercedes-Benz", model: "GLE", year: 2022, price: 72000, currency: "USD", mileage: 28000, bodyType: "suv_5d", fuelType: "diesel", transmission: "automatic", driveType: "all", engineVolume: 3.0, horsepower: 272, color: "white", condition: "used", location: "Ереван", steeringWheel: "left", customsCleared: true, sellerName: "AutoStar Armenia", sellerPhone: "+37494100100", sellerType: "dealer", status: "active", description: "Mercedes-Benz GLE 350d 4MATIC, AMG Line, Burmester, пневмоподвеска. Идеальное состояние.", equipment: ["leather", "panoramic_roof", "navigation", "parking_sensors", "camera_360", "heated_seats", "air_suspension", "ambient_lighting"], images: ["/uploads/seed/mercedes-gle-1.jpg", "/uploads/seed/mercedes-gle-2.jpg", "/uploads/seed/mercedes-gle-3.jpg"], createdAt: daysAgo(3) },
    { userId: dealerAutostarId, brand: "Audi", model: "A6", year: 2021, price: 42000, currency: "USD", mileage: 45000, bodyType: "sedan", fuelType: "petrol", transmission: "automatic", driveType: "all", engineVolume: 2.0, horsepower: 245, color: "grey", condition: "used", location: "Ереван", steeringWheel: "left", customsCleared: true, sellerName: "AutoStar Armenia", sellerPhone: "+37494100100", sellerType: "dealer", status: "active", description: "Audi A6 45 TFSI quattro S-line. Virtual cockpit, Matrix LED, Bang & Olufsen. Кредит от 12.5%.", equipment: ["leather", "navigation", "parking_sensors", "heated_seats", "matrix_led", "virtual_cockpit"], images: ["/uploads/seed/audi-a6-1.jpg", "/uploads/seed/audi-a6-2.jpg"], createdAt: daysAgo(10) },
    { userId: dealerAutostarId, brand: "BMW", model: "3 Series", year: 2024, price: 55000, currency: "USD", mileage: 3000, bodyType: "sedan", fuelType: "petrol", transmission: "automatic", driveType: "rear", engineVolume: 2.0, horsepower: 245, color: "blue", condition: "new", location: "Ереван", steeringWheel: "left", customsCleared: true, sellerName: "AutoStar Armenia", sellerPhone: "+37494100100", sellerType: "dealer", status: "active", description: "Новый BMW 330i M Sport. Полная комплектация. Гарантия 3 года.", equipment: ["leather", "navigation", "parking_sensors", "heated_seats", "sport_package", "heads_up_display"], images: ["/uploads/seed/bmw-3-1.jpg"], createdAt: daysAgo(1) },
    { userId: dealerAutostarId, brand: "Porsche", model: "Cayenne", year: 2023, price: 95000, currency: "USD", mileage: 15000, bodyType: "suv_5d", fuelType: "petrol", transmission: "automatic", driveType: "all", engineVolume: 3.0, horsepower: 340, color: "white", condition: "used", location: "Ереван", steeringWheel: "left", customsCleared: true, sellerName: "AutoStar Armenia", sellerPhone: "+37494100100", sellerType: "dealer", status: "active", description: "Porsche Cayenne S, спортивный выхлоп, PDLS+, панорама, 21\" диски.", equipment: ["leather", "panoramic_roof", "navigation", "parking_sensors", "camera_360", "sport_exhaust"], images: ["/uploads/seed/porsche-cayenne-1.jpg", "/uploads/seed/porsche-cayenne-2.jpg"], createdAt: daysAgo(7) },

    // === DEALER EREVAN MOTORS - mass market ===
    { userId: dealerErevanId, brand: "Toyota", model: "Camry", year: 2023, price: 35000, currency: "USD", mileage: 18000, bodyType: "sedan", fuelType: "petrol", transmission: "automatic", driveType: "front", engineVolume: 2.5, horsepower: 209, color: "silver", condition: "used", location: "Ереван", steeringWheel: "left", customsCleared: true, sellerName: "Erevan Motors", sellerPhone: "+37477200200", sellerType: "dealer", status: "active", description: "Toyota Camry 2.5 Prestige. Топовая комплектация, кожа, JBL, панорама.", equipment: ["leather", "panoramic_roof", "navigation", "parking_sensors", "jbl_audio", "heated_seats"], images: ["/uploads/seed/toyota-camry-1.jpg", "/uploads/seed/toyota-camry-2.jpg", "/uploads/seed/toyota-camry-3.jpg"], createdAt: daysAgo(4) },
    { userId: dealerErevanId, brand: "Hyundai", model: "Tucson", year: 2022, price: 28000, currency: "USD", mileage: 35000, bodyType: "suv_5d", fuelType: "petrol", transmission: "automatic", driveType: "all", engineVolume: 2.0, horsepower: 150, color: "red", condition: "used", location: "Ереван", steeringWheel: "left", customsCleared: true, sellerName: "Erevan Motors", sellerPhone: "+37477200200", sellerType: "dealer", status: "active", description: "Hyundai Tucson 2.0 MPI 4WD. Полный привод, кожа, подогрев всех сидений.", equipment: ["leather", "heated_seats", "parking_sensors", "android_auto", "apple_carplay"], images: ["/uploads/seed/hyundai-tucson-1.jpg"], createdAt: daysAgo(6) },
    { userId: dealerErevanId, brand: "Kia", model: "Sportage", year: 2023, price: 30000, currency: "USD", mileage: 22000, bodyType: "suv_5d", fuelType: "diesel", transmission: "automatic", driveType: "all", engineVolume: 2.0, horsepower: 186, color: "green", condition: "used", location: "Ереван", steeringWheel: "left", customsCleared: true, sellerName: "Erevan Motors", sellerPhone: "+37477200200", sellerType: "dealer", status: "active", description: "Kia Sportage 2.0 CRDi GT-Line. Новый кузов, панорама, ADAS.", equipment: ["leather", "panoramic_roof", "navigation", "parking_sensors", "heated_seats", "adaptive_cruise"], images: ["/uploads/seed/kia-sportage-1.jpg"], createdAt: daysAgo(8) },
    { userId: dealerErevanId, brand: "Toyota", model: "RAV4", year: 2021, price: 32000, currency: "USD", mileage: 52000, bodyType: "suv_5d", fuelType: "hybrid", transmission: "automatic", driveType: "all", engineVolume: 2.5, horsepower: 222, color: "white", condition: "used", location: "Ереван", steeringWheel: "left", customsCleared: true, sellerName: "Erevan Motors", sellerPhone: "+37477200200", sellerType: "dealer", status: "active", description: "Toyota RAV4 Hybrid AWD-i. Расход 4.8л/100км, отличное состояние.", equipment: ["hybrid", "navigation", "parking_sensors", "heated_seats", "tss_safety"], images: ["/uploads/seed/toyota-rav4-1.jpg"], createdAt: daysAgo(12) },
    { userId: dealerErevanId, brand: "Honda", model: "CR-V", year: 2020, price: 25000, currency: "USD", mileage: 65000, bodyType: "suv_5d", fuelType: "petrol", transmission: "automatic", driveType: "all", engineVolume: 1.5, horsepower: 193, color: "black", condition: "used", location: "Ереван", steeringWheel: "left", customsCleared: true, sellerName: "Erevan Motors", sellerPhone: "+37477200200", sellerType: "dealer", status: "active", description: "Honda CR-V 1.5T AWD EX-L. Турбо, кожа, люк, Honda Sensing.", equipment: ["leather", "sunroof", "parking_sensors", "heated_seats", "honda_sensing"], images: ["/uploads/seed/honda-crv-1.jpg"], createdAt: daysAgo(15) },
    { userId: dealerErevanId, brand: "Nissan", model: "X-Trail", year: 2022, price: 27000, currency: "USD", mileage: 40000, bodyType: "suv_5d", fuelType: "petrol", transmission: "cvt", driveType: "all", engineVolume: 2.5, horsepower: 181, color: "grey", condition: "used", location: "Ереван", steeringWheel: "left", customsCleared: true, sellerName: "Erevan Motors", sellerPhone: "+37477200200", sellerType: "dealer", status: "active", description: "Nissan X-Trail 2.5 CVT 4WD. 7 мест, ProPILOT, 360° камера.", equipment: ["7_seats", "navigation", "camera_360", "parking_sensors", "propilot"], images: ["/uploads/seed/nissan-xtrail-1.jpg"], createdAt: daysAgo(20) },
    { userId: dealerErevanId, brand: "Hyundai", model: "Sonata", year: 2023, price: 26000, currency: "USD", mileage: 15000, bodyType: "sedan", fuelType: "petrol", transmission: "automatic", driveType: "front", engineVolume: 2.5, horsepower: 194, color: "blue", condition: "used", location: "Ереван", steeringWheel: "left", customsCleared: true, sellerName: "Erevan Motors", sellerPhone: "+37477200200", sellerType: "dealer", status: "active", description: "Hyundai Sonata 2.5 MPI Inspiration. Топ-комплектация, вентиляция, Bose.", equipment: ["leather", "ventilated_seats", "navigation", "parking_sensors", "bose_audio", "sunroof"], images: ["/uploads/seed/hyundai-sonata-1.jpg"], createdAt: daysAgo(2) },

    // === SELLER ARAM - private seller, few cars ===
    { userId: aramId, brand: "Toyota", model: "Corolla", year: 2019, price: 16500, currency: "USD", mileage: 78000, bodyType: "sedan", fuelType: "petrol", transmission: "cvt", driveType: "front", engineVolume: 1.6, horsepower: 122, color: "white", condition: "used", location: "Ереван", steeringWheel: "left", customsCleared: true, sellerName: "Арам", sellerPhone: "+37498300300", sellerType: "private", status: "active", description: "Продаю личный авто. Toyota Corolla 1.6 CVT. Не бита, не крашена. Один хозяин, сервисная книжка. Зимняя резина в подарок.", equipment: ["parking_sensors", "heated_seats", "bluetooth"], images: ["/uploads/seed/toyota-corolla-1.jpg"], createdAt: daysAgo(7) },
    { userId: aramId, brand: "Volkswagen", model: "Golf", year: 2017, price: 12000, currency: "USD", mileage: 110000, bodyType: "hatchback_5d", fuelType: "petrol", transmission: "automatic", driveType: "front", engineVolume: 1.4, horsepower: 125, color: "grey", condition: "used", location: "Ереван", steeringWheel: "left", customsCleared: true, sellerName: "Арам", sellerPhone: "+37498300300", sellerType: "private", status: "active", description: "VW Golf 7 Comfortline 1.4 TSI DSG. Хорошее состояние, все ТО у дилера. Торг при осмотре.", equipment: ["navigation", "parking_sensors", "heated_seats"], images: ["/uploads/seed/vw-golf-1.jpg"], createdAt: daysAgo(14) },
    { userId: aramId, brand: "Mercedes-Benz", model: "C-Class", year: 2015, price: 18000, currency: "USD", mileage: 145000, bodyType: "sedan", fuelType: "diesel", transmission: "automatic", driveType: "rear", engineVolume: 2.1, horsepower: 170, color: "black", condition: "used", location: "Ереван", steeringWheel: "left", customsCleared: true, sellerName: "Арам", sellerPhone: "+37498300300", sellerType: "private", status: "sold", description: "Mercedes C220d W205 Avantgarde. Кожа, LED, навигация. Продан.", equipment: ["leather", "navigation", "led_headlights", "heated_seats"], images: ["/uploads/seed/mercedes-c-1.jpg"], createdAt: daysAgo(30) },

    // === SELLER TIGRAN - importer, diverse cars ===
    { userId: tigranId, brand: "Toyota", model: "Land Cruiser Prado", year: 2020, price: 48000, currency: "USD", mileage: 55000, bodyType: "suv_5d", fuelType: "diesel", transmission: "automatic", driveType: "all", engineVolume: 2.8, horsepower: 177, color: "white", condition: "used", location: "Гюмри", steeringWheel: "left", customsCleared: true, sellerName: "Тигран", sellerPhone: "+37493400400", sellerType: "private", status: "active", description: "Toyota Land Cruiser Prado 150, привезен из ОАЭ, полная растаможка. Идеальное состояние, без пробега по СНГ.", equipment: ["leather", "navigation", "camera_360", "parking_sensors", "coolbox", "differential_lock"], images: ["/uploads/seed/toyota-prado-1.jpg"], createdAt: daysAgo(3), exchangePossible: true, importCountry: "UAE" },
    { userId: tigranId, brand: "Lexus", model: "RX", year: 2021, price: 52000, currency: "USD", mileage: 38000, bodyType: "suv_5d", fuelType: "petrol", transmission: "automatic", driveType: "all", engineVolume: 3.5, horsepower: 300, color: "black", condition: "used", location: "Гюмри", steeringWheel: "left", customsCleared: true, sellerName: "Тигран", sellerPhone: "+37493400400", sellerType: "private", status: "active", description: "Lexus RX 350 F-Sport, из Грузии. Mark Levinson, панорама, адаптивная подвеска.", equipment: ["leather", "panoramic_roof", "mark_levinson", "navigation", "parking_sensors", "heads_up_display"], images: ["/uploads/seed/lexus-rx-1.jpg", "/uploads/seed/lexus-rx-2.jpg", "/uploads/seed/lexus-rx-3.jpg"], createdAt: daysAgo(5), exchangePossible: true, importCountry: "Georgia" },
    { userId: tigranId, brand: "Toyota", model: "Camry", year: 2022, price: 31000, currency: "USD", mileage: 25000, bodyType: "sedan", fuelType: "petrol", transmission: "automatic", driveType: "front", engineVolume: 2.5, horsepower: 209, color: "silver", condition: "used", location: "Гюмри", steeringWheel: "left", customsCleared: true, sellerName: "Тигран", sellerPhone: "+37493400400", sellerType: "private", status: "active", description: "Toyota Camry 2.5 из Грузии. Кожа, JBL, Safety Sense. Растаможена.", equipment: ["leather", "jbl_audio", "navigation", "heated_seats", "tss_safety"], images: ["/uploads/seed/toyota-camry-1.jpg", "/uploads/seed/toyota-camry-2.jpg"], createdAt: daysAgo(9), importCountry: "Georgia" },
    { userId: tigranId, brand: "Mitsubishi", model: "Pajero", year: 2018, price: 22000, currency: "USD", mileage: 95000, bodyType: "suv_5d", fuelType: "diesel", transmission: "automatic", driveType: "all", engineVolume: 3.2, horsepower: 200, color: "silver", condition: "used", location: "Гюмри", steeringWheel: "left", customsCleared: false, sellerName: "Тигран", sellerPhone: "+37493400400", sellerType: "private", status: "active", description: "Mitsubishi Pajero 4, дизель. На учёте в Грузии, можно ездить 90 дней. Торг.", equipment: ["leather", "sunroof", "differential_lock"], images: ["/uploads/seed/mitsubishi-pajero-1.jpg"], createdAt: daysAgo(11), importCountry: "Georgia" },
    { userId: tigranId, brand: "Hyundai", model: "Santa Fe", year: 2022, price: 33000, currency: "USD", mileage: 30000, bodyType: "suv_5d", fuelType: "diesel", transmission: "automatic", driveType: "all", engineVolume: 2.2, horsepower: 202, color: "brown", condition: "used", location: "Гюмри", steeringWheel: "left", customsCleared: true, sellerName: "Тигран", sellerPhone: "+37493400400", sellerType: "private", status: "active", description: "Hyundai Santa Fe 2.2 CRDi 4WD. Привезён из Кореи, растаможен. Полный фарш.", equipment: ["leather", "panoramic_roof", "navigation", "parking_sensors", "heated_seats", "ventilated_seats", "heads_up_display"], images: ["/uploads/seed/hyundai-santafe-1.jpg"], createdAt: daysAgo(6), importCountry: "South Korea" },

    // === ANNA's listing - selling her first car ===
    { userId: annaId, brand: "Kia", model: "Rio", year: 2018, price: 9500, currency: "USD", mileage: 85000, bodyType: "sedan", fuelType: "petrol", transmission: "automatic", driveType: "front", engineVolume: 1.6, horsepower: 123, color: "red", condition: "used", location: "Ереван", steeringWheel: "left", customsCleared: true, sellerName: "Анна", sellerPhone: "+37491500500", sellerType: "private", status: "active", description: "Kia Rio, дамский авто, бережная эксплуатация, гаражное хранение. Продаю в связи с покупкой нового.", equipment: ["parking_sensors", "bluetooth", "rear_camera"], images: ["/uploads/seed/kia-rio-1.jpg"], createdAt: daysAgo(3) },

    // === TRUCKS ===
    { userId: dealerErevanId, vehicleType: "truck", brand: "Volvo", model: "FH", year: 2021, price: 85000, currency: "USD", mileage: 120000, bodyType: "tractor", fuelType: "diesel", transmission: "automatic", driveType: "rear", engineVolume: 13.0, horsepower: 500, color: "white", condition: "used", location: "Ереван", steeringWheel: "left", customsCleared: true, sellerName: "Erevan Motors", sellerPhone: "+37477200200", sellerType: "dealer", status: "active", description: "Volvo FH 500 4x2 тягач. I-Shift, пневмоподвеска, ретардер, кабина Globetrotter XL. Идеальное состояние для международных перевозок.", equipment: ["air_suspension", "navigation", "cruise_control", "parking_sensors", "bluetooth"], images: ["/uploads/seed/volvo-fh-1.png"], createdAt: daysAgo(4) },
    { userId: tigranId, vehicleType: "truck", brand: "MAN", model: "TGS", year: 2019, price: 55000, currency: "USD", mileage: 180000, bodyType: "dump_truck", fuelType: "diesel", transmission: "manual", driveType: "all", engineVolume: 10.5, horsepower: 400, color: "yellow", condition: "used", location: "Гюмри", steeringWheel: "left", customsCleared: true, sellerName: "Тигран", sellerPhone: "+37493400400", sellerType: "private", status: "active", description: "MAN TGS 33.400 6x6 самосвал. Кузов 16 м³, привезён из Германии. Отличное состояние для стройки.", equipment: ["cruise_control", "bluetooth"], images: ["/uploads/seed/man-tgs-1.png"], createdAt: daysAgo(8), importCountry: "Germany" },
    { userId: aramId, vehicleType: "truck", brand: "Isuzu", model: "NPR", year: 2020, price: 28000, currency: "USD", mileage: 65000, bodyType: "refrigerator_truck", fuelType: "diesel", transmission: "automatic", driveType: "rear", engineVolume: 3.0, horsepower: 150, color: "white", condition: "used", location: "Ереван", steeringWheel: "left", customsCleared: true, sellerName: "Арам", sellerPhone: "+37498300300", sellerType: "private", status: "active", description: "Isuzu NPR рефрижератор. Холодильная установка Carrier. Грузоподъёмность 3.5 тонн. Идеален для доставки продуктов.", equipment: ["bluetooth", "rear_camera"], images: ["/uploads/seed/isuzu-npr-1.png"], createdAt: daysAgo(6) },

    // === SPECIAL EQUIPMENT ===
    { userId: dealerAutostarId, vehicleType: "special", brand: "Caterpillar", model: "320", year: 2020, price: 120000, currency: "USD", mileage: 4500, bodyType: "excavator", fuelType: "diesel", transmission: "automatic", driveType: "all", engineVolume: 7.0, horsepower: 162, color: "yellow", condition: "used", location: "Ереван", steeringWheel: "left", customsCleared: true, sellerName: "AutoStar Armenia", sellerPhone: "+37494100100", sellerType: "dealer", status: "active", description: "CAT 320 гусеничный экскаватор. 4500 моточасов, ковш 1.2 м³. Состояние как новый. Кредит и лизинг.", equipment: [], images: ["/uploads/seed/cat-320-1.png"], createdAt: daysAgo(10) },
    { userId: tigranId, vehicleType: "special", brand: "Komatsu", model: "WA320", year: 2018, price: 65000, currency: "USD", mileage: 7200, bodyType: "loader", fuelType: "diesel", transmission: "automatic", driveType: "all", engineVolume: 6.7, horsepower: 168, color: "yellow", condition: "used", location: "Гюмри", steeringWheel: "left", customsCleared: true, sellerName: "Тигран", sellerPhone: "+37493400400", sellerType: "private", status: "active", description: "Komatsu WA320 фронтальный погрузчик. 7200 моточасов, ковш 2.5 м³. Привезён из Японии.", equipment: [], images: ["/uploads/seed/komatsu-wa320-1.png"], createdAt: daysAgo(13), importCountry: "Japan" },

    // === MOTORCYCLES ===
    { userId: aramId, vehicleType: "moto", brand: "Yamaha", model: "YZF-R1", year: 2022, price: 18000, currency: "USD", mileage: 8000, bodyType: "sport_bike", fuelType: "petrol", transmission: "manual", driveType: "rear", engineVolume: 1.0, horsepower: 200, color: "red", condition: "used", location: "Ереван", steeringWheel: "left", customsCleared: true, sellerName: "Арам", sellerPhone: "+37498300300", sellerType: "private", status: "active", description: "Yamaha YZF-R1 2022. 200 л.с., быстрый переключатель, трекшн-контроль. Гаражное хранение, пробег минимальный.", equipment: ["abs", "traction_control"], images: ["/uploads/seed/yamaha-r1-1.png"], createdAt: daysAgo(5) },
    { userId: tigranId, vehicleType: "moto", brand: "Harley-Davidson", model: "Sportster S", year: 2023, price: 16500, currency: "USD", mileage: 3000, bodyType: "cruiser", fuelType: "petrol", transmission: "manual", driveType: "rear", engineVolume: 1.25, horsepower: 121, color: "black", condition: "used", location: "Гюмри", steeringWheel: "left", customsCleared: true, sellerName: "Тигран", sellerPhone: "+37493400400", sellerType: "private", status: "active", description: "Harley-Davidson Sportster S RH1250S. Двигатель Revolution Max 1250. Привезён из США, полностью растаможен.", equipment: ["abs", "cruise_control"], images: ["/uploads/seed/harley-sportster-1.png"], createdAt: daysAgo(7), importCountry: "USA" },
    { userId: dealerAutostarId, vehicleType: "moto", brand: "Honda", model: "CRF1100L Africa Twin", year: 2023, price: 15500, currency: "USD", mileage: 5000, bodyType: "adventure", fuelType: "petrol", transmission: "manual", driveType: "rear", engineVolume: 1.1, horsepower: 102, color: "grey", condition: "used", location: "Ереван", steeringWheel: "left", customsCleared: true, sellerName: "AutoStar Armenia", sellerPhone: "+37494100100", sellerType: "dealer", status: "active", description: "Honda Africa Twin CRF1100L DCT Adventure Sports. Электроподвеска, круиз-контроль, подогрев ручек. Идеальный мотоцикл для путешествий.", equipment: ["abs", "traction_control", "cruise_control", "heated_grips"], images: ["/uploads/seed/honda-africa-twin-1.png"], createdAt: daysAgo(9) },

    // === LISTING ON MODERATION ===
    { userId: goharId, brand: "Hyundai", model: "Accent", year: 2016, price: 7500, currency: "USD", mileage: 120000, bodyType: "sedan", fuelType: "petrol", transmission: "automatic", driveType: "front", engineVolume: 1.6, horsepower: 123, color: "white", condition: "used", location: "Ереван", steeringWheel: "left", customsCleared: true, sellerName: "Гоар", sellerPhone: "+37494700700", sellerType: "private", status: "moderation", description: "Hyundai Accent, первый владелец.", equipment: [], images: ["/uploads/seed/hyundai-accent-1.jpg"], createdAt: hoursAgo(6) },

    // === ARCHIVED LISTING ===
    { userId: tigranId, brand: "Toyota", model: "Yaris", year: 2014, price: 6000, currency: "USD", mileage: 160000, bodyType: "hatchback_5d", fuelType: "petrol", transmission: "automatic", driveType: "front", engineVolume: 1.3, horsepower: 99, color: "blue", condition: "used", location: "Гюмри", steeringWheel: "left", customsCleared: true, sellerName: "Тигран", sellerPhone: "+37493400400", sellerType: "private", status: "archived", description: "Toyota Yaris, снято с продажи.", equipment: [], images: ["/uploads/seed/toyota-yaris-1.jpg"], createdAt: daysAgo(90) },
  ];

  console.log("\nCreating listings...");
  const createdListings: { id: number; userId: string; brand: string; model: string }[] = [];
  for (const l of listings) {
    const [listing] = await db.insert(carListings).values(l as any).returning({ id: carListings.id });
    createdListings.push({ id: listing.id, userId: l.userId, brand: l.brand, model: l.model });
    console.log(`  ✓ ${l.brand} ${l.model} ${l.year} — $${l.price} (${l.status})`);
  }

  // Update listing counts for users
  const listingCounts: Record<string, number> = {};
  for (const l of listings) {
    if (l.status === "active") {
      listingCounts[l.userId] = (listingCounts[l.userId] || 0) + 1;
    }
  }
  for (const [uid, count] of Object.entries(listingCounts)) {
    await db.update(users).set({ listingsCount: count }).where(sql`id = ${uid}`);
  }

  // === PROMOTIONS ===
  console.log("\nCreating promotions...");
  const activeListings = createdListings.filter((_, i) => listings[i].status === "active");
  
  // TURBO for BMW X5
  const bmwX5 = activeListings.find(l => l.brand === "BMW" && l.model === "X5")!;
  await db.insert(listingPromotions).values({
    listingId: bmwX5.id,
    userId: dealerAutostarId,
    packageId: 10,
    packageCode: "top",
    startedAt: daysAgo(3),
    expiresAt: new Date(now.getTime() + 4 * 86400000),
    active: true,
  });
  console.log("  ✓ TURBO → BMW X5");

  // PRO for Mercedes GLE
  const mercedesGLE = activeListings.find(l => l.brand === "Mercedes-Benz" && l.model === "GLE")!;
  await db.insert(listingPromotions).values({
    listingId: mercedesGLE.id,
    userId: dealerAutostarId,
    packageId: 8,
    packageCode: "pro_pack",
    startedAt: daysAgo(2),
    expiresAt: new Date(now.getTime() + 5 * 86400000),
    active: true,
  });
  console.log("  ✓ PRO → Mercedes GLE");

  // TURBO for Toyota Camry (dealer)
  const camryDealer = activeListings.find(l => l.brand === "Toyota" && l.model === "Camry" && l.userId === dealerErevanId)!;
  await db.insert(listingPromotions).values({
    listingId: camryDealer.id,
    userId: dealerErevanId,
    packageId: 10,
    packageCode: "top",
    startedAt: daysAgo(1),
    expiresAt: new Date(now.getTime() + 6 * 86400000),
    active: true,
  });
  console.log("  ✓ TURBO → Toyota Camry (dealer)");

  // PRO for Lexus RX
  const lexusRX = activeListings.find(l => l.brand === "Lexus" && l.model === "RX")!;
  await db.insert(listingPromotions).values({
    listingId: lexusRX.id,
    userId: tigranId,
    packageId: 8,
    packageCode: "pro_pack",
    startedAt: daysAgo(5),
    expiresAt: new Date(now.getTime() + 2 * 86400000),
    active: true,
  });
  console.log("  ✓ PRO → Lexus RX");

  // === TRANSACTIONS ===
  console.log("\nCreating transactions...");
  await db.insert(transactions).values([
    { userId: dealerAutostarId, type: "wallet_topup", amountAmd: 100000, description: "Пополнение кошелька", createdAt: daysAgo(30) },
    { userId: dealerAutostarId, type: "promotion_purchase", amountAmd: -14875, description: "TURBO (7 дн.) — BMW X5 2023", listingId: bmwX5.id, createdAt: daysAgo(3) },
    { userId: dealerAutostarId, type: "promotion_purchase", amountAmd: -5950, description: "PRO (7 дн.) — Mercedes-Benz GLE 2022", listingId: mercedesGLE.id, createdAt: daysAgo(2) },
    { userId: dealerErevanId, type: "wallet_topup", amountAmd: 50000, description: "Пополнение кошелька", createdAt: daysAgo(15) },
    { userId: dealerErevanId, type: "promotion_purchase", amountAmd: -14875, description: "TURBO (7 дн.) — Toyota Camry 2023", listingId: camryDealer.id, createdAt: daysAgo(1) },
    { userId: tigranId, type: "wallet_topup", amountAmd: 30000, description: "Пополнение кошелька", createdAt: daysAgo(20) },
    { userId: tigranId, type: "promotion_purchase", amountAmd: -5950, description: "PRO (7 дн.) — Lexus RX 2021", listingId: lexusRX.id, createdAt: daysAgo(5) },
    { userId: aramId, type: "wallet_topup", amountAmd: 5000, description: "Пополнение кошелька", createdAt: daysAgo(10) },
  ] as any[]);
  console.log("  ✓ 8 transactions created");

  // === CONVERSATIONS & MESSAGES ===
  console.log("\nCreating conversations...");

  // Anna asks about Toyota Corolla
  const corollaListing = activeListings.find(l => l.brand === "Toyota" && l.model === "Corolla")!;
  const [conv1] = await db.insert(conversations).values({
    listingId: corollaListing.id,
    buyerId: annaId,
    sellerId: aramId,
    lastMessageAt: hoursAgo(2),
    createdAt: daysAgo(2),
  }).returning({ id: conversations.id });

  await db.insert(messages).values([
    { conversationId: conv1.id, senderId: annaId, content: "Здравствуйте! Toyota Corolla ещё в продаже?", createdAt: daysAgo(2) },
    { conversationId: conv1.id, senderId: aramId, content: "Да, в продаже. Можете приехать посмотреть.", createdAt: hoursAgo(47) },
    { conversationId: conv1.id, senderId: annaId, content: "Торг возможен? Какая минимальная цена?", createdAt: daysAgo(1) },
    { conversationId: conv1.id, senderId: aramId, content: "Могу скинуть до $16,000 при быстрой сделке.", createdAt: hoursAgo(12) },
    { conversationId: conv1.id, senderId: annaId, content: "Хорошо, давайте завтра посмотрю. Где можно встретиться?", createdAt: hoursAgo(2) },
  ] as any[]);
  console.log("  ✓ Anna ↔ Aram (Toyota Corolla) — 5 messages");

  // David asks about Land Cruiser Prado
  const pradoListing = activeListings.find(l => l.brand === "Toyota" && l.model === "Land Cruiser Prado")!;
  const [conv2] = await db.insert(conversations).values({
    listingId: pradoListing.id,
    buyerId: davidId,
    sellerId: tigranId,
    lastMessageAt: hoursAgo(5),
    createdAt: daysAgo(1),
  }).returning({ id: conversations.id });

  await db.insert(messages).values([
    { conversationId: conv2.id, senderId: davidId, content: "Добрый день! Интересует Прадо. Можно увидеть отчёт по VIN?", createdAt: daysAgo(1) },
    { conversationId: conv2.id, senderId: tigranId, content: "Конечно, вот отчёт CarFax. Чистая история, без ДТП.", createdAt: hoursAgo(18) },
    { conversationId: conv2.id, senderId: davidId, content: "Отлично. Возможен обмен на мой Tucson 2019 + доплата?", createdAt: hoursAgo(5) },
  ] as any[]);
  console.log("  ✓ David ↔ Tigran (Prado) — 3 messages");

  // Anna asks dealer about Hyundai Sonata
  const sonataListing = activeListings.find(l => l.brand === "Hyundai" && l.model === "Sonata")!;
  const [conv3] = await db.insert(conversations).values({
    listingId: sonataListing.id,
    buyerId: annaId,
    sellerId: dealerErevanId,
    lastMessageAt: hoursAgo(1),
    createdAt: daysAgo(1),
  }).returning({ id: conversations.id });

  await db.insert(messages).values([
    { conversationId: conv3.id, senderId: annaId, content: "Здравствуйте! Sonata ещё есть? Какие условия кредита?", createdAt: daysAgo(1) },
    { conversationId: conv3.id, senderId: dealerErevanId, content: "Добрый день! Да, авто в наличии. Кредит от 14% годовых, первый взнос от 15%. Приезжайте на тест-драйв!", createdAt: hoursAgo(20) },
    { conversationId: conv3.id, senderId: annaId, content: "А Trade-In принимаете? У меня Kia Rio 2018.", createdAt: hoursAgo(4) },
    { conversationId: conv3.id, senderId: dealerErevanId, content: "Да, принимаем! Привозите на оценку, сделаем выгодное предложение.", createdAt: hoursAgo(1) },
  ] as any[]);
  console.log("  ✓ Anna ↔ ErevanMotors (Sonata) — 4 messages");

  // === FAVORITES ===
  console.log("\nCreating favorites...");
  const favoritePairs = [
    [annaId, corollaListing.id],
    [annaId, sonataListing.id],
    [annaId, activeListings.find(l => l.brand === "Kia" && l.model === "Sportage")!.id],
    [davidId, pradoListing.id],
    [davidId, bmwX5.id],
    [davidId, activeListings.find(l => l.brand === "Honda" && l.model === "CR-V")!.id],
    [goharId, activeListings.find(l => l.brand === "Kia" && l.model === "Rio")!.id],
  ];
  for (const [uid, lid] of favoritePairs) {
    await db.insert(favorites).values({ userId: uid as string, listingId: lid as number });
    await db.update(carListings).set({ favoritesCount: sql`favorites_count + 1` }).where(sql`id = ${lid}`);
  }
  console.log(`  ✓ ${favoritePairs.length} favorites created`);

  // === VIEWS ===
  console.log("\nCreating views...");
  for (const listing of activeListings) {
    const viewCount = Math.floor(Math.random() * 80) + 20;
    await db.update(carListings).set({ views: viewCount }).where(sql`id = ${listing.id}`);
  }
  console.log("  ✓ Random views assigned to active listings");

  // === REVIEWS ===
  console.log("\nCreating reviews...");
  await db.insert(reviews).values([
    { reviewerId: annaId, sellerId: dealerErevanId, listingId: sonataListing.id, rating: 5, comment: "Отличный салон! Вежливый персонал, быстрое оформление.", createdAt: daysAgo(10) },
    { reviewerId: davidId, sellerId: tigranId, listingId: pradoListing.id, rating: 4, comment: "Тигран помог с доставкой авто из Грузии. Всё чётко, рекомендую.", createdAt: daysAgo(45) },
    { reviewerId: annaId, sellerId: aramId, listingId: corollaListing.id, rating: 5, comment: "Честный продавец, авто в отличном состоянии.", createdAt: daysAgo(5) },
  ] as any[]);
  
  // Update review counts
  await db.update(users).set({ reviewsCount: 1, rating: 5.0 }).where(sql`id = ${dealerErevanId}`);
  await db.update(users).set({ reviewsCount: 1, rating: 4.0 }).where(sql`id = ${tigranId}`);
  await db.update(users).set({ reviewsCount: 1, rating: 5.0 }).where(sql`id = ${aramId}`);
  console.log("  ✓ 3 reviews created");

  // === RECENTLY VIEWED ===
  console.log("\nCreating recently viewed...");
  const recentViewPairs = [
    [annaId, bmwX5.id], [annaId, corollaListing.id], [annaId, sonataListing.id],
    [davidId, pradoListing.id], [davidId, lexusRX.id], [davidId, bmwX5.id],
  ];
  for (const [uid, lid] of recentViewPairs) {
    await db.insert(recentlyViewed).values({ userId: uid as string, listingId: lid as number });
  }
  console.log(`  ✓ ${recentViewPairs.length} recent views`);

  // === SUPPORT TICKETS ===
  console.log("\nCreating support tickets...");
  const [ticket1] = await db.insert(supportTickets).values({
    userId: annaId,
    subject: "Не могу загрузить фотографии",
    status: "open",
    createdAt: daysAgo(1),
  } as any).returning({ id: supportTickets.id });

  await db.insert(supportMessages).values([
    { ticketId: ticket1.id, senderId: annaId, content: "Здравствуйте, при загрузке фотографий для объявления выходит ошибка. Пробовала 3 раза.", senderRole: "user", createdAt: daysAgo(1) },
    { ticketId: ticket1.id, senderId: adminId, content: "Здравствуйте! Подскажите, какой формат фотографий вы пытаетесь загрузить и какой у вас телефон?", senderRole: "admin", createdAt: hoursAgo(20) },
    { ticketId: ticket1.id, senderId: annaId, content: "iPhone 14, фотографии в формате HEIC.", senderRole: "user", createdAt: hoursAgo(18) },
  ] as any[]);
  console.log("  ✓ Support ticket from Anna (open)");

  const [ticket2] = await db.insert(supportTickets).values({
    userId: davidId,
    subject: "Вопрос по промо-пакетам",
    status: "resolved",
    createdAt: daysAgo(7),
  } as any).returning({ id: supportTickets.id });

  await db.insert(supportMessages).values([
    { ticketId: ticket2.id, senderId: davidId, content: "Какая разница между PRO и TURBO?", senderRole: "user", createdAt: daysAgo(7) },
    { ticketId: ticket2.id, senderId: adminId, content: "PRO включает бейдж PRO, золотое выделение, карусель и приоритет. TURBO — максимальный пакет с TOP-бейджем, увеличенной карточкой, Stories и секцией TOP.", senderRole: "admin", createdAt: daysAgo(6) },
    { ticketId: ticket2.id, senderId: davidId, content: "Спасибо, понял!", senderRole: "user", createdAt: daysAgo(5) },
  ] as any[]);
  console.log("  ✓ Support ticket from David (resolved)");

  // === NOTIFICATIONS ===
  console.log("\nCreating notifications...");
  await db.insert(notifications).values([
    { userId: annaId, type: "new_message", title: "Новое сообщение", body: "Арам ответил на ваше сообщение", data: JSON.stringify({ conversationId: conv1.id }), read: false, createdAt: hoursAgo(2) },
    { userId: aramId, type: "new_message", title: "Новое сообщение", body: "Анна написала вам", data: JSON.stringify({ conversationId: conv1.id }), read: true, createdAt: hoursAgo(3) },
    { userId: davidId, type: "new_message", title: "Новое сообщение", body: "Тигран ответил на ваше сообщение", data: JSON.stringify({ conversationId: conv2.id }), read: false, createdAt: hoursAgo(5) },
    { userId: dealerAutostarId, type: "promotion_expired", title: "Промо истекает", body: "Продвижение BMW X5 скоро закончится", data: JSON.stringify({ listingId: bmwX5.id }), read: false, createdAt: hoursAgo(12) },
    { userId: annaId, type: "listing_approved", title: "Объявление одобрено", body: "Ваше объявление Kia Rio опубликовано", data: JSON.stringify({ listingId: activeListings.find(l => l.brand === "Kia" && l.model === "Rio")!.id }), read: true, createdAt: daysAgo(3) },
  ] as any[]);
  console.log("  ✓ 5 notifications created");

  console.log("\n=== SEED COMPLETE ===");
  console.log(`\nUsers: ${testUsers.length}`);
  console.log(`Listings: ${listings.length}`);
  console.log(`Conversations: 3`);
  console.log(`Messages: 12`);
  console.log(`Promotions: 4 (2 TURBO, 2 PRO)`);
  console.log(`\nAll passwords: Test123!`);
  console.log("\nTest accounts:");
  console.log("  admin_armen — администратор");
  console.log("  dealer_autostar — дилер (премиальные авто)");
  console.log("  dealer_erevan_motors — дилер (массовый сегмент)");
  console.log("  seller_aram — частный продавец (Ереван)");
  console.log("  seller_tigran — перегонщик (Гюмри)");
  console.log("  buyer_anna — покупательница (активная)");
  console.log("  buyer_david — покупатель (Ванадзор)");
  console.log("  new_user_gohar — новый пользователь");

  process.exit(0);
}

function daysAgo(d: number, offsetHours = 0): Date {
  return new Date(Date.now() - d * 86400000 + offsetHours * 3600000);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
