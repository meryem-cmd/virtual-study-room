"use client";

import { useEffect, useRef, useState } from "react";
import { useWebRTCCall } from "@/hooks/use-webrtc-call";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/avatar";
import {
  MicIcon,
  MicOffIcon,
  VideoIcon,
  VideoOffIcon,
  ScreenShareIcon,
  PhoneOffIcon,
} from "@/components/icons";

type Peer = { socketId: string; userName: string };

function ControlButton({
  label,
  onClick,
  active = false,
  danger = false,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  const tone = danger
    ? "bg-rust text-white border-rust hover:opacity-90"
    : active
    ? "bg-ink text-white border-ink hover:opacity-90"
    : "bg-white text-ink border-rule hover:border-ink/30";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-lamp/40 ${tone}`}
    >
      {children}
    </button>
  );
}

export function RoomCall({
  roomCode,
  otherParticipants,
}: {
  roomCode: string;
  otherParticipants: Peer[];
}) {
  const {
    localStream,
    remoteStream,
    callStatus,
    isScreenSharing,
    startCall,
    endCall,
    toggleScreenShare,
  } = useWebRTCCall(roomCode);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  // callStatus is a dependency so the streams get attached
  // once the <video> elements actually mount
  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
  }, [localStream, callStatus]);

  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream, callStatus]);

  // Reset the toggles whenever a new call starts
  useEffect(() => {
    if (callStatus === "idle") {
      setMicOn(true);
      setCamOn(true);
    }
  }, [callStatus]);

  function toggleMic() {
    const next = !micOn;
    localStream?.getAudioTracks().forEach((t) => (t.enabled = next));
    setMicOn(next);
  }

  function toggleCam() {
    const next = !camOn;
    localStream?.getVideoTracks().forEach((t) => (t.enabled = next));
    setCamOn(next);
  }

  const remoteName = otherParticipants[0]?.userName ?? "Participant";

  return (
    <section className="rounded-xl border border-rule bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-ink">Call</h2>
        {callStatus !== "idle" && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${
              callStatus === "connected"
                ? "bg-sage/15 text-ink"
                : "bg-lamp/15 text-ink"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                callStatus === "connected" ? "bg-sage" : "bg-lamp animate-pulse"
              }`}
            />
            {callStatus === "calling" ? "Calling…" : "Connected"}
          </span>
        )}
      </div>

      {callStatus === "idle" && (
        <div className="mt-4">
          {otherParticipants.length === 0 ? (
            <div className="rounded-lg border border-dashed border-rule px-4 py-8 text-center">
              <p className="text-sm text-ink/60">Waiting for someone to join</p>
              <p className="mt-1 text-xs text-ink/40">
                Share the room code and you can start a video call.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-rule px-4 py-6">
              <p className="text-sm text-ink/60">Start a video call with</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {otherParticipants.map((p) => (
                  <Button key={p.socketId} onClick={() => startCall(p.socketId)}>
                    <span className="inline-flex max-w-[220px] items-center gap-2">
                      <VideoIcon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{p.userName}</span>
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {callStatus !== "idle" && (
        <div className="mt-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-ink/90">
              <div className="absolute inset-0 flex items-center justify-center">
                <Avatar name="You" size="lg" />
              </div>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className={`absolute inset-0 h-full w-full object-cover ${
                  camOn && localStream ? "opacity-100" : "opacity-0"
                }`}
              />
              <span className="absolute bottom-2 left-2 rounded-md bg-black/55 px-2 py-0.5 text-xs text-white">
                You{isScreenSharing ? " · sharing screen" : ""}
              </span>
            </div>

            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-ink/90">
              <div className="absolute inset-0 flex items-center justify-center">
                <Avatar name={remoteName} size="lg" />
              </div>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`absolute inset-0 h-full w-full object-cover ${
                  remoteStream ? "opacity-100" : "opacity-0"
                }`}
              />
              <span className="absolute bottom-2 left-2 max-w-[80%] truncate rounded-md bg-black/55 px-2 py-0.5 text-xs text-white">
                {remoteName}
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-3">
            <ControlButton
              label={micOn ? "Mute microphone" : "Unmute microphone"}
              onClick={toggleMic}
              active={!micOn}
            >
              {micOn ? (
                <MicIcon className="h-[18px] w-[18px]" />
              ) : (
                <MicOffIcon className="h-[18px] w-[18px]" />
              )}
            </ControlButton>
            <ControlButton
              label={camOn ? "Turn off camera" : "Turn on camera"}
              onClick={toggleCam}
              active={!camOn}
            >
              {camOn ? (
                <VideoIcon className="h-[18px] w-[18px]" />
              ) : (
                <VideoOffIcon className="h-[18px] w-[18px]" />
              )}
            </ControlButton>
            <ControlButton
              label={isScreenSharing ? "Stop sharing" : "Share screen"}
              onClick={toggleScreenShare}
              active={isScreenSharing}
            >
              <ScreenShareIcon className="h-[18px] w-[18px]" />
            </ControlButton>
            <ControlButton label="End call" onClick={endCall} danger>
              <PhoneOffIcon className="h-[18px] w-[18px]" />
            </ControlButton>
          </div>
        </div>
      )}
    </section>
  );
}