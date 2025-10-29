import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { generateUUID } from '../utils';
import type { VisibilityType } from '@components/visibility-selector';
import { ChatSDKError } from '../errors';
import type { ArtifactKind } from '@components/artifact';
import { createServerSupabaseClient } from '../supabase';

export interface Chat {
  id: string;
  createdAt: string;
  title: string;
  userId: string;
  visibility: VisibilityType;
}

export interface DBMessage {
  id: string;
  chatId: string;
  role: string;
  parts: any;
  attachments: any;
  createdAt: string;
}

export interface Vote {
  chatId: string;
  messageId: string;
  isUpvoted: boolean;
}

export interface Document {
  id: string;
  createdAt: string;
  title: string;
  content?: string;
  kind: ArtifactKind;
  userId: string;
}

export interface Suggestion {
  id: string;
  documentId: string;
  documentCreatedAt: string;
  originalText: string;
  suggestedText: string;
  description?: string;
  isResolved: boolean;
  userId: string;
  createdAt: string;
}

export interface Stream {
  id: string;
  chatId: string;
  createdAt: string;
}

// Create a server-side client with service role key for elevated permissions
const createServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  return createClient(supabaseUrl, supabaseServiceKey);
};

// Create an authenticated client for user-specific operations
const createAuthenticatedClient = () => {
  return createServerSupabaseClient();
};

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
}) {
  try {
    const supabase = createAuthenticatedClient();
    
    const { error } = await supabase
      .from('Chat')
      .insert({
        id,
        createdAt: new Date().toISOString(),
        userId,
        title,
        visibility,
      });

    if (error) throw error;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save chat');
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    const supabase = createServiceClient();
    
    // Delete related records first
    await supabase.from('Vote_v2').delete().eq('chatId', id);
    await supabase.from('Message_v2').delete().eq('chatId', id);
    await supabase.from('Stream').delete().eq('chatId', id);
    
    // Delete the chat
    const { data, error } = await supabase
      .from('Chat')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete chat by id',
    );
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const supabase = createAuthenticatedClient();
    let query = supabase
      .from('Chat')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(limit + 1);

    if (startingAfter) {
      const { data: selectedChat } = await supabase
        .from('Chat')
        .select('createdAt')
        .eq('id', startingAfter)
        .single();

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${startingAfter} not found`,
        );
      }

      query = query.gt('createdAt', selectedChat.createdAt);
    } else if (endingBefore) {
      const { data: selectedChat } = await supabase
        .from('Chat')
        .select('createdAt')
        .eq('id', endingBefore)
        .single();

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${endingBefore} not found`,
        );
      }

      query = query.lt('createdAt', selectedChat.createdAt);
    }

    const { data, error } = await query;
    if (error) throw error;

    const chats = data || [];
    const hasMore = chats.length > limit;

    return {
      chats: hasMore ? chats.slice(0, limit) : chats,
      hasMore,
    };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get chats by user id',
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const supabase = createAuthenticatedClient();
    const { data, error } = await supabase
      .from('Chat')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get chat by id');
  }
}

export async function saveMessages({
  messages,
}: {
  messages: DBMessage[];
}) {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from('Message_v2')
      .insert(messages);

    if (error) {
      throw error;
    }
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save messages');
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    const supabase = createAuthenticatedClient();
    const { data, error } = await supabase
      .from('Message_v2')
      .select('*')
      .eq('chatId', id)
      .order('createdAt', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get messages by chat id',
    );
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const supabase = createServiceClient();
    
    // Check if vote exists
    const { data: existingVote } = await supabase
      .from('Vote_v2')
      .select('*')
      .eq('messageId', messageId)
      .single();

    if (existingVote) {
      const { error } = await supabase
        .from('Vote_v2')
        .update({ isUpvoted: type === 'up' })
        .eq('messageId', messageId)
        .eq('chatId', chatId);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('Vote_v2')
        .insert({
          chatId,
          messageId,
          isUpvoted: type === 'up',
        });

      if (error) throw error;
    }
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to vote message');
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('Vote_v2')
      .select('*')
      .eq('chatId', id);

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get votes by chat id',
    );
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('Document')
      .insert({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date().toISOString(),
      })
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save document');
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('Document')
      .select('*')
      .eq('id', id)
      .order('createdAt', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get documents by id',
    );
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('Document')
      .select('*')
      .eq('id', id)
      .order('createdAt', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get document by id',
    );
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    const supabase = createServiceClient();
    
    // Delete related suggestions first
    await supabase
      .from('Suggestion')
      .delete()
      .eq('documentId', id)
      .gt('documentCreatedAt', timestamp.toISOString());

    // Delete documents
    const { data, error } = await supabase
      .from('Document')
      .delete()
      .eq('id', id)
      .gt('createdAt', timestamp.toISOString())
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete documents by id after timestamp',
    );
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Suggestion[];
}) {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from('Suggestion')
      .insert(suggestions);

    if (error) throw error;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to save suggestions',
    );
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('Suggestion')
      .select('*')
      .eq('documentId', documentId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get suggestions by document id',
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    const supabase = createAuthenticatedClient();
    const { data, error } = await supabase
      .from('Message_v2')
      .select('*')
      .eq('id', id);

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message by id',
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const supabase = createServiceClient();
    
    // Get messages to delete
    const { data: messagesToDelete } = await supabase
      .from('Message_v2')
      .select('id')
      .eq('chatId', chatId)
      .gte('createdAt', timestamp.toISOString());

    if (messagesToDelete && messagesToDelete.length > 0) {
      const messageIds = messagesToDelete.map((message: { id: string }) => message.id);

      // Delete related votes
      await supabase
        .from('Vote_v2')
        .delete()
        .eq('chatId', chatId)
        .in('messageId', messageIds);

      // Delete messages
      await supabase
        .from('Message_v2')
        .delete()
        .eq('chatId', chatId)
        .in('id', messageIds);
    }
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete messages by chat id after timestamp',
    );
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from('Chat')
      .update({ visibility })
      .eq('id', chatId);

    if (error) throw error;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update chat visibility by id',
    );
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: { id: string; differenceInHours: number }) {
  try {
    const supabase = createServiceClient();
    const twentyFourHoursAgo = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000,
    ).toISOString();

    // First get all chat IDs for this user
    const { data: chatIds, error: chatError } = await supabase
      .from('Chat')
      .select('id')
      .eq('userId', id);

    if (chatError) throw chatError;

    if (!chatIds || chatIds.length === 0) {
      return 0;
    }

    const chatIdArray = chatIds.map((chat: { id: string }) => chat.id);

    // Then count messages in those chats
    const { count, error } = await supabase
      .from('Message_v2')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'user')
      .gte('createdAt', twentyFourHoursAgo)
      .in('chatId', chatIdArray);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message count by user id',
    );
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from('Stream')
      .insert({
        id: streamId,
        chatId,
        createdAt: new Date().toISOString(),
      });

    if (error) throw error;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create stream id',
    );
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('Stream')
      .select('id')
      .eq('chatId', chatId)
      .order('createdAt', { ascending: true });

    if (error) throw error;
    return (data || []).map(({ id }: { id: string }) => id);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get stream ids by chat id',
    );
  }
}
