import { google } from "@ai-sdk/google";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  // 1. Only signed-in users can use the assistant
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages, roomCode }: { messages: UIMessage[]; roomCode?: string } =
    await req.json();
  if (!roomCode) {
    return new Response("Missing roomCode", { status: 400 });
  }

  // 2. Load the room and check this user is actually in it
  const room = await prisma.room.findUnique({
    where: { code: roomCode.toUpperCase() },
    include: {
      participants: {
        where: { userId: session.user.id, leftAt: null },
        select: { id: true },
      },
    },
  });
  if (!room || room.participants.length === 0) {
    return new Response("Forbidden", { status: 403 });
  }

  // 3. Read the latest room chat straight from the database,
  //    so it is always fresh and the client can't fake it
  const recent = await prisma.message.findMany({
    where: { roomId: room.id },
    orderBy: { createdAt: "desc" }, // newest first, so take: 20 gets the LAST 20
    take: 20,
    include: { user: true },
  });

  const recentChat =
    recent
      .reverse() // back to oldest-first for the prompt
      .map((m) => `${m.user.name ?? m.user.email}: ${m.content}`)
      .join("\n") || "(no messages yet)";

  // 4. Ask Gemini, with the real room context in the system prompt
  const result = streamText({
    model: google("gemini-3.6-flash"),
    system: `You are a helpful AI study assistant embedded inside a shared study room.

Room subject (exact text from the room settings): "${room.subject ?? "not set"}"

Rules:
- If asked what the subject is, quote it exactly. Do not guess or expand it.
- If the subject is vague or unclear, say so, and use the recent chat to work out what the students are studying.
- If the chat and the subject disagree, trust what the students are actually discussing.
- Answer questions, explain concepts clearly, and offer to quiz the user when it fits naturally.
- Keep answers focused: this is a sidebar panel, not a full chat app.

Recent room chat, oldest first (context only, don't repeat it back):
${recentChat}`,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}