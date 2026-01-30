
import { createOpenAI } from '@ai-sdk/openai';
import {
  streamText,
  UIMessage,
  convertToModelMessages,
  tool,
  stepCountIs,
} from "ai";
import fs from "fs";
import path from "path";
import { getTools } from "@/lib/tools/index";

// Configure Azure OpenAI
export const azure = createOpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
  baseURL: process.env.AZURE_OPENAI_BASE_URL!,
  headers: {
    "Authorization": `Bearer ${process.env.AZURE_OPENAI_API_KEY!}`, // ensures proper auth
  },
});

const maxSteps = 25;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const ASSISTANT_PROMPT = fs
  .readFileSync(path.join(process.cwd(), "lib/prompts/assistant-prompt.md"), "utf-8")
  .replace("{{CURRENT_DATE}}", new Date().toISOString().split("T")[0])


  const result = streamText({
    model: azure.chat(process.env.AZURE_OPENAI_MODEL!),
    system: ASSISTANT_PROMPT,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(maxSteps),
    tools: getTools(),
    providerOptions: {
        azure: {
          reasoningEffort: "low",
      },
    },
  });

  return result.toUIMessageStreamResponse();
}