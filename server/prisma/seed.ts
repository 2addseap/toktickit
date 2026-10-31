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

  // 5. Seed Realistic Tickets with Actions Taken (Lab 4 Sprint Increment)
  const catNetwork = await prisma.category.findUnique({ where: { name: "Network" } });
  const catHardware = await prisma.category.findUnique({ where: { name: "Hardware" } });
  const catSoftware = await prisma.category.findUnique({ where: { name: "Software" } });
  const catAccount = await prisma.category.findUnique({ where: { name: "Account and Access" } });

  const sysVpn = await prisma.relatedSystem.findUnique({ where: { name: "VPN" } });
  const sysWifi = await prisma.relatedSystem.findUnique({ where: { name: "Campus Wi-Fi" } });
  const sysLaptop = await prisma.relatedSystem.findUnique({ where: { name: "Corporate Laptop" } });
  const sysLeb2 = await prisma.relatedSystem.findUnique({ where: { name: "LEB2 App" } });
  const sysPrinter = await prisma.relatedSystem.findUnique({ where: { name: "Printer" } });
  const sysGrade = await prisma.relatedSystem.findUnique({ where: { name: "Grade Submission App" } });

  const reqJennifer = await prisma.user.findUnique({ where: { email: "jennifer.anderson@kmutt.ac.th" } });
  const reqMichael = await prisma.user.findUnique({ where: { email: "michael.brown@kmutt.ac.th" } });
  const reqSarah = await prisma.user.findUnique({ where: { email: "sarah.johnson@kmutt.ac.th" } });
  const reqDavid = await prisma.user.findUnique({ where: { email: "david.lee@kmutt.ac.th" } });

  const staffSarah = await prisma.user.findUnique({ where: { email: "sarah.it@kmutt.ac.th" } });
  const staffMike = await prisma.user.findUnique({ where: { email: "mike.it@kmutt.ac.th" } });
  const staffSupport = await prisma.user.findUnique({ where: { email: "support.it@kmutt.ac.th" } });

  if (
    catNetwork &&
    catHardware &&
    catSoftware &&
    catAccount &&
    sysVpn &&
    sysWifi &&
    sysLaptop &&
    sysLeb2 &&
    sysPrinter &&
    sysGrade &&
    reqJennifer &&
    reqMichael &&
    reqSarah &&
    reqDavid &&
    staffSarah &&
    staffMike &&
    staffSupport
  ) {
    // Ticket 1: Unassigned, New, High, 0 Actions Taken
    await prisma.ticket.upsert({
      where: { ticketNumber: "TKT-2026-00001" },
      update: {},
      create: {
        ticketNumber: "TKT-2026-00001",
        requesterId: reqJennifer.id,
        categoryId: catNetwork.id,
        relatedSystemId: sysVpn.id,
        summary: "VPN connection drops intermittently during large file transfers",
        description: "Whenever I transfer CAD assets larger than 500MB over VPN, the connection resets.",
        requestedPriority: "HIGH",
        itPriority: "HIGH",
        status: "New",
      },
    });

    // Ticket 2: Assigned to Sarah IT, In Progress, Urgent, Multiple Collaborative Actions Taken
    const t2 = await prisma.ticket.upsert({
      where: { ticketNumber: "TKT-2026-00002" },
      update: { assignedToId: staffSarah.id, status: "In Progress", itPriority: "URGENT" },
      create: {
        ticketNumber: "TKT-2026-00002",
        requesterId: reqJennifer.id,
        assignedToId: staffSarah.id,
        categoryId: catNetwork.id,
        relatedSystemId: sysWifi.id,
        summary: "Primary campus Wi-Fi access point offline in Building 4",
        description: "Entire 3rd floor unable to connect to Campus Wi-Fi since 8 AM.",
        requestedPriority: "HIGH",
        itPriority: "URGENT",
        status: "In Progress",
      },
    });

    // Seed Actions Taken for Ticket 2 (idempotent check)
    const existingT2Actions = await prisma.actionTaken.count({ where: { ticketId: t2.id } });
    if (existingT2Actions === 0) {
      await prisma.actionTaken.createMany({
        data: [
          {
            ticketId: t2.id,
            performedById: staffSarah.id,
            actionDateTime: new Date("2026-10-30T09:00:00Z"),
            actionDescription: "Inspected switch port power over ethernet (PoE) delivery on Switch-B4.",
            result: "PoE supply power-cycled; access point rebooted successfully.",
            followUpRequired: false,
            followUpNote: null,
            attachmentNotes: "switch-b4-port-log.txt",
          },
          {
            ticketId: t2.id,
            performedById: staffMike.id, // Collaborative execution by Mike IT!
            actionDateTime: new Date("2026-10-30T10:15:00Z"),
            actionDescription: "Conducted RF spectrum sweep and verified 5GHz signal coverage.",
            result: "Channel 36 and 40 signal strength normalized at -52 dBm across floor 3.",
            followUpRequired: true,
            followUpNote: "Inspect error packet counters after peak hours at 4 PM.",
            attachmentNotes: "rf-spectrum-scan.png",
          },
        ],
      });
    }

    // Ticket 3: Assigned to Mike IT, Waiting for Requester, Medium, 1 Action Taken
    const t3 = await prisma.ticket.upsert({
      where: { ticketNumber: "TKT-2026-00003" },
      update: { assignedToId: staffMike.id, status: "Waiting for Requester" },
      create: {
        ticketNumber: "TKT-2026-00003",
        requesterId: reqJennifer.id,
        assignedToId: staffMike.id,
        categoryId: catAccount.id,
        relatedSystemId: sysLeb2.id,
        summary: "Password reset and MFA sync request for portal access",
        description: "User lost authenticator device and needs temporary login credentials.",
        requestedPriority: "MEDIUM",
        itPriority: "MEDIUM",
        status: "Waiting for Requester",
      },
    });

    const existingT3Actions = await prisma.actionTaken.count({ where: { ticketId: t3.id } });
    if (existingT3Actions === 0) {
      await prisma.actionTaken.create({
        data: {
          ticketId: t3.id,
          performedById: staffMike.id,
          actionDateTime: new Date("2026-10-30T11:00:00Z"),
          actionDescription: "Issued temporary one-time passcode and triggered SMS verification.",
          result: "SMS delivery confirmed by gateway. Awaiting user login confirmation.",
          followUpRequired: true,
          followUpNote: "Close ticket if temporary passcode is not redeemed within 24 hours.",
        },
      });
    }

    // Ticket 4: Assigned to Sarah IT, Resolved, Medium, 1 Action Taken
    const t4 = await prisma.ticket.upsert({
      where: { ticketNumber: "TKT-2026-00004" },
      update: {
        assignedToId: staffSarah.id,
        status: "Resolved",
        summary: "Corporate laptop battery drains rapidly in under 1 hour (Requester 2)",
      },
      create: {
        ticketNumber: "TKT-2026-00004",
        requesterId: reqMichael.id,
        assignedToId: staffSarah.id,
        categoryId: catHardware.id,
        relatedSystemId: sysLaptop.id,
        summary: "Corporate laptop battery drains rapidly in under 1 hour (Requester 2)",
        description: "Battery health degraded; shuts down without warning.",
        requestedPriority: "MEDIUM",
        itPriority: "MEDIUM",
        status: "Resolved",
      },
    });

    const existingT4Actions = await prisma.actionTaken.count({ where: { ticketId: t4.id } });
    if (existingT4Actions === 0) {
      await prisma.actionTaken.create({
        data: {
          ticketId: t4.id,
          performedById: staffSarah.id,
          actionDateTime: new Date("2026-10-29T14:30:00Z"),
          actionDescription: "Installed OEM replacement 60Wh battery module and ran battery calibration cycle.",
          result: "Full battery diagnostic test passed with 100% health.",
          followUpRequired: false,
        },
      });
    }

    // Ticket 5: Assigned to Support IT, Closed, Low, 1 Action Taken
    const t5 = await prisma.ticket.upsert({
      where: { ticketNumber: "TKT-2026-00005" },
      update: { assignedToId: staffSupport.id, status: "Closed" },
      create: {
        ticketNumber: "TKT-2026-00005",
        requesterId: reqSarah.id,
        assignedToId: staffSupport.id,
        categoryId: catSoftware.id,
        relatedSystemId: sysGrade.id,
        summary: "Grade Submission App session timeout error",
        description: "Browser session was timing out prematurely while entering exam grades.",
        requestedPriority: "LOW",
        itPriority: "LOW",
        status: "Closed",
      },
    });

    const existingT5Actions = await prisma.actionTaken.count({ where: { ticketId: t5.id } });
    if (existingT5Actions === 0) {
      await prisma.actionTaken.create({
        data: {
          ticketId: t5.id,
          performedById: staffSupport.id,
          actionDateTime: new Date("2026-10-28T16:00:00Z"),
          actionDescription: "Purged corrupt local storage session keys and updated Chrome cookie policies.",
          result: "User logged in and verified seamless grade submission.",
          followUpRequired: false,
        },
      });
    }

    // Ticket 6: Unassigned, Open, Low, 0 Actions Taken
    await prisma.ticket.upsert({
      where: { ticketNumber: "TKT-2026-00006" },
      update: {},
      create: {
        ticketNumber: "TKT-2026-00006",
        requesterId: reqDavid.id,
        categoryId: catHardware.id,
        relatedSystemId: sysPrinter.id,
        summary: "Network printer jamming repeatedly on Tray 2",
        description: "Paper roller slips when pulling standard A4 sheets from Tray 2.",
        requestedPriority: "LOW",
        itPriority: "LOW",
        status: "Open",
      },
    });
  }

  console.log(
    "Lab 4 Seeding completed successfully: Categories, Related Systems, Users, Tickets, and Actions Taken upserted."
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
