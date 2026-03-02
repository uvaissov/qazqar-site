"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

interface CarWithModel {
  id: string;
  licensePlate: string;
  year: number;
  color: string;
  pricePerDay: number;
  transmission: string;
  status: string;
  images: string[];
  model: {
    name: string;
    brand: {
      name: string;
    };
  };
}

interface CarsListProps {
  cars: CarWithModel[];
}

export default function CarsList({ cars }: CarsListProps) {
  const router = useRouter();
  const t = useTranslations("adminCars");

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("confirmDelete"))) return;

    try {
      const res = await fetch(`/api/admin/cars/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      AVAILABLE: "bg-green-100 text-green-700",
      RENTED: "bg-yellow-100 text-yellow-700",
      MAINTENANCE: "bg-red-100 text-red-700",
    };

    const labels: Record<string, string> = {
      AVAILABLE: t("available"),
      RENTED: t("rented"),
      MAINTENANCE: t("maintenance"),
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-700"}`}
      >
        {labels[status] || status}
      </span>
    );
  };

  if (cars.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <svg
          className="w-12 h-12 mx-auto text-gray-300 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
          />
        </svg>
        <p className="text-gray-500">{t("empty")}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium text-gray-500">
                {t("photo")}
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">
                {t("name")}
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">
                {t("year")}
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">
                {t("price")}
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">
                {t("status")}
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">
                {t("transmission")}
              </th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {cars.map((car) => (
              <tr key={car.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  {car.images.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={car.images[0]}
                      alt={`${car.model.brand.name} ${car.model.name}`}
                      className="w-16 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-10 bg-gray-100 rounded flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-gray-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                        />
                      </svg>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">
                    {car.model.brand.name} {car.model.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {car.licensePlate}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{car.year}</td>
                <td className="px-4 py-3 text-gray-600">
                  {car.pricePerDay.toLocaleString()} &#8376;
                </td>
                <td className="px-4 py-3">{statusBadge(car.status)}</td>
                <td className="px-4 py-3 text-gray-600">
                  {car.transmission === "AUTOMATIC" ? "AKPP" : "MKPP"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/cars/${car.id}/edit`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                        />
                      </svg>
                      {t("edit")}
                    </Link>
                    <button
                      onClick={() => handleDelete(car.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                      </svg>
                      {t("delete")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
