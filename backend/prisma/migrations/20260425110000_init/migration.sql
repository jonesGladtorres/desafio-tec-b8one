CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CANCELED');

CREATE TABLE "users" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "exams" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "preparation_instructions" TEXT,
  "duration_in_minutes" INTEGER NOT NULL,
  "price_cents" INTEGER NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "appointments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "exam_id" UUID NOT NULL,
  "scheduled_at" TIMESTAMP(3) NOT NULL,
  "notes" TEXT,
  "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "exams_name_key" ON "exams"("name");
CREATE UNIQUE INDEX "appointments_exam_schedule_unique" ON "appointments"("exam_id", "scheduled_at");
CREATE UNIQUE INDEX "appointments_user_schedule_unique" ON "appointments"("user_id", "scheduled_at");
CREATE INDEX "appointments_user_id_scheduled_at_idx" ON "appointments"("user_id", "scheduled_at");
CREATE INDEX "appointments_exam_id_scheduled_at_idx" ON "appointments"("exam_id", "scheduled_at");

ALTER TABLE "appointments"
ADD CONSTRAINT "appointments_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "appointments"
ADD CONSTRAINT "appointments_exam_id_fkey"
FOREIGN KEY ("exam_id") REFERENCES "exams"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
