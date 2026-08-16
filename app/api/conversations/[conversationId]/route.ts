import { queryD1 } from "@/lib/d1-rest";

type ConversationRow = {
  id: string;
  room_id: string;
  started_at: string;
  last_activity_at: string;
  visitor_message_count: number;
  chaos_level: number;
  last_decoy_message: string | null;
  ended_at: string | null;
};

type UpdateConversationRequest =
  | {
      type: "visitor_message";
    }
  | {
      type: "decoy_reply";
      message: string;
    };

type ConversationRouteProps = {
  params: Promise<{
    conversationId: string;
  }>;
};

export async function PATCH(
  request: Request,
  {
    params,
  }: ConversationRouteProps
) {
  try {
    const {
      conversationId,
    } = await params;

    const body =
      (await request.json()) as UpdateConversationRequest;

    const now =
      new Date().toISOString();

    if (
      body.type ===
      "visitor_message"
    ) {
      await queryD1({
        sql: `
          UPDATE conversations
          SET
            visitor_message_count =
              visitor_message_count + 1,

            chaos_level =
              CASE
                WHEN visitor_message_count + 1 <= 4
                  THEN 1
                WHEN visitor_message_count + 1 <= 8
                  THEN 2
                WHEN visitor_message_count + 1 <= 14
                  THEN 3
                WHEN visitor_message_count + 1 <= 22
                  THEN 4
                ELSE 5
              END,

            last_activity_at = ?
          WHERE id = ?
        `,

        params: [
          now,
          conversationId,
        ],
      });
    } else if (
      body.type ===
      "decoy_reply"
    ) {
      const message =
        body.message?.trim();

      if (!message) {
        return Response.json(
          {
            error:
              "Decoy message is required.",
          },
          {
            status: 400,
          }
        );
      }

      await queryD1({
        sql: `
          UPDATE conversations
          SET
            last_decoy_message = ?,
            last_activity_at = ?
          WHERE id = ?
        `,

        params: [
          message,
          now,
          conversationId,
        ],
      });
    } else {
      return Response.json(
        {
          error:
            "Invalid conversation update.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      rows,
    } =
      await queryD1<ConversationRow>({
        sql: `
          SELECT
            id,
            room_id,
            started_at,
            last_activity_at,
            visitor_message_count,
            chaos_level,
            last_decoy_message,
            ended_at
          FROM conversations
          WHERE id = ?
          LIMIT 1
        `,

        params: [
          conversationId,
        ],
      });

    const conversation =
      rows[0];

    if (!conversation) {
      return Response.json(
        {
          error:
            "Conversation not found.",
        },
        {
          status: 404,
        }
      );
    }

    return Response.json({
      conversation: {
        id:
          conversation.id,

        roomId:
          conversation.room_id,

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

        endedAt:
          conversation.ended_at,
      },
    });
  } catch (error) {
    console.error(
      "Update conversation error:",
      error
    );

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update conversation.",
      },
      {
        status: 500,
      }
    );
  }
}
