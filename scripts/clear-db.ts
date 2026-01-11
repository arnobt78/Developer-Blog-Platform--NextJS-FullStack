// scripts/clear-db.ts
import { prisma } from "@/lib/prisma";

async function main() {
  // Order matters due to foreign key constraints

  // Delete in order of dependencies to avoid foreign key constraint errors
  await prisma.notification.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.savedPost.deleteMany({});
  await prisma.commentLike.deleteMany({});
  await prisma.commentHelpful.deleteMany({});
  await prisma.postLike.deleteMany({});
  await prisma.postHelpful.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.verificationToken.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("All data deleted from the database.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
