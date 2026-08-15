"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import { getRoom } from "@/lib/rooms";
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

export default function RoomChat({
  roomId,
}: RoomChatProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [roomLoaded, setRoomLoaded] = useState(false);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const messageListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRoom(getRoom(roomId));
    setMessages(getMessages(roomId));
    setRoomLoaded(true);
    setMessagesLoaded(true);
  }, [roomId]);

  useEffect(() => {
    if (!messagesLoaded) {
      return;
    }

    saveMessages(roomId, messages);
  }, [messages, messagesLoaded, roomId]);

  useEffect(() => {
    messageListRef.current?.scrollTo({
      top: messageListRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = message.trim();

    if (!content) {
      return;
    }

    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "visitor",
      content,
    };

    setMessages((currentMessages) => [
      ...currentMessages,
      newMessage,
    ]);

    setMessage("");
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
          <span className={styles.brand}>OtherRoom</span>
          <h1>Room not found</h1>
          <p>
            This room does not exist in this browser.
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
              {room.characterName.charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>{room.characterName}</strong>
              <span>@{room.username}</span>
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
              <div className={styles.largeAvatar}>
                {room.characterName.charAt(0).toUpperCase()}
              </div>

              <strong>{room.characterName}</strong>
              <span>@{room.username}</span>

              <p>
                This is an AI character. Send a message
                to start chatting.
              </p>
            </div>
          ) : (
            messages.map((chatMessage) => (
              <div
                className={
                  chatMessage.role === "visitor"
                    ? styles.visitorMessage
                    : styles.assistantMessage
                }
                key={chatMessage.id}
              >
                {chatMessage.content}
              </div>
            ))
          )}
        </div>

        <form
          className={styles.composer}
          onSubmit={handleSubmit}
        >
          <input
            aria-label="Message"
            type="text"
            placeholder="Message..."
            value={message}
            onChange={(event) =>
              setMessage(event.target.value)
            }
            autoComplete="off"
          />

          <button
            type="submit"
            aria-label="Send message"
            disabled={!message.trim()}
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
