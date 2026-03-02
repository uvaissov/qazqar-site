import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Gauge } from "lucide-react";
import { cn } from "@/lib/utils";

type CarGalleryProps = {
  images: string[];
  title: string;
};

export default async function CarGallery({ images, title }: CarGalleryProps) {
  const t = await getTranslations("carDetail");

  if (images.length === 0) {
    return (
      <div className="w-full aspect-[16/10] glass rounded-[2.5rem] flex flex-col items-center justify-center text-gray-400">
        <Gauge size={64} strokeWidth={1} className="mb-4 text-gray-300" />
        <p className="text-xl font-bold text-gray-900">{title}</p>
        <p className="text-sm mt-2 text-gray-500">{t("noImages")}</p>
      </div>
    );
  }

  // Bento style logic for images
  // Main image takes full width if there's only 1.
  // If 2 images: 1 large, 1 small.
  // If 3+ images: 1 large on top, grid below.

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Main large image */}
      <div className={cn(
        "relative bg-gray-100 rounded-[2rem] overflow-hidden group col-span-1 md:col-span-4",
        images.length === 1 ? "aspect-[16/10]" : "aspect-[16/9] md:aspect-[21/9]"
      )}>
        <Image
          src={images[0]}
          alt={title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700"
          priority
        />
      </div>

      {/* Thumbnails Bento Grid */}
      {images.length > 1 && images.slice(1, 5).map((src, i) => {
         // Different spans depending on how many images we have
         const isLastAndOdd = images.length === 2 && i === 0;
         const isThreeImages = images.length === 3;
         const colSpan = isLastAndOdd ? "md:col-span-4" : isThreeImages ? "md:col-span-2" : "md:col-span-1";
         
         return (
          <div
            key={i}
            className={cn(
              "relative bg-gray-100 rounded-3xl overflow-hidden group aspect-[4/3] md:aspect-auto md:h-48",
              colSpan
            )}
          >
            <Image
              src={src}
              alt={`${title} - ${i + 2}`}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
            
            {/* Show "more images" overlay on the 4th thumbnail if there are > 5 total images */}
            {i === 3 && images.length > 5 && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-bold">
                +{images.length - 5}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
