"use client";

import { useEffect, useRef, useState } from "react";
import { useSocketStore } from "@/lib/socket-store";

const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

type CallStatus = "idle" | "calling" | "connected";

export function useWebRTCCall(roomCode: string) {
  const socket = useSocketStore((s) => s.socket);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerSocketIdRef = useRef<string | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callStatus, setCallStatus] = useState("idle" as CallStatus);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  function createPeerConnection(toSocketId: string) {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peerSocketIdRef.current = toSocketId;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.emit("call:ice-candidate", {
          candidate: event.candidate,
          toSocketId,
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") setCallStatus("connected");
      if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
        endCall();
      }
    };

    pcRef.current = pc;
    return pc;
  }

  async function flushPendingCandidates() {
    const pc = pcRef.current;
    if (!pc) return;
    for (const c of pendingCandidatesRef.current) {
      try {
        await pc.addIceCandidate(c);
      } catch (err) {
        console.error("addIceCandidate failed", err);
      }
    }
    pendingCandidatesRef.current = [];
  }

  async function startCall(toSocketId: string) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setCallStatus("calling");

      const pc = createPeerConnection(toSocketId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket?.emit("call:offer", { roomCode, offer, toSocketId });
    } catch (err) {
      console.error("startCall failed", err);
      endCall();
    }
  }

  async function acceptCall(
    fromSocketId: string,
    offer: RTCSessionDescriptionInit
  ) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = createPeerConnection(fromSocketId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(offer);
      await flushPendingCandidates();
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket?.emit("call:answer", { answer, toSocketId: fromSocketId });
      setCallStatus("connected");
    } catch (err) {
      console.error("acceptCall failed", err);
      endCall();
    }
  }

  function endCall() {
    const peerId = peerSocketIdRef.current;
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    pendingCandidatesRef.current = [];
    setLocalStream(null);
    setRemoteStream(null);
    setCallStatus("idle");
    setIsScreenSharing(false);
    if (peerId) {
      socket?.emit("call:end", { toSocketId: peerId });
    }
    peerSocketIdRef.current = null;
  }

  async function toggleScreenShare() {
    const pc = pcRef.current;
    if (!pc) return;

    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        await sender?.replaceTrack(screenTrack);
        screenTrack.onended = () => stopScreenShare();
        setIsScreenSharing(true);
      } catch (err) {
        console.error("Screen share cancelled or failed", err);
      }
    } else {
      stopScreenShare();
    }
  }

  async function stopScreenShare() {
    const pc = pcRef.current;
    const camTrack = localStreamRef.current?.getVideoTracks()[0];
    const sender = pc?.getSenders().find((s) => s.track?.kind === "video");
    if (camTrack && sender) await sender.replaceTrack(camTrack);
    setIsScreenSharing(false);
  }

  useEffect(() => {
    if (!socket) return;

    async function onOffer({
      offer,
      fromSocketId,
    }: {
      offer: RTCSessionDescriptionInit;
      fromSocketId: string;
    }) {
      await acceptCall(fromSocketId, offer);
    }

    async function onAnswer({ answer }: { answer: RTCSessionDescriptionInit }) {
      await pcRef.current?.setRemoteDescription(answer);
      await flushPendingCandidates();
      setCallStatus("connected");
    }

    async function onIceCandidate({
      candidate,
    }: {
      candidate: RTCIceCandidateInit;
    }) {
      const pc = pcRef.current;
      if (pc && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(candidate);
        } catch (err) {
          console.error("addIceCandidate failed", err);
        }
      } else {
        pendingCandidatesRef.current.push(candidate);
      }
    }

    function onCallEnded() {
      // Don't emit call:end back; just clean up locally
      peerSocketIdRef.current = null;
      endCall();
    }

    socket.on("call:offer", onOffer);
    socket.on("call:answer", onAnswer);
    socket.on("call:ice-candidate", onIceCandidate);
    socket.on("call:ended", onCallEnded);

    return () => {
      socket.off("call:offer", onOffer);
      socket.off("call:answer", onAnswer);
      socket.off("call:ice-candidate", onIceCandidate);
      socket.off("call:ended", onCallEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  return {
    localStream,
    remoteStream,
    callStatus,
    isScreenSharing,
    startCall,
    endCall,
    toggleScreenShare,
  };
}