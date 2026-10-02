import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CreateRoomForm } from "@/components/create-room-form";
import { JoinRoomForm } from "@/components/join-room-form";
import { Panel } from "@/components/ui/panel";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const firstName = (session.user?.name ?? session.user?.email ?? "").split(
    " "
  )[0];

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-3xl text-ink">
        Good to see you, {firstName}
      </h1>
      <p className="mt-1 text-sm text-ink/60">
        Start a new session or join one already running.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <Panel>
          <h2 className="font-display text-lg text-ink">Create a room</h2>
          <div className="mt-4">
            <CreateRoomForm />
          </div>
        </Panel>

        <Panel>
          <h2 className="font-display text-lg text-ink">Join a room</h2>
          <div className="mt-4">
            <JoinRoomForm />
          </div>
        </Panel>
      </div>
    </div>
  );
}