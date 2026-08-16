import { queryD1 } from "@/lib/d1-rest";

type RoomRow = {
  id: string;
  character_name: string;
  username: string;
  management_token: string;
};

type ConversationRow = {
  id: string;
  started_at: string;
  last_activity_at: string;
  visitor_message_count: number;
  chaos_level: number;
  last_decoy_message: string | null;
};

type ManageRouteProps = {
  params: Promise<{
    roomId: string;
  }>;
};

export async function GET(
  request: Request,
  {
    params,
  }: ManageRouteProps
) {
  try {
    const {
      roomId,
    } = await params;

    const url =
      new URL(request.url);

    const token =
      url.searchParams.get("token");

    if (!token) {
      return Response.json(
        {
          error:
            "Management token required.",
        },
        {
          status: 401,
        }
      );
    }

    const {
      rows: roomRows,
    } = await queryD1<RoomRow>({
      sql: `
        SELECT
          id,
          character_name,
          username,
          management_token
        FROM rooms
        WHERE id = ?
        LIMIT 1
      `,

      params: [
        roomId,
      ],
    });

    const room =
      roomRows[0];

    if (!room) {
      return Response.json(
        {
          error:
            "Room not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      room.management_token !== token
    ) {
      return Response.json(
        {
          error:
            "Invalid management token.",
        },
        {
          status: 403,
        }
      );
    }

    const {
      rows: conversations,
    } =
      await queryD1<ConversationRow>({
        sql: `
          SELECT
            id,
            started_at,
            last_activity_at,
            visitor_message_count,
            chaos_level,
            last_decoy_message
          FROM conversations
          WHERE room_id = ?
          ORDER BY started_at DESC
        `,

        params: [
          roomId,
        ],
      });

    const stats =
      conversations.map(
        (conversation) => {
          const started =
            new Date(
              conversation.started_at
            ).getTime();

          const lastActivity =
            new Date(
              conversation.last_activity_at
            ).getTime();

          return {
            id:
              conversation.id,

            startedAt:
              conversation.started_at,

            lastActivityAt:
              conversation.last_activity_at,

            visitorMessageCount:
              conversation.visitor_message_count,

            chaosLevel:
              conversation.chaos_level,

            lastDecoyMessage:
              conversation.last_decoy_message,

            durationSeconds:
              Math.max(
                0,
                Math.round(
                  (
                    lastActivity -
                    started
                  ) / 1000
                )
              ),

          };
        }
      );

    const visitorCount =
      stats.length;

    const totalMessages =
      stats.reduce(
        (
          total,
          conversation
        ) =>
          total +
          conversation.visitorMessageCount,
        0
      );

    const totalDuration =
      stats.reduce(
        (
          total,
          conversation
        ) =>
          total +
          conversation.durationSeconds,
        0
      );

    const longestConversation =
      stats.reduce(
        (
          longest,
          conversation
        ) =>
          Math.max(
            longest,
            conversation.durationSeconds
          ),
        0
      );

    const averageDuration =
      visitorCount > 0
        ? Math.round(
            totalDuration /
              visitorCount
          )
        : 0;

    const highestChaosLevel =
      stats.reduce(
        (
          highest,
          conversation
        ) =>
          Math.max(
            highest,
            conversation.chaosLevel
          ),
        1
      );

    return Response.json({
      room: {
        id:
          room.id,

        characterName:
          room.character_name,

        username:
          room.username,
      },

      summary: {
        visitorCount,
        totalMessages,

        longestConversationSeconds:
          longestConversation,

        averageConversationSeconds:
          averageDuration,

        highestChaosLevel,
      },

      conversations:
        stats,
    });
  } catch (error) {
    console.error(
      "Manage room error:",
      error
    );

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load room stats.",
      },
      {
        status: 500,
      }
    );
  }
}
