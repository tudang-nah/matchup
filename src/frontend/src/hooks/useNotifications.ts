import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { db } from "../firebase";
import { useLocalAuth } from "./useLocalAuth";

export interface Notification {
  id: string;
  type: "match" | "message";
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
  senderPrincipal?: string; // để click vào mở đúng chat
}

export function useNotifications(isLoggedIn: boolean, callerPrincipal: string) {
  const { user } = useLocalAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const initializedRef = useRef(false);
  const prevMessageIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isLoggedIn || !user?.principal) return;

    const q = query(
      collection(db, "messages"),
      where("participants", "array-contains", user.principal),
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!initializedRef.current) {
        for (const d of snap.docs) prevMessageIds.current.add(d.id);
        initializedRef.current = true;
        return;
      }

      for (const change of snap.docChanges()) {
        if (change.type !== "added") continue;
        const data = change.doc.data() as { from: string; to: string; text: string };
        const docId = change.doc.id;
        if (data.from === user.principal) continue;
        if (prevMessageIds.current.has(docId)) continue;
        prevMessageIds.current.add(docId);

        const preview = data.text.length > 60 ? `${data.text.slice(0, 60)}...` : data.text;
        setNotifications((prev) => [
          {
            id: `msg-${docId}`,
            type: "message",
            title: "Tin nhắn mới 💬",
            body: preview,
            createdAt: Date.now(),
            read: false,
            senderPrincipal: data.from,
          },
          ...prev,
        ]);
      }
    });

    return () => unsub();
  }, [isLoggedIn, user?.principal]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function clearAll() {
    setNotifications([]);
  }

  function markOneRead(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  return { notifications, unreadCount, markAllRead, clearAll, markOneRead };
}
