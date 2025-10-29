-- Drop all existing tables to start fresh
DROP TABLE IF EXISTS "Vote_v2" CASCADE;
DROP TABLE IF EXISTS "Message_v2" CASCADE;
DROP TABLE IF EXISTS "Stream" CASCADE;
DROP TABLE IF EXISTS "Vote" CASCADE;
DROP TABLE IF EXISTS "Message" CASCADE;
DROP TABLE IF EXISTS "Suggestion" CASCADE;
DROP TABLE IF EXISTS "Document" CASCADE;
DROP TABLE IF EXISTS "Chat" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- Create Chat table without foreign key to User (since we use Supabase Auth)
CREATE TABLE IF NOT EXISTS "Chat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp NOT NULL,
	"title" text NOT NULL,
	"visibility" varchar DEFAULT 'private' NOT NULL,
	"userId" uuid NOT NULL
);

-- Create Message_v2 table
CREATE TABLE IF NOT EXISTS "Message_v2" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chatId" uuid NOT NULL,
	"role" varchar NOT NULL,
	"parts" json NOT NULL,
	"attachments" json NOT NULL,
	"createdAt" timestamp NOT NULL
);

-- Create Vote_v2 table
CREATE TABLE IF NOT EXISTS "Vote_v2" (
	"chatId" uuid NOT NULL,
	"messageId" uuid NOT NULL,
	"isUpvoted" boolean NOT NULL,
	CONSTRAINT "Vote_v2_chatId_messageId_pk" PRIMARY KEY("chatId","messageId")
);

-- Create Document table
CREATE TABLE IF NOT EXISTS "Document" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"kind" varchar NOT NULL,
	"userId" uuid NOT NULL,
	CONSTRAINT "Document_id_pk" PRIMARY KEY("id")
);

-- Create Suggestion table
CREATE TABLE IF NOT EXISTS "Suggestion" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"documentId" uuid NOT NULL,
	"documentCreatedAt" timestamp NOT NULL,
	"originalText" text NOT NULL,
	"suggestedText" text NOT NULL,
	"description" text,
	"isResolved" boolean DEFAULT false NOT NULL,
	"userId" uuid NOT NULL,
	"createdAt" timestamp NOT NULL,
	CONSTRAINT "Suggestion_id_pk" PRIMARY KEY("id")
);

-- Create Stream table
CREATE TABLE IF NOT EXISTS "Stream" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"chatId" uuid NOT NULL,
	"createdAt" timestamp NOT NULL,
	CONSTRAINT "Stream_id_pk" PRIMARY KEY("id")
);

-- Add foreign key constraints (only for tables that reference each other, not User)
ALTER TABLE "Message_v2" ADD CONSTRAINT "Message_v2_chatId_Chat_id_fk" 
	FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE;

ALTER TABLE "Vote_v2" ADD CONSTRAINT "Vote_v2_chatId_Chat_id_fk" 
	FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE;

ALTER TABLE "Vote_v2" ADD CONSTRAINT "Vote_v2_messageId_Message_v2_id_fk" 
	FOREIGN KEY ("messageId") REFERENCES "Message_v2"("id") ON DELETE CASCADE;

ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_documentId_Document_id_fk" 
	FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE;

ALTER TABLE "Stream" ADD CONSTRAINT "Stream_chatId_Chat_id_fk" 
	FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "Chat_userId_idx" ON "Chat"("userId");
CREATE INDEX IF NOT EXISTS "Chat_createdAt_idx" ON "Chat"("createdAt");
CREATE INDEX IF NOT EXISTS "Message_v2_chatId_idx" ON "Message_v2"("chatId");
CREATE INDEX IF NOT EXISTS "Message_v2_createdAt_idx" ON "Message_v2"("createdAt");
CREATE INDEX IF NOT EXISTS "Document_userId_idx" ON "Document"("userId");
CREATE INDEX IF NOT EXISTS "Document_kind_idx" ON "Document"("kind");
CREATE INDEX IF NOT EXISTS "Suggestion_documentId_idx" ON "Suggestion"("documentId");
CREATE INDEX IF NOT EXISTS "Stream_chatId_idx" ON "Stream"("chatId");
