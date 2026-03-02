import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getBlogPosts } from "@/lib/data/content";
import BlogCard from "@/components/blog/BlogCard";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("blog");
  return {
    title: `${t("title")} | Qazqar`,
    description: t("subtitle"),
  };
}

export default async function BlogPage(props: {
  searchParams: Promise<{ page?: string }>;
}) {
  const searchParams = await props.searchParams;
  const t = await getTranslations("blog");

  const page = Math.max(1, Number(searchParams.page) || 1);
  const { posts, totalPages } = await getBlogPosts(page);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Page header */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
          <p className="mt-2 text-gray-600">{t("subtitle")}</p>
        </div>
      </section>

      {/* Blog grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <svg
              className="mx-auto w-16 h-16 text-gray-300"
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
            <p className="mt-4 text-lg text-gray-500">{t("empty")}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-4 mt-10">
                {page > 1 ? (
                  <Link
                    href={`/blog?page=${page - 1}`}
                    className="px-4 py-2 text-sm font-medium text-cyan-500 border border-cyan-500 rounded-lg hover:bg-cyan-50 transition-colors"
                  >
                    {t("prev")}
                  </Link>
                ) : (
                  <span className="px-4 py-2 text-sm font-medium text-gray-300 border border-gray-200 rounded-lg cursor-not-allowed">
                    {t("prev")}
                  </span>
                )}

                <span className="text-sm text-gray-600">
                  {t("pageOf", { page, total: totalPages })}
                </span>

                {page < totalPages ? (
                  <Link
                    href={`/blog?page=${page + 1}`}
                    className="px-4 py-2 text-sm font-medium text-cyan-500 border border-cyan-500 rounded-lg hover:bg-cyan-50 transition-colors"
                  >
                    {t("next")}
                  </Link>
                ) : (
                  <span className="px-4 py-2 text-sm font-medium text-gray-300 border border-gray-200 rounded-lg cursor-not-allowed">
                    {t("next")}
                  </span>
                )}
              </nav>
            )}
          </>
        )}
      </section>
    </main>
  );
}
