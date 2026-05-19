import prisma from "./db/prisma.js";
async function main() {
  console.log("keys:", Object.keys(prisma));
  console.log("user exists:", "user" in prisma);

  const users = await prisma.user.findMany();
  console.log(users);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });