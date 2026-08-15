import { queryD1 } from "@/lib/d1-rest";

type RoomRow = {
  id: string;
  character_name: string;
  username: string;
  personality_id: string | null;
  personality_instructions: string;
  created_at: string;
};

type RoomRouteProps = {
  params: Promise<{
    roomId: string;
  }>;
};

export async function GET(
  _request: Request,
  {
    params,
  }: RoomRouteProps
) {
  try {
    const {
      roomId,
    } = await params;

    const {
      rows,
    } = await queryD1<RoomRow>({
      sql: `
        SELECT
          id,
          character_name,
          username,
          personality_id,
          personality_instructions,
          created_at
        FROM rooms
        WHERE id = ?
        LIMIT 1
      `,

      params: [
        roomId,
      ],
    });

    const room =
      rows[0];

    if (!room) {
      return Response.json(
        {
          error: "Room not found.",
        },
        {
          status: 404,
        }
      );
    }

    return Response.json({
      room: {
        id:
          room.id,

        characterName:
          room.character_name,

        username:
          room.username,

        personalityId:
          room.personality_id,

        personalityInstructions:
          room.personality_instructions,

        createdAt:
          room.created_at,
      },
    });
  } catch (error) {
    console.error(
      "Get room error:",
      error
    );

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load room.",
      },
      {
        status: 500,
      }
    );
  }
}
