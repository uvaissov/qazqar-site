import { prisma } from "@/lib/prisma";

export async function getDiscounts() {
  return prisma.discount.findMany({
    where: { active: true },
    orderBy: { minDays: "asc" },
  });
}

export async function getReviews() {
  return prisma.review.findMany({
    where: { approved: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getFaqItems() {
  return prisma.faqItem.findMany({
    where: { published: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getBlogPosts(page = 1, perPage = 9) {
  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: { author: { select: { firstName: true, lastName: true } } },
    }),
    prisma.blogPost.count({ where: { published: true } }),
  ]);
  return { posts, total, totalPages: Math.ceil(total / perPage) };
}

export async function getBlogPostBySlug(slug: string) {
  return prisma.blogPost.findUnique({
    where: { slug, published: true },
    include: { author: { select: { firstName: true, lastName: true } } },
  });
}
