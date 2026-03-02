import { getTranslations } from "next-intl/server";
import BlogForm from "@/components/admin/blog/BlogForm";

export default async function AdminBlogNewPage() {
  const t = await getTranslations("adminContent");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t("createPost")}
      </h1>
      <BlogForm mode="create" />
    </div>
  );
}
