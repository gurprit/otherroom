import { queryD1 } from "@/lib/d1-rest";

type ConversationRow = {
  id: string;
  room_id: string;
  started_at: string;
  last_activity_at: string;
  visitor_message_count: number;
  ended_at: string | null;
};

type ConversationRouteProps = {
  params: Promise<{
    conversationId: string;
  }>;
};

export async function PATCH(
  _request: Request,
  {
    params,
  }: ConversationRouteProps
) {
  try {
    const {
      conversationId,
    } = await params;

    const now =
      new Date().toISOString();

    await queryD1({
      sql: `
        UPDATE conversations
        SET
          visitor_message_count =
            visitor_message_count + 1,
          last_activity_at = ?
        WHERE id = ?
      `,
      params: [
        now,
        conversationId,
      ],
    });

    const {
      rows,
    } = await queryD1<ConversationRow>({
      sql: `
        SELECT
          id,
          room_id,
          started_at,
          last_activity_at,
          visitor_message_count,
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
          error: "Conversation not found.",
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
