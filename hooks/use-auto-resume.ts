'use client';

import { useEffect } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessage } from '@lib/types';
import { useDataStream } from '@components/data-stream-provider';

export interface UseAutoResumeParams {
  autoResume: boolean;
  initialMessages: ChatMessage[];
  resumeStream: UseChatHelpers<ChatMessage>['resumeStream'];
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
}

export function useAutoResume({
  autoResume,
  initialMessages,
  resumeStream,
  setMessages,
}: UseAutoResumeParams) {
  const { dataStream } = useDataStream();

  useEffect(() => {
    if (!autoResume) return;

    const mostRecentMessage = initialMessages.at(-1);

    if (mostRecentMessage?.role === 'user') {
      resumeStream();
    }

    // we intentionally run this once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!dataStream) return;
    if (dataStream.length === 0) return;

    // Process all data-appendMessage events
    dataStream.forEach((dataPart) => {
      if (dataPart.type === 'data-appendMessage') {
        const message = JSON.parse(dataPart.data);
        setMessages((prevMessages) => {
          // Check if this message already exists
          const existingIndex = prevMessages.findIndex(m => m.id === message.id);
          if (existingIndex >= 0) {
            // Update existing message
            const updatedMessages = [...prevMessages];
            updatedMessages[existingIndex] = message;
            return updatedMessages;
          } else {
            // Add new message
            return [...prevMessages, message];
          }
        });
      }
    });
  }, [dataStream, setMessages]);
}
