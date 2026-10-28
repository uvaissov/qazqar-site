import { beforeEach, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";
const state = vi.hoisted(() => ({ status: "PENDING", source: "SITE", quote: vi.fn() }));
vi.mock("@/lib/prisma", () => {
  const booking = {
    findUnique: async () => ({ id: "booking", status: state.status, source: state.source, requestId: null, userId: "user", user: null }),
    update: async ({ data }: { data: { status: string } }) => { state.status = data.status; },
    findFirst: async ({ where }: { where: { status: { in: string[] } } }) => where.status.in.includes(state.status) ? { id: "booking" } : null,
  };
  return { prisma: {
    booking,
    car: { findUnique: async () => ({ id: "car", status: "AVAILABLE", isHidden: false, isArchived: false }) },
    $transaction: async (run: (tx: unknown) => unknown) => run({ $queryRaw: vi.fn(), booking }),
  } };
});
vi.mock("@/lib/pricing", () => ({ quote: state.quote, isQuoteError: () => false }));
vi.mock("@/lib/events/booking-events", () => ({ emitBookingChanged: vi.fn() }));
import { cancelLocalBooking } from "./cancel-local-booking";
import { GET } from "@/app/api/catalog/[id]/price/route";
const price = () => GET(new NextRequest("http://localhost/api/catalog/car/price?dateStart=2030-10-02&dateEnd=2030-10-04"), { params: Promise.resolve({ id: "car" }) });
beforeEach(() => {
  vi.clearAllMocks();
  state.status = "PENDING";
  state.quote.mockResolvedValue({ pricePerDay: 20000, totalPrice: 40000, deposit: 30000, withoutDeposit: 5000, tariff: {}, tier: { id: "tier" } });
});
test.each(["SITE", "MOBILE"])("локальная заявка из %s блокирует даты; после отмены цена снова доступна", async (source) => {
  state.source = source;
  expect(await (await price()).json()).toMatchObject({ available: false, error: "CAR_UNAVAILABLE" });
  expect(state.quote).not.toHaveBeenCalled();
  expect(await cancelLocalBooking("booking", null)).toEqual({ ok: true });
  expect(await (await price()).json()).toMatchObject({ available: true });
  expect(state.quote).toHaveBeenCalledTimes(1);
});
