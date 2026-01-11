/**
 * Database Inspection Script
 *
 * This script checks the database to see:
 * - All users and their avatarUrl values
 * - Recent registrations
 * - User data structure
 *
 * Usage:
 *   npx tsx scripts/check-database.ts
 *   or
 *   npx ts-node scripts/check-database.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log("🔍 Checking database...\n");

    // Helper to print table
    async function printTable(name: string, rows: any[]) {
      console.log(`\n=== ${name} (${rows.length}) ===`);
      if (rows.length === 0) {
        console.log("(empty)");
        return;
      }
      rows.forEach((row, i) => {
        console.log(`\n${i + 1}.`);
        Object.entries(row).forEach(([k, v]) => {
          console.log(`   ${k}: ${JSON.stringify(v)}`);
        });
      });
    }

    // Print all tables
    await printTable("User", await prisma.user.findMany());
    await printTable("Post", await prisma.post.findMany());
    await printTable("Comment", await prisma.comment.findMany());
    await printTable("PostLike", await prisma.postLike.findMany());
    await printTable("PostHelpful", await prisma.postHelpful.findMany());
    await printTable("CommentLike", await prisma.commentLike.findMany());
    await printTable("CommentHelpful", await prisma.commentHelpful.findMany());
    await printTable("SavedPost", await prisma.savedPost.findMany());
    await printTable("Report", await prisma.report.findMany());
    await printTable("Notification", await prisma.notification.findMany());
    await printTable("Account", await prisma.account.findMany());
    await printTable("Session", await prisma.session.findMany());
    await printTable(
      "VerificationToken",
      await prisma.verificationToken.findMany()
    );
  } catch (error) {
    console.error("❌ Error checking database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkDatabase()
  .then(() => {
    console.log("\n✅ Database check completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
