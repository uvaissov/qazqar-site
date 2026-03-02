import { getTranslations } from "next-intl/server";
import { Quote, Star } from "lucide-react";

type Review = {
  id: string;
  authorName: string;
  rating: number;
  textRu: string;
  createdAt: Date;
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"
          }`}
        />
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
    <section id="reviews" className="py-24 md:py-32 bg-gray-50/30 overflow-hidden relative">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-100/20 rounded-full blur-3xl" />
      
      <div className="max-w-7xl mx-auto px-4 relative">
        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <span className="text-cyan-500 font-bold uppercase tracking-widest text-sm">
              {t("sectionTitle")}
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mt-2 tracking-tight">
              {t("title")}
            </h2>
          </div>
          <div className="flex gap-2 mb-2">
             {[...Array(3)].map((_, i) => (
               <div key={i} className={`h-2 rounded-full bg-cyan-500 ${i === 0 ? 'w-8' : 'w-2 opacity-20'}`} />
             ))}
          </div>
        </div>

        {/* Reviews grid - Masonry-like with Bento Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reviews.map((review, index) => (
            <div
              key={review.id}
              className={`group relative glass rounded-[2.5rem] p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-100/50 ${
                index % 3 === 1 ? 'md:mt-8' : ''
              }`}
            >
              <div className="absolute top-6 right-8 text-cyan-100 group-hover:text-cyan-200 transition-colors">
                 <Quote size={40} strokeWidth={3} />
              </div>

              <div className="flex items-center gap-4 mb-6 relative z-10">
                {/* Avatar */}
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-cyan-200">
                  {review.authorName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">
                    {review.authorName}
                  </h4>
                  <StarRating rating={review.rating} />
                </div>
              </div>

              <p className="text-gray-600 leading-relaxed text-lg italic relative z-10">
                &quot;{review.textRu}&quot;
              </p>
              
              <div className="mt-6 pt-6 border-t border-gray-100 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <span className="text-xs font-bold text-cyan-600 uppercase tracking-widest">Проверенный отзыв</span>
                 <div className="w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                       <path d="M5 13l4 4L19 7" />
                    </svg>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
