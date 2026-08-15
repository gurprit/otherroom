import type { ChatMessage } from "@/types/chat";

const STORAGE_KEY = "otherroom_messages";

type StoredMessages = Record<string, ChatMessage[]>;

function getStoredMessages(): StoredMessages {
  if (typeof window === "undefined") {
    return {};
  }

  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return {};
  }

  try {
    return JSON.parse(stored) as StoredMessages;
  } catch {
    return {};
  }
}

export function getMessages(roomId: string): ChatMessage[] {
  const messages = getStoredMessages();

  return messages[roomId] ?? [];
}

export function saveMessages(
  roomId: string,
  messages: ChatMessage[]
): void {
  const storedMessages = getStoredMessages();

  storedMessages[roomId] = messages;

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(storedMessages)
  );
}
