import { notFound, redirect } from 'next/navigation';

import { auth } from '@app/(auth)/auth-helper';
import { Chat } from '@components/chat';
import { getChatById, getMessagesByChatId } from '@lib/db/supabase-queries';
import { DataStreamHandler } from '@components/data-stream-handler';
import { DEFAULT_CHAT_MODEL } from '@lib/ai/models';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  let chat, messages;
  
  try {
    [chat, messages] = await Promise.all([
      getChatById({ id }),
      getMessagesByChatId({ id }),
    ]);
  } catch (error) {
    // If chat doesn't exist, treat it as a new chat (this is expected for new chats)
    chat = null;
    messages = [];
  }

  // If chat doesn't exist, we'll create it when the first message is sent
  // For now, just render the chat component with empty messages

  return (
    <>
      <Chat
        id={id}
        initialMessages={messages}
        initialChatModel={DEFAULT_CHAT_MODEL}
        initialVisibilityType={chat?.visibility || 'private'}
        isReadonly={false}
        session={session}
        autoResume={true}
      />
      <DataStreamHandler />
    </>
  );
}
