-- CreateTable: dossiers de la bibliothèque (arborescence)
CREATE TABLE "library_folders" (
    "id"          TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "parentId"    TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "library_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable: documents stockés dans Supabase Storage, métadonnées en DB
CREATE TABLE "library_documents" (
    "id"           TEXT NOT NULL,
    "folderId"     TEXT NOT NULL,
    "name"         TEXT NOT NULL,
    "filename"     TEXT NOT NULL,
    "mimeType"     TEXT NOT NULL,
    "size"         INTEGER NOT NULL,
    "storagePath"  TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "library_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: pas deux dossiers de même nom au même niveau
CREATE UNIQUE INDEX "library_folders_parentId_name_key" ON "library_folders"("parentId", "name");

-- AddForeignKey
ALTER TABLE "library_folders"
  ADD CONSTRAINT "library_folders_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "library_folders"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "library_folders"
  ADD CONSTRAINT "library_folders_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "persons"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "library_documents"
  ADD CONSTRAINT "library_documents_folderId_fkey"
  FOREIGN KEY ("folderId") REFERENCES "library_folders"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "library_documents"
  ADD CONSTRAINT "library_documents_uploadedById_fkey"
  FOREIGN KEY ("uploadedById") REFERENCES "persons"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
