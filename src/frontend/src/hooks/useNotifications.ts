import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import type { MatchEntry, Message } from "../types";
import { useBackendActor } from "./useBackendActor";
import { useGetMyMatches } from "./useQueries";

export interface Notification {
  id: string;
  type: "match" | "message";
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
}

// Fetch all messages across all mutual contacts (aggregated)
function useAllMutualMessages(
  mutualMatches: MatchEntry[],
  isLoggedIn: boolean,
) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Message[]>({
    queryKey: [
      "allMutualMessages",
      mutualMatches.map((m) => m.matched.toString()).join(","),
    ],
    queryFn: async () => {
      if (!actor || mutualMatches.length === 0) return [];
      const all = await Promise.all(
        mutualMatches.map((m) => actor.getMessages(m.matched)),
      );
      return all.flat();
    },
    enabled: !!actor && !isFetching && isLoggedIn && mutualMatches.length > 0,
    refetchInterval: 4000,
  });
}

export function useNotifications(isLoggedIn: boolean, callerPrincipal: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const prevMutualIds = useRef<Set<string>>(new Set());
  const prevMessageIds = useRef<Set<string>>(new Set());
  const matchesInitialized = useRef(false);
  const msgsInitialized = useRef(false);

  const { data: myMatches = [] } = useGetMyMatches(isLoggedIn);
  const mutualMatches = (myMatches as MatchEntry[]).filter((m) => m.mutual);
  const { data: allMessages = [] } = useAllMutualMessages(
    mutualMatches,
    isLoggedIn,
  );

  // Track new mutual matches
  useEffect(() => {
    if (!isLoggedIn) return;
    const currentIds = new Set(mutualMatches.map((m) => m.matched.toString()));

    if (!matchesInitialized.current) {
      prevMutualIds.current = currentIds;
      matchesInitialized.current = true;
      return;
    }

    for (const m of mutualMatches) {
      const id = m.matched.toString();
      if (!prevMutualIds.current.has(id)) {
        const name = m.profile.name || `${id.slice(0, 8)}...`;
        setNotifications((prev) => [
          {
            id: `match-${id}-${Date.now()}`,
            type: "match",
            title: "Kết nối mới! 🤝",
            body: `Bạn và ${name} đã kết nối với nhau.`,
            createdAt: Date.now(),
            read: false,
          },
          ...prev,
        ]);
      }
    }

    prevMutualIds.current = currentIds;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mutualMatches, isLoggedIn]);

  // Track new incoming messages
  useEffect(() => {
    if (!isLoggedIn) return;
    const incoming = (allMessages as Message[]).filter(
      (m) => m.from.toString() !== callerPrincipal,
    );
    const currentIds = new Set(incoming.map((m) => m.id));

    if (!msgsInitialized.current) {
      prevMessageIds.current = currentIds;
      msgsInitialized.current = true;
      return;
    }

    for (const m of incoming) {
      if (!prevMessageIds.current.has(m.id)) {
        const preview =
          m.text.length > 50 ? `${m.text.slice(0, 50)}...` : m.text;
        setNotifications((prev) => [
          {
            id: `msg-${m.id}`,
            type: "message",
            title: "Tin nhắn mới 💬",
            body: preview,
            createdAt: Date.now(),
            read: false,
          },
          ...prev,
        ]);
      }
    }

    prevMessageIds.current = currentIds;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMessages, isLoggedIn, callerPrincipal]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function clearAll() {
    setNotifications([]);
  }

  return { notifications, unreadCount, markAllRead, clearAll };
}
