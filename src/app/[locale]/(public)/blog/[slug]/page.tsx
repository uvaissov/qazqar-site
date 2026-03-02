import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getBlogPostBySlug } from "@/lib/data/content";
import JsonLd from "@/components/seo/JsonLd";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const locale = await getLocale();
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return { title: "Not Found" };
  }

  const title = locale === "kz" ? post.titleKz || post.titleRu : post.titleRu;

  return {
    title: `${title} | Qazqar`,
    description: title,
    openGraph: {
      title,
      type: "article",
      ...(post.coverImage && { images: [{ url: post.coverImage }] }),
    },
  };
}

export default async function BlogPostPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const locale = await getLocale();
  const t = await getTranslations("blog");

  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const title = locale === "kz" ? post.titleKz || post.titleRu : post.titleRu;
  const content =
    locale === "kz" ? post.contentKz || post.contentRu : post.contentRu;
  const dateStr = post.createdAt.toLocaleDateString(
    locale === "kz" ? "kk-KZ" : "ru-RU",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: title,
          ...(post.coverImage && { image: post.coverImage }),
          datePublished: post.createdAt.toISOString(),
          author: post.author
            ? {
                "@type": "Person",
                name: `${post.author.firstName} ${post.author.lastName}`,
              }
            : undefined,
        }}
      />
      <main className="min-h-screen bg-gray-50">
        {/* Cover image */}
        <div className="w-full bg-gray-100">
          {post.coverImage ? (
            <div className="max-w-5xl mx-auto">
              <Image
                src={post.coverImage}
                alt={title}
                width={1200}
                height={630}
                className="w-full rounded-xl object-cover"
              />
            </div>
          ) : (
            <div className="max-w-5xl mx-auto flex items-center justify-center h-48 text-gray-300">
              <svg
                className="w-20 h-20"
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

        {/* Article content */}
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back link */}
          <Link
            href="/blog"
            className="inline-block text-sm text-cyan-500 hover:text-cyan-600 transition-colors mb-6"
          >
            {t("backToBlog")}
          </Link>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            {title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-3 mt-4 text-sm text-gray-500">
            <time dateTime={post.createdAt.toISOString()}>{dateStr}</time>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span>
              {post.author.firstName} {post.author.lastName}
            </span>
          </div>

          {/* Divider */}
          <hr className="my-6 border-gray-200" />

          {/* Content */}
          <div
            className="prose prose-lg max-w-none text-gray-700 leading-relaxed
              [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-8 [&_h2]:mb-4
              [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mt-6 [&_h3]:mb-3
              [&_p]:mb-4
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4
              [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4
              [&_li]:mb-1
              [&_a]:text-cyan-500 [&_a]:underline [&_a:hover]:text-cyan-600
              [&_blockquote]:border-l-4 [&_blockquote]:border-cyan-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600
              [&_img]:rounded-lg [&_img]:my-6"
            dangerouslySetInnerHTML={{ __html: content }}
          />

          {/* Back link at bottom */}
          <div className="mt-10 pt-6 border-t border-gray-200">
            <Link
              href="/blog"
              className="inline-block text-cyan-500 font-semibold hover:text-cyan-600 transition-colors"
            >
              {t("backToBlog")}
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}
