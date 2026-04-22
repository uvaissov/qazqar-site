export type DashboardBooking = {
  id: string;
  requestId: number | null;
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
