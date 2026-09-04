import { getPrisma } from "../src/prisma.js";

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

const requesters = [
  {
    name: "Jennifer Anderson",
    email: "jennifer.anderson@kmutt.ac.th",
    department: "Human Resources",
    isActive: true,
  },
  {
    name: "Michael Brown",
    email: "michael.brown@kmutt.ac.th",
    department: "Finance",
    isActive: true,
  },
  {
    name: "Sarah Johnson",
    email: "sarah.johnson@kmutt.ac.th",
    department: "Marketing",
    isActive: true,
  },
  {
    name: "David Lee",
    email: "david.lee@kmutt.ac.th",
    department: "Engineering",
    isActive: true,
  },
  {
    name: "Alex Inactive",
    email: "alex.inactive@kmutt.ac.th",
    department: "Contractor",
    isActive: false,
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

  // 3. Seed Development Requesters
  for (const req of requesters) {
    await prisma.requesterUser.upsert({
      where: { email: req.email },
      update: {
        name: req.name,
        department: req.department,
        isActive: req.isActive,
      },
      create: {
        name: req.name,
        email: req.email,
        department: req.department,
        isActive: req.isActive,
      },
    });
  }

  console.log(
    "Lab 2 Seeding completed successfully: Categories, Related Systems, and Requesters upserted."
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
