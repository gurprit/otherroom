"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import styles from "./ManageRoomDashboard.module.scss";

type ConversationStats = {
  id: string;
  startedAt: string;
  lastActivityAt: string;
  visitorMessageCount: number;
  durationSeconds: number;
};

type ManageRoomResponse = {
  room?: {
    id: string;
    characterName: string;
    username: string;
  };

  summary?: {
    visitorCount: number;
    totalMessages: number;
    longestConversationSeconds: number;
    averageConversationSeconds: number;
  };

  conversations?: ConversationStats[];

  error?: string;
};

type ManageRoomDashboardProps = {
  roomId: string;
  token: string;
};

function formatDuration(
  totalSeconds: number
) {
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const minutes =
    Math.floor(
      totalSeconds / 60
    );

  const seconds =
    totalSeconds % 60;

  if (minutes < 60) {
    return `${minutes}m ${seconds}s`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  const remainingMinutes =
    minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

function formatStartedAt(
  value: string
) {
  const date =
    new Date(value);

  return date.toLocaleString(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
}

export default function ManageRoomDashboard({
  roomId,
  token,
}: ManageRoomDashboardProps) {
  const [data, setData] =
    useState<ManageRoomResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [origin, setOrigin] =
    useState("");

  const loadStats = useCallback(async () => {
    if (!token) {
      setError(
        "This management link is missing its secret token."
      );

      setLoading(false);

      return;
    }

    try {
      const response = await fetch(
        `/api/manage/${roomId}?token=${encodeURIComponent(token)}`,
        {
          cache: "no-store",
        }
      );

      const result =
        (await response.json()) as ManageRoomResponse;

      if (
        !response.ok ||
        !result.room ||
        !result.summary
      ) {
        throw new Error(
          result.error ??
            "Unable to load room activity."
        );
      }

      setData(result);
      setError("");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load room activity."
      );
    } finally {
      setLoading(false);
    }
  }, [roomId, token]);

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        setOrigin(
          window.location.origin
        );

        loadStats();
      }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadStats]);

  if (loading) {
    return (
      <main className={styles.statePage}>
        Loading room activity...
      </main>
    );
  }

  if (
    error ||
    !data?.room ||
    !data.summary
  ) {
    return (
      <main className={styles.statePage}>
        <div>
          <span className={styles.brand}>
            OtherRoom
          </span>

          <h1>
            Unable to open room
          </h1>

          <p>
            {error ||
              "This management link is invalid."}
          </p>
        </div>
      </main>
    );
  }

  const {
    room,
    summary,
  } = data;

  const conversations =
    data.conversations ?? [];

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link
            className={styles.brand}
            href="/"
          >
            OtherRoom
          </Link>

          <div className={styles.roomIdentity}>
            <span>
              Room activity
            </span>

            <h1>
              {room.characterName}
            </h1>

            <p>
              @{room.username}
            </p>
          </div>
        </header>

        <section className={styles.summary}>
          <article className={styles.stat}>
            <span>
              Visitors
            </span>

            <strong>
              {summary.visitorCount}
            </strong>
          </article>

          <article className={styles.stat}>
            <span>
              Messages diverted
            </span>

            <strong>
              {summary.totalMessages}
            </strong>
          </article>

          <article className={styles.stat}>
            <span>
              Longest conversation
            </span>

            <strong>
              {formatDuration(
                summary.longestConversationSeconds
              )}
            </strong>
          </article>

          <article className={styles.stat}>
            <span>
              Average survival time
            </span>

            <strong>
              {formatDuration(
                summary.averageConversationSeconds
              )}
            </strong>
          </article>
        </section>

        <section className={styles.shareSection}>
          <div>
            <span className={styles.eyebrow}>
              Your public room
            </span>

            <p>
              Send this link to anyone you want
              redirected into this OtherRoom.
            </p>
          </div>

          <div className={styles.roomLink}>
            <code>
              {`${origin}/room/${room.id}`}
            </code>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(
                  `${origin}/room/${room.id}`
                );
              }}
            >
              Copy
            </button>
          </div>
        </section>

        <section className={styles.activity}>
          <div className={styles.activityHeader}>
            <div>
              <span className={styles.eyebrow}>
                Recent visitors
              </span>

              <h2>
                Conversation activity
              </h2>
            </div>

            <button
              className={styles.refresh}
              type="button"
              onClick={() => {
                setLoading(true);
                loadStats();
              }}
            >
              Refresh
            </button>
          </div>

          {conversations.length === 0 ? (
            <div className={styles.empty}>
              <strong>
                Nobody yet
              </strong>

              <p>
                Share the room link and wait
                for your first brave visitor.
              </p>
            </div>
          ) : (
            <div className={styles.conversationList}>
              {conversations.map(
                (
                  conversation,
                  index
                ) => (
                  <article
                    className={styles.conversation}
                    key={conversation.id}
                  >
                    <div>
                      <strong>
                        Visitor{" "}
                        {conversations.length -
                          index}
                      </strong>

                      <span>
                        {formatStartedAt(
                          conversation.startedAt
                        )}
                      </span>
                    </div>

                    <div
                      className={styles.conversationStats}
                    >
                      <span>
                        {
                          conversation.visitorMessageCount
                        }{" "}
                        {conversation.visitorMessageCount ===
                        1
                          ? "message"
                          : "messages"}
                      </span>

                      <span>
                        {formatDuration(
                          conversation.durationSeconds
                        )}
                      </span>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>

        <footer className={styles.footer}>
          Conversation text is not stored
          in OtherRoom statistics.
        </footer>
      </div>
    </main>
  );
}
