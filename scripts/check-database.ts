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

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        country: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    console.log(`📊 Total Users: ${users.length}\n`);

    if (users.length === 0) {
      console.log("❌ No users found in database.");
      return;
    }

    // Display user information
    console.log("👥 User Details:\n");
    console.log("=".repeat(100));

    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User: ${user.name || "N/A"}`);
      console.log(`   Email: ${user.email || "N/A"}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Country: ${user.country || "N/A"}`);
      console.log(`   Avatar URL: ${user.avatarUrl || "❌ NULL/EMPTY"}`);
      
      if (user.avatarUrl) {
        console.log(`   ✅ Has uploaded image: ${user.avatarUrl}`);
        // Check if it's an ImageKit URL
        if (user.avatarUrl.includes("ik.imagekit.io")) {
          console.log(`   📸 ImageKit URL detected`);
        } else {
          console.log(`   ⚠️  Not an ImageKit URL`);
        }
      } else {
        console.log(`   🔄 Will use avatar fallback (robohash)`);
      }
      
      console.log("-".repeat(100));
    });

    // Summary statistics
    console.log("\n📈 Summary:\n");
    const usersWithAvatar = users.filter((u) => u.avatarUrl && u.avatarUrl.trim() !== "").length;
    const usersWithoutAvatar = users.length - usersWithAvatar;
    
    console.log(`   Total Users: ${users.length}`);
    console.log(`   Users with uploaded image: ${usersWithAvatar}`);
    console.log(`   Users without image (using fallback): ${usersWithoutAvatar}`);
    
    // Check recent registrations (last 5)
    console.log("\n🆕 Recent Registrations (Last 5):\n");
    const recentUsers = users.slice(0, 5);
    recentUsers.forEach((user, index) => {
      console.log(
        `${index + 1}. ${user.name} (${user.email}) - Avatar: ${user.avatarUrl ? "✅ Yes" : "❌ No"}`
      );
    });

    // Check for any issues
    console.log("\n🔎 Potential Issues:\n");
    const issues: string[] = [];
    
    users.forEach((user) => {
      if (user.avatarUrl && !user.avatarUrl.includes("http")) {
        issues.push(`User ${user.email} has invalid avatarUrl (not a URL): ${user.avatarUrl}`);
      }
      if (user.avatarUrl && user.avatarUrl.trim() === "") {
        issues.push(`User ${user.email} has empty string avatarUrl`);
      }
    });

    if (issues.length === 0) {
      console.log("   ✅ No issues found!");
    } else {
      issues.forEach((issue) => console.log(`   ⚠️  ${issue}`));
    }

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

