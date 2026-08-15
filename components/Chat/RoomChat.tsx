"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  getMessages,
  saveMessages,
} from "@/lib/messages";
import type { Room } from "@/types/room";
import type { ChatMessage } from "@/types/chat";
import styles from "./RoomChat.module.scss";

type RoomChatProps = {
  roomId: string;
};

type RoomApiResponse = {
  room?: Room;
  error?: string;
};

type ChatApiResponse = {
  message?: string;
  error?: string;
};

export default function RoomChat({
  roomId,
}: RoomChatProps) {
  const [room, setRoom] =
    useState<Room | null>(null);

  const [roomLoaded, setRoomLoaded] =
    useState(false);

  const [messagesLoaded, setMessagesLoaded] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [isReplying, setIsReplying] =
    useState(false);

  const [replyFailed, setReplyFailed] =
    useState(false);

  const [roomError, setRoomError] =
    useState("");

  const messageListRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRoom() {
      try {
        const response = await fetch(
          `/api/rooms/${roomId}`,
          {
            cache: "no-store",
          }
        );

        const data =
          (await response.json()) as RoomApiResponse;

        if (
          !response.ok ||
          !data.room
        ) {
          throw new Error(
            data.error ??
              "Room not found."
          );
        }

        if (cancelled) {
          return;
        }

        setRoom(data.room);
        setMessages(
          getMessages(roomId)
        );
        setMessagesLoaded(true);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setRoomError(
          error instanceof Error
            ? error.message
            : "Unable to load room."
        );
      } finally {
        if (!cancelled) {
          setRoomLoaded(true);
        }
      }
    }

    loadRoom();

    return () => {
      cancelled = true;
    };
  }, [roomId]);

  useEffect(() => {
    if (!messagesLoaded) {
      return;
    }

    saveMessages(
      roomId,
      messages
    );
  }, [
    messages,
    messagesLoaded,
    roomId,
  ]);

  useEffect(() => {
    messageListRef.current?.scrollTo({
      top:
        messageListRef.current.scrollHeight,

      behavior: "smooth",
    });
  }, [
    messages,
    isReplying,
    replyFailed,
  ]);

  async function requestReply(
    conversationMessages: ChatMessage[]
  ) {
    if (!room || isReplying) {
      return;
    }

    setReplyFailed(false);
    setIsReplying(true);

    try {
      const response = await fetch(
        "/api/chat",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            characterName:
              room.characterName,

            personalityInstructions:
              room.personalityInstructions,

            messages:
              conversationMessages.map(
                ({ role, content }) => ({
                  role,
                  content,
                })
              ),
          }),
        }
      );

      const data =
        (await response.json()) as ChatApiResponse;

      if (
        !response.ok ||
        !data.message
      ) {
        throw new Error(
          data.error ??
            "Unable to generate a reply."
        );
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.message,
      };

      setMessages(
        (currentMessages) => [
          ...currentMessages,
          assistantMessage,
        ]
      );
    } catch (requestError) {
      console.error(
        requestError
      );

      setReplyFailed(true);
    } finally {
      setIsReplying(false);
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!room || isReplying) {
      return;
    }

    const content =
      message.trim();

    if (!content) {
      return;
    }

    setMessage("");
    setReplyFailed(false);

    const visitorMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "visitor",
      content,
    };

    const updatedMessages = [
      ...messages,
      visitorMessage,
    ];

    setMessages(
      updatedMessages
    );

    await requestReply(
      updatedMessages
    );
  }

  function handleRetry() {
    requestReply(messages);
  }

  if (!roomLoaded) {
    return (
      <main className={styles.loading}>
        Opening room...
      </main>
    );
  }

  if (!room) {
    return (
      <main className={styles.notFound}>
        <div>
          <span className={styles.brand}>
            OtherRoom
          </span>

          <h1>
            Room not found
          </h1>

          <p>
            {roomError ||
              "This room does not exist."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.chat}>
        <header className={styles.header}>
          <div className={styles.identity}>
            <div className={styles.avatar}>
              {room.characterName
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>
                {room.characterName}
              </strong>

              <span>
                @{room.username}
              </span>
            </div>
          </div>

          <span className={styles.aiLabel}>
            AI character
          </span>
        </header>

        <div
          className={styles.messages}
          ref={messageListRef}
        >
          {messages.length === 0 ? (
            <div className={styles.empty}>
              <div
                className={styles.largeAvatar}
              >
                {room.characterName
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <strong>
                {room.characterName}
              </strong>

              <span>
                @{room.username}
              </span>

              <p>
                This is an AI character.
                Send a message to start chatting.
              </p>
            </div>
          ) : (
            messages.map(
              (chatMessage) => (
                <div
                  className={
                    chatMessage.role ===
                    "visitor"
                      ? styles.visitorMessage
                      : styles.assistantMessage
                  }
                  key={chatMessage.id}
                >
                  {chatMessage.content}
                </div>
              )
            )
          )}

          {isReplying && (
            <div className={styles.typing}>
              <span />
              <span />
              <span />
            </div>
          )}

          {replyFailed &&
            !isReplying && (
              <button
                className={styles.retry}
                type="button"
                onClick={handleRetry}
              >
                Reply failed · try again
              </button>
            )}
        </div>

        <form
          className={styles.composer}
          onSubmit={handleSubmit}
        >
          <input
            aria-label="Message"
            type="text"
            placeholder={
              isReplying
                ? `${room.characterName} is typing...`
                : "Message..."
            }
            value={message}
            onChange={(event) =>
              setMessage(event.target.value)
            }
            autoComplete="off"
            disabled={isReplying}
          />

          <button
            type="submit"
            aria-label="Send message"
            disabled={
              !message.trim() ||
              isReplying
            }
          >
            ↑
          </button>
        </form>

        <footer className={styles.footer}>
          OtherRoom · AI character
        </footer>
      </section>
    </main>
  );
}
