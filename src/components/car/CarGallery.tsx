import { getTranslations } from "next-intl/server";

type CarGalleryProps = {
  images: string[];
  title: string;
};

export default async function CarGallery({ images, title }: CarGalleryProps) {
  const t = await getTranslations("carDetail");

  if (images.length === 0) {
    return (
      <div className="w-full aspect-[16/10] bg-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-400">
        <svg
          className="w-24 h-24 mb-3"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={0.8}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
          />
        </svg>
        <p className="text-lg font-medium">{title}</p>
        <p className="text-sm mt-1">{t("noImages")}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Main image */}
      <div className="w-full aspect-[16/10] bg-gray-100 rounded-xl overflow-hidden">
        <img
          src={images[0]}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-3">
          {images.slice(1, 5).map((src, i) => (
            <div
              key={i}
              className="aspect-[16/10] bg-gray-100 rounded-lg overflow-hidden"
            >
              <img
                src={src}
                alt={`${title} - ${i + 2}`}
                className="w-full h-full object-cover hover:opacity-80 transition-opacity"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
