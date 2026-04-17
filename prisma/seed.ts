import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...\n');

  // 1. Admin user
  const passwordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@qazqar.kz' },
    update: {},
    create: {
      email: 'admin@qazqar.kz',
      phone: '+77763504141',
      passwordHash,
      firstName: 'Admin',
      lastName: 'Qazqar',
      role: 'ADMIN',
    },
  });
  console.log(`Admin user: ${admin.email}`);

  // Бренды, модели и авто заполняются из API (синхронизация с Yume Cloud CRM)

  // 2. Discounts
  await prisma.discount.deleteMany();
  const discountsData = [
    { minDays: 3, maxDays: 5, percent: 10 },
    { minDays: 6, maxDays: 15, percent: 20 },
    { minDays: 16, maxDays: 30, percent: 30 },
    { minDays: 31, maxDays: 365, percent: 40 },
  ];
  for (const d of discountsData) {
    await prisma.discount.create({ data: d });
  }
  console.log(`Discounts: ${discountsData.length} created`);

  // 3. No-deposit surcharges (Cardoo %)
  await prisma.noDepositSurcharge.deleteMany();
  const surchargesData = [
    { minDay: 1, maxDay: 1, percent: 3.00 },
    { minDay: 2, maxDay: 2, percent: 3.00 },
    { minDay: 3, maxDay: 3, percent: 3.00 },
    { minDay: 4, maxDay: 4, percent: 4.05 },
    { minDay: 5, maxDay: 5, percent: 5.10 },
    { minDay: 6, maxDay: 6, percent: 6.15 },
    { minDay: 7, maxDay: 7, percent: 7.20 },
    { minDay: 8, maxDay: 8, percent: 8.25 },
    { minDay: 9, maxDay: 9, percent: 9.30 },
    { minDay: 10, maxDay: 10, percent: 10.35 },
    { minDay: 11, maxDay: 11, percent: 11.40 },
    { minDay: 12, maxDay: 12, percent: 12.45 },
    { minDay: 13, maxDay: 30, percent: 13.00 },
    { minDay: 31, maxDay: 31, percent: 13.44 },
    { minDay: 32, maxDay: 32, percent: 13.88 },
    { minDay: 33, maxDay: 33, percent: 14.32 },
    { minDay: 34, maxDay: 34, percent: 14.76 },
    { minDay: 35, maxDay: 35, percent: 15.20 },
  ];
  for (const s of surchargesData) {
    await prisma.noDepositSurcharge.create({ data: s });
  }
  console.log(`Surcharges: ${surchargesData.length} created`);

  // 4. App settings
  const settingsData = [
    { key: 'vatPercent', value: '16' },
    { key: 'overflowDailyPercent', value: '0.44' },
  ];
  for (const s of settingsData) {
    await prisma.appSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log(`Settings: ${settingsData.length} upserted`);

  // 6. FAQ items
  await prisma.faqItem.deleteMany();
  const faqData = [
    {
      sortOrder: 1,
      questionRu: 'С какого возраста можно арендовать автомобиль?',
      questionKz: 'Неше жастан бастап автокөлік жалға алуға болады?',
      answerRu: 'Минимальный возраст для аренды — 21 год. Водительский стаж должен быть не менее 2 лет.',
      answerKz: 'Жалға алудың ең төменгі жасы — 21 жас. Жүргізу тәжірибесі кемінде 2 жыл болуы керек.',
    },
    {
      sortOrder: 2,
      questionRu: 'Какие документы нужны для аренды?',
      questionKz: 'Жалға алу үшін қандай құжаттар қажет?',
      answerRu: 'Для оформления аренды потребуется удостоверение личности (или паспорт) и водительское удостоверение.',
      answerKz: 'Жалға алуды рәсімдеу үшін жеке куәлік (немесе паспорт) және жүргізуші куәлігі қажет.',
    },
    {
      sortOrder: 3,
      questionRu: 'Как оплатить аренду?',
      questionKz: 'Жалға алу ақысын қалай төлеуге болады?',
      answerRu: 'Оплата принимается наличными или переводом на карту Kaspi. Оплата производится при получении автомобиля.',
      answerKz: 'Төлем қолма-қол немесе Kaspi картасына аударыммен қабылданады. Төлем автокөлікті алған кезде жүргізіледі.',
    },
    {
      sortOrder: 4,
      questionRu: 'Нужен ли залог?',
      questionKz: 'Кепілдік қажет пе?',
      answerRu: 'Да, при получении автомобиля вносится залог. Сумма залога зависит от класса автомобиля. Залог возвращается при возврате автомобиля в надлежащем состоянии.',
      answerKz: 'Иә, автокөлікті алған кезде кепілдік салынады. Кепілдік сомасы автокөлік класына байланысты. Кепілдік автокөлікті тиісті жағдайда қайтарған кезде қайтарылады.',
    },
    {
      sortOrder: 5,
      questionRu: 'Кто оплачивает топливо?',
      questionKz: 'Отынды кім төлейді?',
      answerRu: 'Автомобиль выдается с определённым уровнем топлива. Арендатор обязан вернуть автомобиль с тем же уровнем топлива. Расходы на топливо несёт арендатор.',
      answerKz: 'Автокөлік белгілі бір деңгейдегі отынмен беріледі. Жалға алушы автокөлікті сол деңгейдегі отынмен қайтаруға міндетті. Отын шығындарын жалға алушы көтереді.',
    },
    {
      sortOrder: 6,
      questionRu: 'Есть ли ограничение по пробегу?',
      questionKz: 'Жүгіріс бойынша шектеу бар ма?',
      answerRu: 'Лимит пробега составляет 250 км в сутки. Превышение оплачивается дополнительно по тарифу.',
      answerKz: 'Жүгіріс лимиті тәулігіне 250 км құрайды. Асып кету тариф бойынша қосымша төленеді.',
    },
    {
      sortOrder: 7,
      questionRu: 'Можно ли выезжать за пределы города?',
      questionKz: 'Қала шегінен шығуға болады ма?',
      answerRu: 'Выезд за пределы города Астаны разрешен по территории Казахстана. Выезд за пределы страны запрещён.',
      answerKz: 'Астана қаласынан тыс Қазақстан аумағы бойынша жүруге рұқсат етіледі. Ел шегінен тыс шығуға тыйым салынады.',
    },
    {
      sortOrder: 8,
      questionRu: 'Каков минимальный срок аренды?',
      questionKz: 'Ең аз жалға алу мерзімі қанша?',
      answerRu: 'Минимальный срок аренды — 1 сутки (24 часа).',
      answerKz: 'Ең аз жалға алу мерзімі — 1 тәулік (24 сағат).',
    },
    {
      sortOrder: 9,
      questionRu: 'Включена ли страховка?',
      questionKz: 'Сақтандыру қосылған ба?',
      answerRu: 'Все автомобили застрахованы по ОГПО (обязательное страхование гражданско-правовой ответственности). КАСКО не включено.',
      answerKz: 'Барлық автокөліктер МАЖО (азаматтық-құқықтық жауапкершілікті міндетті сақтандыру) бойынша сақтандырылған. КАСКО қосылмаған.',
    },
    {
      sortOrder: 10,
      questionRu: 'Где можно забрать и вернуть автомобиль?',
      questionKz: 'Автокөлікті қайда алып, қайда қайтаруға болады?',
      answerRu: 'Выдача и возврат автомобиля осуществляется по адресу нашего офиса в Астане. Доставка по городу возможна по договорённости.',
      answerKz: 'Автокөлікті беру және қайтару Астанадағы кеңсеміздің мекенжайы бойынша жүзеге асырылады. Қала бойынша жеткізу келісім бойынша мүмкін.',
    },
  ];
  for (const faq of faqData) {
    await prisma.faqItem.create({ data: faq });
  }
  console.log(`FAQ items: ${faqData.length} created`);

  // 7. Reviews
  await prisma.review.deleteMany();
  const reviewsData = [
    {
      authorName: 'Алмас',
      rating: 5,
      textRu: 'Отличный сервис! Машина была чистая и в идеальном состоянии. Буду обращаться снова.',
      textKz: 'Тамаша қызмет! Көлік таза және мінсіз жағдайда болды. Тағы да хабарласамын.',
      approved: true,
    },
    {
      authorName: 'Дана',
      rating: 5,
      textRu: 'Очень довольна арендой. Процесс оформления быстрый, цены адекватные. Рекомендую!',
      textKz: 'Жалға алуға өте ризамын. Рәсімдеу процесі жылдам, бағалар қолжетімді. Ұсынамын!',
      approved: true,
    },
    {
      authorName: 'Ерлан',
      rating: 5,
      textRu: 'Арендовал Kia K5 на неделю. Машина супер, расход топлива приятно удивил. Спасибо команде Qazqar!',
      textKz: 'Kia K5 бір аптаға жалға алдым. Көлік керемет, отын шығыны таңғалдырды. Qazqar командасына рахмет!',
      approved: true,
    },
    {
      authorName: 'Айгуль',
      rating: 4,
      textRu: 'Хороший сервис, вежливый персонал. Единственное — хотелось бы больше вариантов для выбора.',
      textKz: 'Жақсы қызмет, сыпайы қызметкерлер. Бір ғана тілек — таңдау үшін көбірек нұсқалар болса екен.',
      approved: true,
    },
  ];
  for (const review of reviewsData) {
    await prisma.review.create({ data: review });
  }
  console.log(`Reviews: ${reviewsData.length} created`);

  // 8. Addresses
  await prisma.address.deleteMany();
  const addressesData = [
    {
      name: 'Офис Qazqar (Конаев)',
      address: 'ул. Динмухамед Конаев, 2, Астана',
      lat: 51.130892,
      lng: 71.418401,
      isActive: true,
      sortOrder: 1,
    },
    {
      name: 'Офис Qazqar (Кабанбай батыра)',
      address: 'просп. Кабанбай батыра, 119, Астана',
      lat: 51.026815,
      lng: 71.460858,
      isActive: true,
      sortOrder: 2,
    },
  ];
  for (const addr of addressesData) {
    await prisma.address.create({ data: addr });
  }
  console.log(`Addresses: ${addressesData.length} created`);

  // Summary
  const counts = {
    users: await prisma.user.count(),
    discounts: await prisma.discount.count(),
    surcharges: await prisma.noDepositSurcharge.count(),
    settings: await prisma.appSetting.count(),
    faqItems: await prisma.faqItem.count(),
    reviews: await prisma.review.count(),
    addresses: await prisma.address.count(),
  };

  console.log('\n--- Seed Summary ---');
  console.log(`Users:     ${counts.users}`);
  console.log(`Discounts: ${counts.discounts}`);
  console.log(`FAQ Items: ${counts.faqItems}`);
  console.log(`Reviews:   ${counts.reviews}`);
  console.log('--------------------\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
