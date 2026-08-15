import { buildSystemPrompt } from "@/lib/prompts";

const MODEL = "@cf/google/gemma-4-26b-a4b-it";

const MAX_ATTEMPTS = 2;
const REQUEST_TIMEOUT_MS = 25000;

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

function looksLikePromptLeak(content: string) {
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
  ];

  return suspiciousPatterns.some((pattern) =>
    pattern.test(content)
  );
}

async function requestCompletion({
  accountId,
  apiToken,
  messages,
}: {
  accountId: string;
  apiToken: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
}) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL}`,
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          messages,

          reasoning_effort: "low",

          max_completion_tokens: 800,

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

export async function POST(request: Request) {
  try {
    const accountId =
      process.env.CLOUDFLARE_ACCOUNT_ID;

    const apiToken =
      process.env.CLOUDFLARE_AI_TOKEN;

    if (!accountId || !apiToken) {
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

    const visitorMessageCount = messages.filter(
      (message) => message.role === "visitor"
    ).length;

    const systemPrompt = buildSystemPrompt({
      characterName,
      personalityInstructions,
      visitorMessageCount,
    });

    const recentMessages = messages.slice(-12);

    const cloudflareMessages = [
      {
        role: "system",
        content: systemPrompt,
      },

      ...recentMessages.map((message) => ({
        role:
          message.role === "visitor"
            ? "user"
            : "assistant",

        content: message.content,
      })),
    ];

    let lastError =
      "The AI could not generate a reply.";

    for (
      let attempt = 1;
      attempt <= MAX_ATTEMPTS;
      attempt += 1
    ) {
      try {
        const {
          response,
          data,
        } = await requestCompletion({
          accountId,
          apiToken,
          messages: cloudflareMessages,
        });

        if (
          !response.ok ||
          data.success === false
        ) {
          const providerError =
            data.errors?.[0]?.message ??
            `HTTP ${response.status}`;

          console.warn(
            `Workers AI attempt ${attempt} failed:`,
            providerError
          );

          lastError = providerError;

          continue;
        }

        const choice =
          data.result?.choices?.[0];

        const content =
          choice?.message?.content?.trim() ?? "";

        const finishReason =
          choice?.finish_reason ?? null;

        const neurons =
          data.result?.usage?.neurons;

        const promptLeak =
          Boolean(content) &&
          looksLikePromptLeak(content);

        console.log(
          `Workers AI attempt ${attempt}:`,
          {
            model: MODEL,
            status: response.status,
            finishReason,
            hasContent:
              Boolean(content),
            promptLeak,
            neurons,
          }
        );

        if (promptLeak) {
          console.warn(
            `Workers AI attempt ${attempt}: rejected possible prompt leak`
          );

          lastError =
            "The AI returned an unusable response.";

          continue;
        }

        if (
          finishReason === "length" &&
          !content
        ) {
          console.warn(
            `Workers AI attempt ${attempt}: exhausted completion budget before visible reply`
          );

          lastError =
            "The AI ran out of response budget.";

          continue;
        }

        if (!content) {
          console.warn(
            `Workers AI attempt ${attempt}: empty response`
          );

          lastError =
            "The AI returned an empty response.";

          continue;
        }

        return Response.json({
          message: content,
        });
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === "AbortError"
        ) {
          console.warn(
            `Workers AI attempt ${attempt}: timed out after ${REQUEST_TIMEOUT_MS}ms`
          );

          lastError =
            "The reply took too long.";

          continue;
        }

        console.warn(
          `Workers AI attempt ${attempt}: request failed`,
          error
        );

        lastError =
          "The AI request failed.";
      }
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
