import { buildSystemPrompt } from "@/lib/prompts";

const MODELS = [
  {
    id: "@cf/google/gemma-4-26b-a4b-it",
    name: "Gemma",
    timeoutMs: 12000,
    maxCompletionTokens: 1000,
  },
  {
    id: "@cf/zai-org/glm-4.7-flash",
    name: "GLM",
    timeoutMs: 10000,
    maxCompletionTokens: 700,
  },
] as const;

type IncomingMessage = {
  role: "visitor" | "assistant";
  content: string;
};

type ChatRequest = {
  characterName: string;
  personalityInstructions: string;
  messages: IncomingMessage[];
};

type CloudflareChoice = {
  finish_reason?: string | null;

  message?: {
    content?: string | null;
  };
};

type CloudflareResponse = {
  result?: {
    choices?: CloudflareChoice[];

    usage?: {
      neurons?: number;
    };
  };

  success?: boolean;

  errors?: Array<{
    message?: string;
  }>;
};

function looksLikePromptLeak(
  content: string
) {
  const suspiciousPatterns = [
    /we need to respond/i,
    /we need to answer/i,
    /i should respond/i,
    /i should answer/i,
    /looking at the guidelines/i,
    /looking at the instructions/i,
    /system prompt/i,
    /instructions say/i,
    /the user said/i,
    /the visitor said/i,
    /we should say/i,
    /could say/i,
    /maybe say/i,
    /chaos level/i,
  ];

  return suspiciousPatterns.some(
    (pattern) =>
      pattern.test(content)
  );
}

async function requestCompletion({
  accountId,
  apiToken,
  model,
  timeoutMs,
  maxCompletionTokens,
  messages,
}: {
  accountId: string;
  apiToken: string;
  model: string;
  timeoutMs: number;
  maxCompletionTokens: number;

  messages: Array<{
    role: string;
    content: string;
  }>;
}) {
  const controller =
    new AbortController();

  const timeout =
    setTimeout(() => {
      controller.abort();
    }, timeoutMs);

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${apiToken}`,

          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          messages,

          reasoning_effort: "low",

          max_completion_tokens:
            maxCompletionTokens,

          temperature: 0.9,
        }),

        signal: controller.signal,
      }
    );

    const data =
      (await response.json()) as CloudflareResponse;

    return {
      response,
      data,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(
  request: Request
) {
  try {
    const accountId =
      process.env
        .CLOUDFLARE_ACCOUNT_ID;

    const apiToken =
      process.env
        .CLOUDFLARE_AI_TOKEN;

    if (
      !accountId ||
      !apiToken
    ) {
      return Response.json(
        {
          error:
            "Cloudflare Workers AI is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    const body =
      (await request.json()) as ChatRequest;

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
          error:
            "Invalid chat request.",
        },
        {
          status: 400,
        }
      );
    }

    const visitorMessageCount =
      messages.filter(
        (message) =>
          message.role ===
          "visitor"
      ).length;

    const systemPrompt =
      buildSystemPrompt({
        characterName,
        personalityInstructions,
        visitorMessageCount,
      });

    /*
     * We only need enough recent context
     * for a natural DM conversation.
     *
     * Keeping this bounded also prevents
     * extremely long chats from bloating
     * every AI request.
     */
    const recentMessages =
      messages.slice(-10);

    const cloudflareMessages = [
      {
        role: "system",
        content: systemPrompt,
      },

      ...recentMessages.map(
        (message) => ({
          role:
            message.role ===
            "visitor"
              ? "user"
              : "assistant",

          content:
            message.content,
        })
      ),
    ];

    for (
      const modelConfig of MODELS
    ) {
      try {
        const {
          response,
          data,
        } =
          await requestCompletion({
            accountId,
            apiToken,

            model:
              modelConfig.id,

            timeoutMs:
              modelConfig.timeoutMs,

            maxCompletionTokens:
              modelConfig.maxCompletionTokens,

            messages:
              cloudflareMessages,
          });

        if (
          !response.ok ||
          data.success === false
        ) {
          const providerError =
            data.errors?.[0]
              ?.message ??
            `HTTP ${response.status}`;

          console.warn(
            `${modelConfig.name} failed:`,
            providerError
          );

          continue;
        }

        const choice =
          data.result
            ?.choices?.[0];

        const content =
          choice?.message?.content
            ?.trim() ?? "";

        const finishReason =
          choice?.finish_reason ??
          null;

        const neurons =
          data.result?.usage
            ?.neurons;

        const promptLeak =
          Boolean(content) &&
          looksLikePromptLeak(
            content
          );

        console.log(
          "Workers AI response:",
          {
            provider:
              modelConfig.name,

            model:
              modelConfig.id,

            status:
              response.status,

            finishReason,

            hasContent:
              Boolean(content),

            promptLeak,

            neurons,
          }
        );

        if (promptLeak) {
          console.warn(
            `${modelConfig.name}: rejected possible prompt leak`
          );

          continue;
        }

        if (!content) {
          if (
            finishReason ===
            "length"
          ) {
            console.warn(
              `${modelConfig.name}: exhausted completion budget before visible reply`
            );
          } else {
            console.warn(
              `${modelConfig.name}: empty response`
            );
          }

          continue;
        }

        return Response.json({
          message:
            content,
        });
      } catch (error) {
        if (
          error instanceof
            Error &&
          error.name ===
            "AbortError"
        ) {
          console.warn(
            `${modelConfig.name}: timed out after ${modelConfig.timeoutMs}ms`
          );

          continue;
        }

        console.warn(
          `${modelConfig.name}: request failed`,
          error
        );

        continue;
      }
    }

    /*
     * Both providers failed.
     *
     * Don't leak provider details
     * into the visitor-facing UI.
     */
    return Response.json(
      {
        error:
          "Nobody's answering right now. Try again.",
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
