import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

type BlogPost = {
  id: string;
  slug: string;
  titleRu: string;
  titleKz: string | null;
  coverImage: string | null;
  createdAt: Date;
  author: {
    firstName: string;
    lastName: string;
  };
};

export default async function BlogCard({ post }: { post: BlogPost }) {
  const locale = await getLocale();
  const t = await getTranslations("blog");

  const title =
    locale === "kz" ? post.titleKz || post.titleRu : post.titleRu;
  const dateStr = post.createdAt.toLocaleDateString(
    locale === "kz" ? "kk-KZ" : "ru-RU",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <article className="group rounded-xl bg-white border border-gray-100 overflow-hidden transition-shadow hover:shadow-lg">
      {/* Cover image */}
      <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
        {post.coverImage ? (
          <img
            src={post.coverImage}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg
              className="w-16 h-16"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6V7.5Z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Card content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
          {title}
        </h3>

        <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
          <time dateTime={post.createdAt.toISOString()}>{dateStr}</time>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <span>
            {post.author.firstName} {post.author.lastName}
          </span>
        </div>

        <Link
          href={`/blog/${post.slug}`}
          className="mt-4 inline-block text-cyan-500 font-semibold hover:text-cyan-600 transition-colors"
        >
          {t("readMore")} &rarr;
        </Link>
      </div>
    </article>
  );
}
