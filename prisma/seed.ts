import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const email = process.env.OWNER_EMAIL;
  const password = process.env.OWNER_PASSWORD;

  if (!email || !password) {
    console.error("OWNER_EMAIL and OWNER_PASSWORD environment variables are required.");
    process.exit(1);
  }

  const existingOwner = await prisma.user.findUnique({
    where: { email },
  });

  if (existingOwner) {
    console.log("Owner account already exists.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name: "Tournament Owner",
      email: email,
      passwordHash: passwordHash,
      role: "OWNER",
    },
  });

  console.log("Owner account seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });