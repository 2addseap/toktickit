-- CreateEnum
CREATE TYPE "Role" AS ENUM ('REQUESTER', 'IT_STAFF', 'ADMINISTRATOR');

-- CreateEnum
CREATE TYPE "CommentType" AS ENUM ('PUBLIC', 'INTERNAL');

-- Rename requester_users table to users
ALTER TABLE "requester_users" RENAME TO "users";
ALTER TABLE "users" RENAME CONSTRAINT "requester_users_pkey" TO "users_pkey";
ALTER INDEX "requester_users_email_key" RENAME TO "users_email_key";

-- Add columns to users
ALTER TABLE "users" ADD COLUMN "passwordHash" TEXT NOT NULL DEFAULT '$2b$10$fsX43HK0t/hvyU7rCtrVT.WyjZ5zQYqKBdmb0PlOTIEEKUp/Lnmri';
ALTER TABLE "users" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'REQUESTER';
ALTER TABLE "users" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ALTER COLUMN "passwordHash" DROP DEFAULT;

-- Update existing tickets to backfill itPriority from requestedPriority
UPDATE "tickets" SET "itPriority" = "requestedPriority" WHERE "itPriority" IS NULL;
ALTER TABLE "tickets" ALTER COLUMN "itPriority" SET NOT NULL;
ALTER TABLE "tickets" ALTER COLUMN "itPriority" SET DEFAULT 'MEDIUM';

-- Add new columns to tickets
ALTER TABLE "tickets" ADD COLUMN "assignedToId" INTEGER;
ALTER TABLE "tickets" ADD COLUMN "resolvedIndicated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "tickets" ADD COLUMN "resolvedIndicatedAt" TIMESTAMP(3);

-- Update foreign key on tickets
ALTER TABLE "tickets" DROP CONSTRAINT IF EXISTS "tickets_requesterId_fkey";
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create indexes on tickets
CREATE INDEX "tickets_assignedToId_idx" ON "tickets"("assignedToId");
CREATE INDEX "tickets_itPriority_idx" ON "tickets"("itPriority");

-- CreateTable comments
CREATE TABLE "comments" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "type" "CommentType" NOT NULL DEFAULT 'PUBLIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "comments_ticketId_type_idx" ON "comments"("ticketId", "type");

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
