type ConversationApiResponse = {
  conversation?: {
    id: string;
  };
  error?: string;
};

function getStorageKey(roomId: string) {
  return `otherroom_conversation_${roomId}`;
}

export function getConversationId(
  roomId: string
): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(
    getStorageKey(roomId)
  );
}

export function saveConversationId(
  roomId: string,
  conversationId: string
) {
  localStorage.setItem(
    getStorageKey(roomId),
    conversationId
  );
}

export async function ensureConversation(
  roomId: string
): Promise<string> {
  const existingId =
    getConversationId(roomId);

  if (existingId) {
    return existingId;
  }

  const response = await fetch(
    "/api/conversations",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        roomId,
      }),
    }
  );

  const data =
    (await response.json()) as ConversationApiResponse;

  if (
    !response.ok ||
    !data.conversation?.id
  ) {
    throw new Error(
      data.error ??
        "Unable to create conversation."
    );
  }

  saveConversationId(
    roomId,
    data.conversation.id
  );

  return data.conversation.id;
}

export async function recordVisitorMessage(
  roomId: string
) {
  const conversationId =
    await ensureConversation(roomId);

  const response = await fetch(
    `/api/conversations/${conversationId}`,
    {
      method: "PATCH",
    }
  );

  if (!response.ok) {
    const data =
      (await response.json()) as {
        error?: string;
      };

    throw new Error(
      data.error ??
        "Unable to update conversation."
    );
  }
}
