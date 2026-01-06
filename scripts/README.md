# Database Scripts

This folder contains utility scripts for database inspection and maintenance.

## Available Scripts

### check-database.ts

Inspect user data in the database, including avatar URLs.

**Usage:**
```bash
# Using tsx (recommended)
npx tsx scripts/check-database.ts

# Or using ts-node
npx ts-node scripts/check-database.ts
```

**What it checks:**
- All users and their data
- Avatar URL values (uploaded images)
- Recent registrations
- Potential data issues

**Output:**
- Total number of users
- List of all users with their avatarUrl status
- Summary statistics
- Recent registrations
- Potential issues

---

## Installation

If you get errors running the scripts, install the required dependencies:

```bash
npm install --save-dev tsx ts-node
```

