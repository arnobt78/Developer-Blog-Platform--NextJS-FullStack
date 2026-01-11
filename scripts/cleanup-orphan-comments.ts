// scripts/cleanup-orphan-comments.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupOrphanComments() {
  console.log("🔍 Cleaning up orphaned comments...");
  // Get all comments with a parentId
  const allComments = await prisma.comment.findMany({
    select: { id: true, parentId: true },
  });
  const allIds = new Set(allComments.map((c) => c.id));
  const orphans = allComments.filter(
    (c) => c.parentId && !allIds.has(c.parentId)
  );

  if (orphans.length === 0) {
    console.log("✅ No orphaned comments found.");
    return;
  }

  for (const orphan of orphans) {
    console.log(
      `Deleting orphan comment: ${orphan.id} (parentId: ${orphan.parentId})`
    );
    await prisma.commentLike.deleteMany({ where: { commentId: orphan.id } });
    await prisma.commentHelpful.deleteMany({ where: { commentId: orphan.id } });
    await prisma.comment.delete({ where: { id: orphan.id } });
  }

  console.log(`✅ Deleted ${orphans.length} orphaned comment(s).`);
}

cleanupOrphanComments()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
