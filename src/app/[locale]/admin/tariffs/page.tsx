import { prisma } from "@/lib/prisma";
import { getSeasonBounds } from "@/lib/pricing";
import TariffsManager from "@/components/admin/tariffs/TariffsManager";

export default async function AdminTariffsPage() {
  const [tariffs, season] = await Promise.all([
    prisma.tariff.findMany({
      include: {
        tiers: { orderBy: { minDays: "asc" } },
        cars: {
          select: { id: true, number: true, year: true, model: { select: { name: true, brand: { select: { name: true } } } } },
          orderBy: { number: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
    getSeasonBounds(),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Тарифы</h1>
        <p className="text-sm text-gray-500 mt-1">
          Цена за сутки по ступеням срока аренды, летняя и зимняя. Машина без тарифа не бронируется;
          дольше последней ступени арендовать нельзя.
        </p>
      </div>
      <TariffsManager tariffs={JSON.parse(JSON.stringify(tariffs))} season={season} />
    </div>
  );
}
