import { cookies } from 'next/headers';

import { Chat } from '@components/chat';
import { DEFAULT_CHAT_MODEL } from '@lib/ai/models';
import { generateUUID } from '@lib/utils';
import { DataStreamHandler } from '@components/data-stream-handler';
import { auth } from '../(auth)/auth-helper';
import { redirect } from 'next/navigation';
import { getChatsByUserId, getMessagesByChatId } from '@lib/db/supabase-queries';

export default async function Page() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Try to get the user's most recent chat
  let id: string;
  let initialMessages: any[] = [];
  let initialVisibilityType: 'private' | 'public' = 'private';

  try {
    const { chats } = await getChatsByUserId({
      id: session.id,
      limit: 1,
      startingAfter: null,
      endingBefore: null,
    });

    if (chats && chats.length > 0) {
      // Resume the most recent chat
      const recentChat = chats[0];
      id = recentChat.id;
      initialVisibilityType = recentChat.visibility;
      
              // Load messages for the existing chat
        try {
          initialMessages = await getMessagesByChatId({ id });
        } catch (error) {
          initialMessages = [];
        }
    } else {
      // Create a new chat if no previous chats exist
      id = generateUUID();
    }
  } catch (error) {
    // Fallback to creating a new chat
    id = generateUUID();
  }

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model');

  return (
    <>
      <Chat
        id={id}
        initialMessages={initialMessages}
        initialChatModel={modelIdFromCookie?.value || DEFAULT_CHAT_MODEL}
        initialVisibilityType={initialVisibilityType}
        isReadonly={false}
        session={session}
        autoResume={true}
      />
      <DataStreamHandler />
    </>
  );
}
