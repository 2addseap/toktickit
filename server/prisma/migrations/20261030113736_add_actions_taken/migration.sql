-- AlterTable
ALTER TABLE "users" ALTER COLUMN "mustChangePassword" SET DEFAULT false;

-- CreateTable
CREATE TABLE "actions_taken" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "performedById" INTEGER NOT NULL,
    "actionDateTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actionDescription" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followUpNote" TEXT,
    "attachmentNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actions_taken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "actions_taken_ticketId_idx" ON "actions_taken"("ticketId");

-- CreateIndex
CREATE INDEX "actions_taken_performedById_idx" ON "actions_taken"("performedById");

-- CreateIndex
CREATE INDEX "actions_taken_actionDateTime_idx" ON "actions_taken"("actionDateTime");

-- AddForeignKey
ALTER TABLE "actions_taken" ADD CONSTRAINT "actions_taken_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actions_taken" ADD CONSTRAINT "actions_taken_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
