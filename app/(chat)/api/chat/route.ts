import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  smoothStream,
  streamText,
} from 'ai';
import { generateUUID } from '@lib/utils';
import { auth, type UserType } from '@app/(auth)/auth-helper';
import { systemPrompt } from '@lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  saveChat,
  saveMessages,
} from '@lib/db/supabase-queries';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@lib/ai/tools/create-document';
import { updateDocument } from '@lib/ai/tools/update-document';
import { requestSuggestions } from '@lib/ai/tools/request-suggestions';
import { getWeather } from '@lib/ai/tools/get-weather';
import { myProvider } from '@lib/ai/providers';
import { entitlementsByUserType } from '@lib/ai/entitlements';
import { postRequestBodySchema, type PostRequestBody } from './schema';
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream';
import { after } from 'next/server';
import { ChatSDKError } from '@lib/errors';
import type { ChatMessage } from '@lib/types';
import type { ChatModel } from '@lib/ai/models';
import type { VisibilityType } from '@components/visibility-selector';

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

export function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message.includes('REDIS_URL')) {
        console.log(
          ' > Resumable streams are disabled due to missing REDIS_URL',
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  try {
    const {
      id,
      message,
      selectedChatModel,
      selectedVisibilityType,
    }: {
      id: string;
      message: ChatMessage;
      selectedChatModel: ChatModel['id'];
      selectedVisibilityType: VisibilityType;
    } = requestBody;

    const session = await auth();

    if (!session) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const userType: UserType = session.type;

    const messageCount = await getMessageCountByUserId({
      id: session.id,
      differenceInHours: 24,
    });

    const { maxMessagesPerDay } = entitlementsByUserType[userType];

    if (messageCount >= maxMessagesPerDay) {
      return new ChatSDKError('rate_limit:chat').toResponse();
    }

    // Try to get existing chat, but don't fail if it doesn't exist (for new chats)
    let chat;
    try {
      chat = await getChatById({ id });
    } catch (error) {
      // Chat doesn't exist yet, which is fine for new conversations
      chat = null;
    }

    if (chat && chat.userId !== session.id) {
      return new ChatSDKError('forbidden:chat').toResponse();
    }

    const uiStream = createUIMessageStream<ChatMessage>({
      execute: async ({ writer }) => {
                 const { fullStream } = streamText({
                     model: myProvider.languageModel(selectedChatModel),
          messages: convertToModelMessages([message]),
                     system: systemPrompt({ selectedChatModel, requestHints: { latitude: '0', longitude: '0', city: '', country: '' } }),
          tools: {
            createDocument: createDocument({ session, dataStream: writer }),
            updateDocument: updateDocument({ session, dataStream: writer }),
            requestSuggestions: requestSuggestions({ session, dataStream: writer }),
            getWeather: getWeather,
          },
          temperature: 0.7,
        });

         // Note: Resumable streaming is disabled for now

         // Process the stream and write to the UI
         let assistantMessage = '';
         const assistantId = generateUUID();
         
         for await (const delta of fullStream) {
           const { type } = delta;

           if (type === 'text') {
             const { text } = delta;
             assistantMessage += text;

             writer.write({
               type: 'data-appendMessage',
               data: JSON.stringify({
                 id: assistantId,
                 role: 'assistant',
                 parts: [{ type: 'text', text: assistantMessage }],
                 createdAt: new Date().toISOString(),
               }),
               transient: true,
             });
           }
         }

         if (message.role === 'user' && !chat) {
           try {
             // Generate a simple title from the first few words of the message
             const messageText = message.parts?.[0]?.text || '';
             const title = messageText.length > 50 
               ? messageText.substring(0, 50) + '...' 
               : messageText || 'New Chat';
             
             await saveChat({
               id,
               title,
               userId: session.id,
               visibility: selectedVisibilityType,
             });
           } catch (error) {
             // Don't throw the error to avoid breaking the stream
           }
         }

         // Save messages after chat is created (to satisfy foreign key constraint)
         const messages: any[] = [
           {
             id: message.id,
             chatId: id,
             role: message.role,
             parts: message.parts,
             attachments: [],
             createdAt: new Date().toISOString(),
           },
           {
             id: assistantId,
             chatId: id,
             role: 'assistant',
             parts: [{ type: 'text', text: assistantMessage }],
             attachments: [],
             createdAt: new Date().toISOString(),
           }
         ];

         try {
           await saveMessages({
             messages,
           });
         } catch (error) {
           // Don't throw the error to avoid breaking the stream
         }
      },
    });



    const sseStream = uiStream.pipeThrough(new JsonToSseTransformStream());

    return new Response(sseStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return new ChatSDKError('bad_request:chat').toResponse();
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new ChatSDKError('bad_request:api').toResponse();
    }

    const session = await auth();

    if (!session) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const chat = await getChatById({ id });

    if (!chat) {
      return new ChatSDKError('not_found:chat').toResponse();
    }

    if (chat.userId !== session.id) {
      return new ChatSDKError('forbidden:chat').toResponse();
    }

    await deleteChatById({ id });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return new ChatSDKError('bad_request:chat').toResponse();
  }
}
