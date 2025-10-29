-- Enable Row Level Security on all tables
ALTER TABLE "Chat" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message_v2" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Vote_v2" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Suggestion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Stream" ENABLE ROW LEVEL SECURITY;

-- Chat policies
CREATE POLICY "Users can view their own chats" ON "Chat"
    FOR SELECT USING (auth.uid() = "userId");

CREATE POLICY "Users can insert their own chats" ON "Chat"
    FOR INSERT WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update their own chats" ON "Chat"
    FOR UPDATE USING (auth.uid() = "userId");

CREATE POLICY "Users can delete their own chats" ON "Chat"
    FOR DELETE USING (auth.uid() = "userId");

-- Message_v2 policies
CREATE POLICY "Users can view messages from their chats" ON "Message_v2"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "Chat" 
            WHERE "Chat"."id" = "Message_v2"."chatId" 
            AND "Chat"."userId" = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages to their chats" ON "Message_v2"
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM "Chat" 
            WHERE "Chat"."id" = "Message_v2"."chatId" 
            AND "Chat"."userId" = auth.uid()
        )
    );

CREATE POLICY "Users can update messages from their chats" ON "Message_v2"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM "Chat" 
            WHERE "Chat"."id" = "Message_v2"."chatId" 
            AND "Chat"."userId" = auth.uid()
        )
    );

CREATE POLICY "Users can delete messages from their chats" ON "Message_v2"
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM "Chat" 
            WHERE "Chat"."id" = "Message_v2"."chatId" 
            AND "Chat"."userId" = auth.uid()
        )
    );

-- Vote_v2 policies
CREATE POLICY "Users can view votes from their chats" ON "Vote_v2"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "Chat" 
            WHERE "Chat"."id" = "Vote_v2"."chatId" 
            AND "Chat"."userId" = auth.uid()
        )
    );

CREATE POLICY "Users can insert votes to their chats" ON "Vote_v2"
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM "Chat" 
            WHERE "Chat"."id" = "Vote_v2"."chatId" 
            AND "Chat"."userId" = auth.uid()
        )
    );

CREATE POLICY "Users can update votes from their chats" ON "Vote_v2"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM "Chat" 
            WHERE "Chat"."id" = "Vote_v2"."chatId" 
            AND "Chat"."userId" = auth.uid()
        )
    );

CREATE POLICY "Users can delete votes from their chats" ON "Vote_v2"
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM "Chat" 
            WHERE "Chat"."id" = "Vote_v2"."chatId" 
            AND "Chat"."userId" = auth.uid()
        )
    );

-- Document policies
CREATE POLICY "Users can view their own documents" ON "Document"
    FOR SELECT USING (auth.uid() = "userId");

CREATE POLICY "Users can insert their own documents" ON "Document"
    FOR INSERT WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update their own documents" ON "Document"
    FOR UPDATE USING (auth.uid() = "userId");

CREATE POLICY "Users can delete their own documents" ON "Document"
    FOR DELETE USING (auth.uid() = "userId");

-- Suggestion policies
CREATE POLICY "Users can view their own suggestions" ON "Suggestion"
    FOR SELECT USING (auth.uid() = "userId");

CREATE POLICY "Users can insert their own suggestions" ON "Suggestion"
    FOR INSERT WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update their own suggestions" ON "Suggestion"
    FOR UPDATE USING (auth.uid() = "userId");

CREATE POLICY "Users can delete their own suggestions" ON "Suggestion"
    FOR DELETE USING (auth.uid() = "userId");

-- Stream policies
CREATE POLICY "Users can view streams from their chats" ON "Stream"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "Chat" 
            WHERE "Chat"."id" = "Stream"."chatId" 
            AND "Chat"."userId" = auth.uid()
        )
    );

CREATE POLICY "Users can insert streams to their chats" ON "Stream"
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM "Chat" 
            WHERE "Chat"."id" = "Stream"."chatId" 
            AND "Chat"."userId" = auth.uid()
        )
    );

CREATE POLICY "Users can update streams from their chats" ON "Stream"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM "Chat" 
            WHERE "Chat"."id" = "Stream"."chatId" 
            AND "Chat"."userId" = auth.uid()
        )
    );

CREATE POLICY "Users can delete streams from their chats" ON "Stream"
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM "Chat" 
            WHERE "Chat"."id" = "Stream"."chatId" 
            AND "Chat"."userId" = auth.uid()
        )
    );
