"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  getChaosLabel,
} from "@/lib/chaos";
import styles from "./ManageRoomDashboard.module.scss";

type ConversationStats = {
  id: string;
  startedAt: string;
  lastActivityAt: string;
  visitorMessageCount: number;
  durationSeconds: number;
  chaosLevel: number;
  lastDecoyMessage: string | null;
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
    highestChaosLevel: number;
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

  const rankedConversations =
    [...conversations].sort(
      (a, b) =>
        b.durationSeconds -
        a.durationSeconds ||
        b.visitorMessageCount -
        a.visitorMessageCount
    );

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
              Average diversion time
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
                Leaderboard
              </span>

              <h2>
                Who survived the longest?
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

          {rankedConversations.length === 0 ? (
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
              {rankedConversations.map(
                (
                  conversation,
                  index
                ) => {
                  const rank =
                    index + 1;

                  const medal =
                    rank === 1
                      ? "🥇"
                      : rank === 2
                        ? "🥈"
                        : rank === 3
                          ? "🥉"
                          : `#${rank}`;

                  return (
                    <article
                      className={styles.conversation}
                      key={conversation.id}
                    >
                      <div className={styles.visitorIdentity}>
                        <span className={styles.rank}>
                          {medal}
                        </span>

                        <div className={styles.visitorMeta}>
                          <strong>
                            Visitor #{rank}
                          </strong>

                          <span>
                            {formatStartedAt(
                              conversation.startedAt
                            )}
                          </span>
                        </div>
                      </div>

                      <div
                        className={styles.conversationStats}
                      >
                        <span>
                          {formatDuration(
                            conversation.durationSeconds
                          )}
                        </span>

                        <span>
                          {
                            conversation.visitorMessageCount
                          }{" "}
                          {conversation.visitorMessageCount ===
                          1
                            ? "message"
                            : "messages"}
                        </span>
                      </div>

                      <div className={styles.chaosResult}>
                        <div className={styles.chaosTop}>
                          <span className={styles.chaosLabel}>
                            Unhinged level
                          </span>

                          <strong>
                            Level {conversation.chaosLevel} ·{" "}
                            {getChaosLabel(
                              Math.min(
                                5,
                                Math.max(
                                  1,
                                  conversation.chaosLevel
                                )
                              ) as 1 | 2 | 3 | 4 | 5
                            )}
                          </strong>
                        </div>

                        <div
                          className={styles.chaosMeter}
                          aria-label={`Unhinged level ${conversation.chaosLevel} out of 5`}
                        >
                          {[1, 2, 3, 4, 5].map(
                            (level) => (
                              <span
                                key={level}
                                className={
                                  level <=
                                  conversation.chaosLevel
                                    ? styles.chaosActive
                                    : undefined
                                }
                              />
                            )
                          )}
                        </div>

                        {conversation.lastDecoyMessage && (
                          <div className={styles.lastMessage}>
                            <span>
                              Last thing {room.characterName} said
                            </span>

                            <blockquote>
                              “{conversation.lastDecoyMessage}”
                            </blockquote>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>

        <footer className={styles.footer}>
          Full conversation text is not stored.
          Only the latest decoy reply is retained for results.
        </footer>
      </div>
    </main>
  );
}
