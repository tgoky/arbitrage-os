-- CreateTable
CREATE TABLE "public"."workspaces" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "color" VARCHAR(50) DEFAULT 'bg-blue-700',
    "created_at" TIMESTAMPTZ(6) DEFAULT timezone('utc'::text, now()),
    "updated_at" TIMESTAMPTZ(6) DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."deliverables" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "user_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "client_id" UUID,
    "metadata" JSONB,
    "tags" TEXT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "deliverables_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_workspaces_slug" ON "public"."workspaces"("slug");

-- CreateIndex
CREATE INDEX "idx_workspaces_user_id" ON "public"."workspaces"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_user_id_slug_key" ON "public"."workspaces"("user_id", "slug");

-- CreateIndex
CREATE INDEX "idx_deliverables_user_id" ON "public"."deliverables"("user_id");

-- CreateIndex
CREATE INDEX "idx_deliverables_workspace_id" ON "public"."deliverables"("workspace_id");

-- AddForeignKey
ALTER TABLE "public"."deliverables" ADD CONSTRAINT "deliverables_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
