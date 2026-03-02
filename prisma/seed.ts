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

  // 2. Car brands
  const hyundai = await prisma.carBrand.upsert({
    where: { slug: 'hyundai' },
    update: {},
    create: { name: 'Hyundai', slug: 'hyundai' },
  });

  const kia = await prisma.carBrand.upsert({
    where: { slug: 'kia' },
    update: {},
    create: { name: 'KIA', slug: 'kia' },
  });

  const toyota = await prisma.carBrand.upsert({
    where: { slug: 'toyota' },
    update: {},
    create: { name: 'Toyota', slug: 'toyota' },
  });

  console.log(`Brands: ${hyundai.name}, ${kia.name}, ${toyota.name}`);

  // 3. Car models
  const accent = await prisma.carModel.upsert({
    where: { slug: 'accent' },
    update: {},
    create: { name: 'Accent', slug: 'accent', brandId: hyundai.id },
  });

  const elantra = await prisma.carModel.upsert({
    where: { slug: 'elantra' },
    update: {},
    create: { name: 'Elantra', slug: 'elantra', brandId: hyundai.id },
  });

  const sonata = await prisma.carModel.upsert({
    where: { slug: 'sonata' },
    update: {},
    create: { name: 'Sonata', slug: 'sonata', brandId: hyundai.id },
  });

  const k5 = await prisma.carModel.upsert({
    where: { slug: 'k5' },
    update: {},
    create: { name: 'K5', slug: 'k5', brandId: kia.id },
  });

  const camry = await prisma.carModel.upsert({
    where: { slug: 'camry' },
    update: {},
    create: { name: 'Camry', slug: 'camry', brandId: toyota.id },
  });

  console.log(`Models: ${accent.name}, ${elantra.name}, ${sonata.name}, ${k5.name}, ${camry.name}`);

  // 4. Cars
  const carsData = [
    { modelId: k5.id, year: 2021, color: 'White', pricePerDay: 32000, fuelType: 'AI95' as const, licensePlate: 'K5-2021-W', slug: 'kia-k5-2021-white' },
    { modelId: accent.id, year: 2021, color: 'White', pricePerDay: 16000, fuelType: 'AI92' as const, licensePlate: 'H465301', slug: 'hyundai-accent-2021-h465301' },
    { modelId: sonata.id, year: 2022, color: 'Black', pricePerDay: 35000, fuelType: 'AI95' as const, licensePlate: '736BJ02', slug: 'hyundai-sonata-2022-black' },
    { modelId: accent.id, year: 2021, color: 'White', pricePerDay: 16000, fuelType: 'AI92' as const, licensePlate: 'H482501', slug: 'hyundai-accent-2021-h482501' },
    { modelId: elantra.id, year: 2021, color: 'White', pricePerDay: 20000, fuelType: 'AI92' as const, licensePlate: 'H460501', slug: 'hyundai-elantra-2021-h460501' },
    { modelId: elantra.id, year: 2021, color: 'White', pricePerDay: 20000, fuelType: 'AI92' as const, licensePlate: 'H477601', slug: 'hyundai-elantra-2021-h477601' },
    { modelId: camry.id, year: 2016, color: 'White', pricePerDay: 25000, fuelType: 'AI95' as const, licensePlate: '638AFM01', slug: 'toyota-camry-2016-white' },
    { modelId: accent.id, year: 2021, color: 'White', pricePerDay: 16000, fuelType: 'AI92' as const, licensePlate: 'H508401', slug: 'hyundai-accent-2021-h508401' },
    { modelId: accent.id, year: 2017, color: 'White', pricePerDay: 14000, fuelType: 'AI92' as const, licensePlate: '276CH01', slug: 'hyundai-accent-2017-white' },
    { modelId: elantra.id, year: 2023, color: 'White', pricePerDay: 22000, fuelType: 'AI92' as const, licensePlate: '598AJV01', slug: 'hyundai-elantra-2023-white' },
    { modelId: accent.id, year: 2023, color: 'White', pricePerDay: 18000, fuelType: 'AI92' as const, licensePlate: '678CR01', slug: 'hyundai-accent-2023-678cr01' },
    { modelId: accent.id, year: 2018, color: 'White', pricePerDay: 14000, fuelType: 'AI92' as const, licensePlate: '348CI01', slug: 'hyundai-accent-2018-white' },
    { modelId: accent.id, year: 2023, color: 'White', pricePerDay: 18000, fuelType: 'AI92' as const, licensePlate: '546CQ01', slug: 'hyundai-accent-2023-546cq01' },
  ];

  let carsCreated = 0;
  for (const car of carsData) {
    await prisma.car.upsert({
      where: { licensePlate: car.licensePlate },
      update: {},
      create: {
        modelId: car.modelId,
        year: car.year,
        color: car.color,
        pricePerDay: car.pricePerDay,
        transmission: 'AUTOMATIC',
        fuelType: car.fuelType,
        seats: 5,
        hasAC: true,
        status: 'AVAILABLE',
        images: [],
        licensePlate: car.licensePlate,
        slug: car.slug,
      },
    });
    carsCreated++;
  }
  console.log(`Cars: ${carsCreated} upserted`);

  // 5. Discounts
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

  // Summary
  const counts = {
    users: await prisma.user.count(),
    brands: await prisma.carBrand.count(),
    models: await prisma.carModel.count(),
    cars: await prisma.car.count(),
    discounts: await prisma.discount.count(),
    faqItems: await prisma.faqItem.count(),
    reviews: await prisma.review.count(),
  };

  console.log('\n--- Seed Summary ---');
  console.log(`Users:     ${counts.users}`);
  console.log(`Brands:    ${counts.brands}`);
  console.log(`Models:    ${counts.models}`);
  console.log(`Cars:      ${counts.cars}`);
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
