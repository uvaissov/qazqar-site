import { getTranslations } from "next-intl/server";

type Review = {
  id: string;
  authorName: string;
  rating: number;
  textRu: string;
  createdAt: Date;
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${
            i < rating ? "text-yellow-400" : "text-gray-300"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default async function ReviewsSection({
  reviews,
}: {
  reviews: Review[];
}) {
  const t = await getTranslations("reviews");

  if (reviews.length === 0) return null;

  return (
    <section id="reviews" className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-12">
          <span className="text-cyan-500 font-semibold text-sm uppercase tracking-wider">
            {t("sectionTitle")}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">
            {t("title")}
          </h2>
        </div>

        {/* Reviews grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Avatar placeholder */}
                  <div className="w-10 h-10 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center font-semibold text-sm">
                    {review.authorName.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-gray-900">
                    {review.authorName}
                  </span>
                </div>
                <StarRating rating={review.rating} />
              </div>
              <p className="text-gray-600 leading-relaxed">{review.textRu}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
