// testConnection.ts
import "dotenv/config";
import prisma from "./src/db/prisma.js"; 

async function runTest() {
  console.log("⏳ Testing database connection...");
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Connection successful!");
  } catch (error) {
    console.error("❌ Connection failed!");
    console.error(error);
  } finally {
    await prisma.$disconnect();
    console.log("🔌 Prisma disconnected.");
  }
}

runTest();