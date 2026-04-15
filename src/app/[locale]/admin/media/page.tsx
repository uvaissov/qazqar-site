import { prisma } from "@/lib/prisma";
import MediaManager from "@/components/admin/media/MediaManager";

export default async function AdminMediaPage() {
  const photos = await prisma.photo.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Медиа</h1>
        <p className="text-sm text-gray-500 mt-1">Управление фотографиями</p>
      </div>
      <MediaManager initialPhotos={JSON.parse(JSON.stringify(photos))} />
    </div>
  );
}
