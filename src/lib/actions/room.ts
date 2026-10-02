"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

// Avoids ambiguous chars (0/O, 1/I) so codes are easy to read aloud/type
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateRoomCode(length = 6) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

const createRoomSchema = z.object({
  name: z.string().min(2, "Room name must be at least 2 characters"),
  subject: z.string().optional(),
});

export type CreateRoomState = { error?: string };

export async function createRoom(
  _prevState: CreateRoomState,
  formData: FormData
): Promise<CreateRoomState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in" };
  }

  const parsed = createRoomSchema.safeParse({
    name: formData.get("name"),
    subject: formData.get("subject") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Generate a unique code, retrying on the rare collision
  let code = generateRoomCode();
  for (let attempts = 0; attempts < 5; attempts++) {
    const existing = await prisma.room.findUnique({ where: { code } });
    if (!existing) break;
    code = generateRoomCode();
  }

  const room = await prisma.room.create({
    data: {
      name: parsed.data.name,
      subject: parsed.data.subject,
      code,
      hostId: session.user.id,
      participants: {
        create: { userId: session.user.id, status: "active" },
      },
    },
  });

  redirect(`/room/${room.code}`);
}

const joinRoomSchema = z.object({
  code: z.string().min(4, "Enter a valid room code"),
});

export type JoinRoomState = { error?: string };

export async function joinRoom(
  _prevState: JoinRoomState,
  formData: FormData
): Promise<JoinRoomState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in" };
  }

  const parsed = joinRoomSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const code = parsed.data.code.toUpperCase();

  const room = await prisma.room.findUnique({ where: { code } });
  if (!room || !room.isActive) {
    return { error: "Room not found" };
  }

  // upsert: handles both "never joined before" and "rejoining after leaving"
  await prisma.roomParticipant.upsert({
    where: { roomId_userId: { roomId: room.id, userId: session.user.id } },
    update: { leftAt: null, status: "active" },
    create: { roomId: room.id, userId: session.user.id, status: "active" },
  });

  redirect(`/room/${room.code}`);
}