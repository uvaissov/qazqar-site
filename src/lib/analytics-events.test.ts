import { afterEach, describe, expect, it, vi } from "vitest";
import { trackEvent } from "./analytics-events";

afterEach(() => vi.unstubAllGlobals());
describe("conversion events", () => {
  it("sends a booking conversion once through direct GA and the configured Metrika goal", () => {
    const gtag = vi.fn(), ym = vi.fn();
    vi.stubGlobal("window", { gtag, ym, qazqarMetrikaId: 123, dataLayer: [] });
    trackEvent("generate_lead", { lead_type: "booking", car_id: "car-1" });
    expect(gtag).toHaveBeenCalledExactlyOnceWith("event", "generate_lead", { lead_type: "booking", car_id: "car-1" });
    expect(ym).toHaveBeenCalledExactlyOnceWith(123, "reachGoal", "generate_lead", { lead_type: "booking", car_id: "car-1" });
    expect(window.dataLayer).toEqual([]);
  });
  it("queues contact clicks for GTM when direct GA is absent", () => {
    vi.stubGlobal("window", {});
    trackEvent("whatsapp_click", { placement: "model" });
    expect(window.dataLayer).toEqual([{ event: "whatsapp_click", placement: "model" }]);
  });
});
