import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { RoomPresence } from "@/components/room-presence";
import { RoomTimer } from "@/components/room-timer";
import { RoomChat } from "@/components/room-chat";
import { RoomCallSection } from "@/components/room-call-section";
import { RoomCodeBadge } from "@/components/room-code-badge";
import { StudyAssistant } from "@/components/study-assistant";
import { ArrowLeftIcon } from "@/components/icons";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const room = await prisma.room.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      host: true,
      participants: { where: { leftAt: null }, include: { user: true } },
      messages: {
        // Newest first so take: 100 really means "the last 100"
        orderBy: { createdAt: "desc" },
        include: { user: true },
        take: 100,
      },
    },
  });

  if (!room) notFound();

  const isParticipant = room.participants.some(
    (p) => p.userId === session.user!.id
  );
  if (!isParticipant) redirect("/dashboard");

  const userName = session.user!.name ?? "Someone";

  // Flip back to oldest-first for display
  const initialMessages = [...room.messages].reverse().map((m) => ({
    id: m.id,
    userName: m.user.name ?? m.user.email,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-ink/50 transition-colors hover:text-ink"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Dashboard
      </Link>

      <header className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-3xl text-ink">{room.name}</h1>
          {room.subject && (
            <p className="mt-1 text-sm text-ink/60">{room.subject}</p>
          )}
        </div>
        <RoomCodeBadge code={room.code} />
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* Left column: call + chat */}
        <div className="space-y-6">
          <RoomCallSection roomCode={room.code} />
          <RoomChat
            roomId={room.id}
            roomCode={room.code}
            userName={userName}
            initialMessages={initialMessages}
          />
        </div>

        {/* Right column: timer, who's here, AI assistant */}
        <div className="space-y-6">
          <RoomTimer roomCode={room.code} />
          <RoomPresence
            roomCode={room.code}
            userName={userName}
            hostName={room.host.name ?? ""}
          />
          <StudyAssistant
            roomCode={room.code}
            roomSubject={room.subject ?? undefined}
          />
        </div>
      </div>
    </div>
  );
}