export type DashboardBooking = {
  id: string;
  requestId: number | null;
  /** Очередь отправки в Yume: ⏳ / ⚠️ на карточке, пока нет requestId. */
  crmSyncStatus: "PENDING" | "DONE" | "FAILED" | null;
  status: "PENDING" | "RETURN_PENDING";
  startDate: string;
  endDate: string;
  totalPrice: number;
  customerName: string;
  customerPhone: string;
  createdAt: string;
  car: {
    brand: string;
    modelName: string;
    number: string | null;
  } | null;
};
