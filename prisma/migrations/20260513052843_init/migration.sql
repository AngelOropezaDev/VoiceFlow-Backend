-- CreateEnum
CREATE TYPE "AudioStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "IntegrationType" AS ENUM ('GMAIL', 'NOTION');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "credits" INTEGER NOT NULL DEFAULT 10,
    "googleAccessToken" TEXT,
    "googleRefreshToken" TEXT,
    "notionAccessToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audios" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "storageKey" TEXT NOT NULL,
    "status" "AudioStatus" NOT NULL DEFAULT 'PENDING',
    "duration" DOUBLE PRECISION NOT NULL,
    "fileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_contents" (
    "id" UUID NOT NULL,
    "audioId" UUID NOT NULL,
    "transcription" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "actionItems" JSONB NOT NULL,
    "draftEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_logs" (
    "id" UUID NOT NULL,
    "audioId" UUID NOT NULL,
    "type" "IntegrationType" NOT NULL,
    "status" "IntegrationStatus" NOT NULL,
    "externalId" TEXT,
    "errorMsg" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "audios_userId_idx" ON "audios"("userId");

-- CreateIndex
CREATE INDEX "audios_status_idx" ON "audios"("status");

-- CreateIndex
CREATE INDEX "audios_userId_status_idx" ON "audios"("userId", "status");

-- CreateIndex
CREATE INDEX "audios_createdAt_idx" ON "audios"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ai_contents_audioId_key" ON "ai_contents"("audioId");

-- CreateIndex
CREATE INDEX "ai_contents_audioId_idx" ON "ai_contents"("audioId");

-- CreateIndex
CREATE INDEX "integration_logs_audioId_idx" ON "integration_logs"("audioId");

-- CreateIndex
CREATE INDEX "integration_logs_type_status_idx" ON "integration_logs"("type", "status");

-- AddForeignKey
ALTER TABLE "audios" ADD CONSTRAINT "audios_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_contents" ADD CONSTRAINT "ai_contents_audioId_fkey" FOREIGN KEY ("audioId") REFERENCES "audios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_logs" ADD CONSTRAINT "integration_logs_audioId_fkey" FOREIGN KEY ("audioId") REFERENCES "audios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
