-- Migrate task statuses to TODO / IN_PROGRESS / DONE
CREATE TYPE "TaskStatus_new" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

ALTER TABLE "Task" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Task" ALTER COLUMN "status" TYPE "TaskStatus_new" USING (
  CASE "status"::text
    WHEN 'COMPLETED' THEN 'DONE'::"TaskStatus_new"
    WHEN 'REVIEW' THEN 'IN_PROGRESS'::"TaskStatus_new"
    ELSE "status"::text::"TaskStatus_new"
  END
);

DROP TYPE "TaskStatus";
ALTER TYPE "TaskStatus_new" RENAME TO "TaskStatus";
ALTER TABLE "Task" ALTER COLUMN "status" SET DEFAULT 'TODO';
