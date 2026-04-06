import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import type { Transmission, CarStatus } from "@/generated/prisma/enums";
import { Users, Gauge, Wind, ChevronRight, Clock, CalendarClock } from "lucide-react";

type CarWithModel = {
  id: string;
  slug: string;
  year: number;
  color: string;
  transmission: Transmission;
  status: CarStatus;
  seats: number;
  hasAC: boolean;
  availableFrom: string | Date | null;
  nextBookingAt: string | Date | null;
  photos: { photo: { url: string } }[];
  model: {
    name: string;
    brand: {
      name: string;
    };
  };
};

function formatShortDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export default async function CarCard({ car }: { car: CarWithModel }) {
  const t = await getTranslations("catalog");

  const title = `${car.model.brand.name} ${car.model.name}`;
  const images = car.photos.map((p) => p.photo.url);
  const isRented = car.status === "RENTED";

  return (
    <div className="group relative bg-white rounded-[2rem] border border-gray-100 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-100/50 hover:-translate-y-1">
      {/* Car image */}
      <div className="p-3 pb-0">
        <div className="relative aspect-[16/10] bg-gray-50 rounded-2xl overflow-hidden">
          {images.length > 0 ? (
            <Image
              src={images[0]}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-200">
               <Gauge size={64} strokeWidth={1} />
            </div>
          )}

          {/* Year Badge */}
          <div className="absolute top-3 left-3 glass px-3 py-1 rounded-full text-xs font-bold text-gray-700">
            {car.year}
          </div>

          {/* Status Badge */}
          {isRented && (
            <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              {t("rented")}
            </div>
          )}
        </div>
      </div>

      {/* Card content */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
           <div>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-cyan-600 transition-colors">
                {title}
              </h3>
              <p className="text-sm text-gray-400 mt-1 uppercase tracking-widest font-medium">{car.color}</p>
           </div>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-3 gap-2 mb-6">
           <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-50 group-hover:bg-cyan-50 transition-colors">
              <Users className="w-4 h-4 text-gray-400 group-hover:text-cyan-500 mb-1" />
              <span className="text-xs font-bold text-gray-600">{car.seats}</span>
           </div>
           <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-50 group-hover:bg-cyan-50 transition-colors">
              <Gauge className="w-4 h-4 text-gray-400 group-hover:text-cyan-500 mb-1" />
              <span className="text-xs font-bold text-gray-600">{car.transmission === "AUTOMATIC" ? "АКПП" : "МКПП"}</span>
           </div>
           <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-50 group-hover:bg-cyan-50 transition-colors">
              <Wind className="w-4 h-4 text-gray-400 group-hover:text-cyan-500 mb-1" />
              <span className="text-xs font-bold text-gray-600">{car.hasAC ? "A/C" : "—"}</span>
           </div>
        </div>

        {/* Availability info */}
        {isRented && car.availableFrom && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            {t("availableFrom")} {formatShortDate(car.availableFrom)}
          </div>
        )}
        {!isRented && car.nextBookingAt && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-amber-50 text-amber-600 rounded-xl text-xs font-bold">
            <CalendarClock className="w-3.5 h-3.5 flex-shrink-0" />
            {t("bookedFrom")} {formatShortDate(car.nextBookingAt)}
          </div>
        )}

        {/* CTA */}
        <Link
          href={`/catalog/${car.slug}`}
          className="group/btn flex items-center justify-center w-full py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-cyan-600 transition-all duration-300 active:scale-95 overflow-hidden relative"
        >
          <span className="relative z-10">{t("rent")}</span>
          <ChevronRight className="w-5 h-5 ml-2 relative z-10 group-hover/btn:translate-x-1 transition-transform" />
          
          {/* Button hover effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
        </Link>
      </div>
    </div>
  );
}
