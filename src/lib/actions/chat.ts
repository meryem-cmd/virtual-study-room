"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function saveMessage(roomId: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");
  if (!content.trim()) return;

  await prisma.message.create({
    data: {
      roomId,
      userId: session.user.id,
      content: content.trim(),
    },
  });
}