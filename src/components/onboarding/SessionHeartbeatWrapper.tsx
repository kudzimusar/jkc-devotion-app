"use client";
import { useSessionHeartbeat } from '@/hooks/useSessionHeartbeat';

export default function SessionHeartbeatWrapper() {
  useSessionHeartbeat({ enabled: true });
  return null;
}
