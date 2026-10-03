import { getPrisma } from "../src/prisma.js";
import bcrypt from "bcryptjs";

const categories = [
  "Account and Access",
  "Hardware",
  "Software",
  "Network",
];

const relatedSystems = [
  { name: "Corporate Laptop", category: "Hardware" },
  { name: "Campus Wi-Fi", category: "Network" },
  { name: "Email", category: "Software" },
  { name: "LEB2 App", category: "Software" },
  { name: "VPN", category: "Network" },
  { name: "Printer", category: "Hardware" },
  { name: "Grade Submission App", category: "Software" },
];

const defaultPasswordHash = bcrypt.hashSync("Password123!", 10);

const users = [
  // 1. Requesters (4 active, 1 inactive)
  {
    name: "Jennifer Anderson",
    email: "jennifer.anderson@kmutt.ac.th",
    role: "REQUESTER" as const,
    department: "Human Resources",
    isActive: true,
    mustChangePassword: true,
  },
  {
    name: "Michael Brown",
    email: "michael.brown@kmutt.ac.th",
    role: "REQUESTER" as const,
    department: "Finance",
    isActive: true,
    mustChangePassword: true,
  },
  {
    name: "Sarah Johnson",
    email: "sarah.johnson@kmutt.ac.th",
    role: "REQUESTER" as const,
    department: "Marketing",
    isActive: true,
    mustChangePassword: true,
  },
  {
    name: "David Lee",
    email: "david.lee@kmutt.ac.th",
    role: "REQUESTER" as const,
    department: "Engineering",
    isActive: true,
    mustChangePassword: true,
  },
  {
    name: "Alex Inactive",
    email: "alex.inactive@kmutt.ac.th",
    role: "REQUESTER" as const,
    department: "Contractor",
    isActive: false,
    mustChangePassword: true,
  },

  // 2. IT Staff (3 active, 1 inactive)
  {
    name: "Sarah IT",
    email: "sarah.it@kmutt.ac.th",
    role: "IT_STAFF" as const,
    department: "IT Support",
    isActive: true,
    mustChangePassword: true,
  },
  {
    name: "Mike IT",
    email: "mike.it@kmutt.ac.th",
    role: "IT_STAFF" as const,
    department: "IT Infrastructure",
    isActive: true,
    mustChangePassword: true,
  },
  {
    name: "Support IT",
    email: "support.it@kmutt.ac.th",
    role: "IT_STAFF" as const,
    department: "IT Helpdesk",
    isActive: true,
    mustChangePassword: true,
  },
  {
    name: "Inactive IT",
    email: "inactive.it@kmutt.ac.th",
    role: "IT_STAFF" as const,
    department: "IT Support",
    isActive: false,
    mustChangePassword: true,
  },

  // 3. Administrator (1 active)
  {
    name: "System Admin",
    email: "admin@kmutt.ac.th",
    role: "ADMINISTRATOR" as const,
    department: "IT Administration",
    isActive: true,
    mustChangePassword: false,
  },
];

async function main() {
  const prisma = getPrisma();

  // 1. Seed Categories
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // 2. Seed Related Systems
  for (const sys of relatedSystems) {
    await prisma.relatedSystem.upsert({
      where: { name: sys.name },
      update: { category: sys.category },
      create: { name: sys.name, category: sys.category },
    });
  }

  // 3. Seed Users with credentials
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        department: u.department,
        isActive: u.isActive,
        mustChangePassword: u.mustChangePassword,
        passwordHash: defaultPasswordHash,
      },
      create: {
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department,
        isActive: u.isActive,
        mustChangePassword: u.mustChangePassword,
        passwordHash: defaultPasswordHash,
      },
    });
  }

  // 4. Ensure existing tickets have itPriority set
  await prisma.$executeRawUnsafe(
    `UPDATE "tickets" SET "itPriority" = "requestedPriority" WHERE "itPriority" IS NULL;`
  );

  console.log(
    "Lab 3 Seeding completed successfully: Categories, Related Systems, and Users upserted."
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
