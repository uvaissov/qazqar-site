import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import BlogForm from "@/components/admin/blog/BlogForm";

interface EditBlogPageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function AdminBlogEditPage({ params }: EditBlogPageProps) {
  const { id } = await params;
  const t = await getTranslations("adminContent");

  const post = await prisma.blogPost.findUnique({
    where: { id },
  });

  if (!post) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t("editPost")}
      </h1>
      <BlogForm mode="edit" post={JSON.parse(JSON.stringify(post))} />
    </div>
  );
}
