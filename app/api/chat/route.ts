import { buildSystemPrompt } from "@/lib/prompts";

type IncomingMessage = {
  role: "visitor" | "assistant";
  content: string;
};

type ChatRequest = {
  characterName: string;
  personalityInstructions: string;
  messages: IncomingMessage[];
};

type OpenRouterResponse = {
  model?: string;

  choices?: Array<{
    finish_reason?: string | null;

    message?: {
      content?: string | null;
      reasoning?: string | null;
    };
  }>;

  error?: {
    message?: string;
  };
};

async function requestCompletion({
  apiKey,
  messages,
}: {
  apiKey: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
}) {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "OtherRoom",
      },

      body: JSON.stringify({
        model: "openrouter/free",
        messages,
        temperature: 0.9,
        max_tokens: 250,

        reasoning: {
          exclude: true,
        },
      }),
    }
  );

  const data =
    (await response.json()) as OpenRouterResponse;

  return {
    response,
    data,
  };
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return Response.json(
        {
          error: "OPENROUTER_API_KEY is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    const body = (await request.json()) as ChatRequest;

    const {
      characterName,
      personalityInstructions,
      messages,
    } = body;

    if (
      !characterName ||
      !personalityInstructions ||
      !Array.isArray(messages) ||
      messages.length === 0
    ) {
      return Response.json(
        {
          error: "Invalid chat request.",
        },
        {
          status: 400,
        }
      );
    }

    const systemPrompt = buildSystemPrompt({
      characterName,
      personalityInstructions,
    });

    const openRouterMessages = [
      {
        role: "system",
        content: systemPrompt,
      },

      ...messages.map((message) => ({
        role:
          message.role === "visitor"
            ? "user"
            : "assistant",

        content: message.content,
      })),
    ];

    let lastError = "The AI returned an empty response.";

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      const {
        response,
        data,
      } = await requestCompletion({
        apiKey,
        messages: openRouterMessages,
      });

      console.log(
        `OpenRouter attempt ${attempt}:`,
        {
          model: data.model,
          status: response.status,
          finishReason:
            data.choices?.[0]?.finish_reason,
          hasContent: Boolean(
            data.choices?.[0]?.message?.content?.trim()
          ),
        }
      );

      if (!response.ok) {
        console.error(
          "OpenRouter error:",
          data
        );

        lastError =
          data.error?.message ??
          "The AI provider returned an error.";

        continue;
      }

      const content =
        data.choices?.[0]?.message?.content?.trim();

      if (content) {
        return Response.json({
          message: content,
          model: data.model,
        });
      }

      console.warn(
        "OpenRouter returned no visible content:",
        {
          model: data.model,
          finishReason:
            data.choices?.[0]?.finish_reason,
        }
      );
    }

    return Response.json(
      {
        error: lastError,
      },
      {
        status: 502,
      }
    );
  } catch (error) {
    console.error(
      "Chat route error:",
      error
    );

    return Response.json(
      {
        error:
          "Something went wrong generating the reply.",
      },
      {
        status: 500,
      }
    );
  }
}
