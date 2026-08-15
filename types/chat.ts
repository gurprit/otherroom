export type ChatMessage = {
  id: string;
  role: "visitor" | "assistant";
  content: string;
};
