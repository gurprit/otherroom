type ConversationApiResponse = {
  conversation?: {
    id: string;
  };

  error?: string;
};

const pendingConversations =
  new Map<
    string,
    Promise<string>
  >();

function getStorageKey(
  roomId: string
) {
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

async function createConversation(
  roomId: string
): Promise<string> {
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

export async function ensureConversation(
  roomId: string
): Promise<string> {
  const existingId =
    getConversationId(roomId);

  if (existingId) {
    return existingId;
  }

  const pending =
    pendingConversations.get(
      roomId
    );

  if (pending) {
    return pending;
  }

  const creation =
    createConversation(roomId);

  pendingConversations.set(
    roomId,
    creation
  );

  try {
    return await creation;
  } finally {
    pendingConversations.delete(
      roomId
    );
  }
}

async function updateConversation(
  roomId: string,
  body: Record<string, unknown>
) {
  const conversationId =
    await ensureConversation(roomId);

  const response = await fetch(
    `/api/conversations/${conversationId}`,
    {
      method: "PATCH",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify(body),
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

export async function recordVisitorMessage(
  roomId: string
) {
  await updateConversation(
    roomId,
    {
      type: "visitor_message",
    }
  );
}

export async function recordDecoyReply(
  roomId: string,
  message: string
) {
  await updateConversation(
    roomId,
    {
      type: "decoy_reply",
      message,
    }
  );
}
