import { queryD1 } from "@/lib/d1-rest";

type CreateConversationRequest = {
  roomId: string;
};

type RoomExistsRow = {
  id: string;
};

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as CreateConversationRequest;

    const roomId =
      body.roomId?.trim();

    if (!roomId) {
      return Response.json(
        {
          error: "Room ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      rows,
    } = await queryD1<RoomExistsRow>({
      sql: `
        SELECT id
        FROM rooms
        WHERE id = ?
        LIMIT 1
      `,
      params: [
        roomId,
      ],
    });

    if (!rows[0]) {
      return Response.json(
        {
          error: "Room not found.",
        },
        {
          status: 404,
        }
      );
    }

    const id =
      crypto.randomUUID()
        .replaceAll("-", "");

    const now =
      new Date().toISOString();

    await queryD1({
      sql: `
        INSERT INTO conversations (
          id,
          room_id,
          started_at,
          last_activity_at,
          visitor_message_count
        )
        VALUES (?, ?, ?, ?, 0)
      `,
      params: [
        id,
        roomId,
        now,
        now,
      ],
    });

    return Response.json(
      {
        conversation: {
          id,
          roomId,
          startedAt: now,
          lastActivityAt: now,
          visitorMessageCount: 0,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Create conversation error:",
      error
    );

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create conversation.",
      },
      {
        status: 500,
      }
    );
  }
}
