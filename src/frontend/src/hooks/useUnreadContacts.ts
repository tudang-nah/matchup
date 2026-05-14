import { collection, onSnapshot, query, where, Timestamp } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { db } from "../firebase";
import { useLocalAuth } from "./useLocalAuth";

// Key lưu vào localStorage: lastRead_{myPrincipal}_{theirPrincipal} = timestamp ms
function lsKey(me: string, them: string) {
  return `lastRead_${me}_${them}`;
}

export function getLastRead(me: string, them: string): number {
  const v = localStorage.getItem(lsKey(me, them));
  return v ? Number(v) : 0;
}

export function markAsRead(me: string, them: string) {
  localStorage.setItem(lsKey(me, them), String(Date.now()));
}

// Trả về Set<string> principal của những người có tin chưa đọc
// + latestSenders: Map<string, {name?:string}> để build contact list
export function useUnreadContacts() {
  const { user } = useLocalAuth();
  const [unreadSenders, setUnreadSenders] = useState<Set<string>>(new Set());
  // Map principal -> thông tin người gửi (từ message doc)
  const [senderInfo, setSenderInfo] = useState<Map<string, { principal: string }>>(new Map());
  const latestMsgRef = useRef<Map<string, number>>(new Map()); // principal -> latest createdAt ms

  useEffect(() => {
    if (!user?.principal) return;

    const q = query(
      collection(db, "messages"),
      where("participants", "array-contains", user.principal)
    );

    const unsub = onSnapshot(q, (snap) => {
      const latestPerSender = new Map<string, number>();

      for (const d of snap.docs) {
        const data = d.data() as { from: string; to: string; createdAt: Timestamp | null };
        if (data.from === user.principal) continue; // tin mình gửi, bỏ qua

        const ms = data.createdAt ? data.createdAt.toMillis() : 0;
        const prev = latestPerSender.get(data.from) ?? 0;
        if (ms > prev) latestPerSender.set(data.from, ms);
      }

      latestMsgRef.current = latestPerSender;

      // So sánh với lastRead để tính unread
      const unread = new Set<string>();
      const info = new Map<string, { principal: string }>();
      for (const [sender, latestMs] of latestPerSender) {
        info.set(sender, { principal: sender });
        const lastRead = getLastRead(user.principal, sender);
        if (latestMs > lastRead) {
          unread.add(sender);
        }
      }

      setUnreadSenders(unread);
      setSenderInfo(info);
    });

    return () => unsub();
  }, [user?.principal]);

  return { unreadSenders, senderInfo };
}
