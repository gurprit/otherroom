import { queryD1 } from "@/lib/d1-rest";

type CreateRoomRequest = {
  characterName: string;
  username: string;
  personalityId: string | null;
  personalityInstructions: string;
};

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as CreateRoomRequest;

    const characterName =
      body.characterName?.trim();

    const username =
      body.username
        ?.trim()
        .replace(/^@/, "");

    const personalityInstructions =
      body.personalityInstructions?.trim();

    if (
      !characterName ||
      !username ||
      !personalityInstructions
    ) {
      return Response.json(
        {
          error: "Invalid room details.",
        },
        {
          status: 400,
        }
      );
    }

    const id =
      crypto.randomUUID()
        .replaceAll("-", "")
        .slice(0, 10);

    const managementToken =
      crypto.randomUUID()
        .replaceAll("-", "");

    const createdAt =
      new Date().toISOString();

    await queryD1({
      sql: `
        INSERT INTO rooms (
          id,
          management_token,
          character_name,
          username,
          personality_id,
          personality_instructions,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,

      params: [
        id,
        managementToken,
        characterName,
        username,
        body.personalityId ?? null,
        personalityInstructions,
        createdAt,
      ],
    });

    return Response.json(
      {
        room: {
          id,
          characterName,
          username,
          personalityId:
            body.personalityId ?? null,
          personalityInstructions,
          createdAt,
        },

        managementToken,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Create room error:",
      error
    );

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create room.",
      },
      {
        status: 500,
      }
    );
  }
}
