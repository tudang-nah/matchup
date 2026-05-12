import { useEffect, useRef } from "react";
import type { Match } from "../types";

const LS_PREFIX = "matchup-notif-";
const LS_PARTICIPANT_COUNTS = "matchup-participant-counts";
const MAX_AGE_DAYS = 2;

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function purgeOldKeys() {
  try {
    const cutoff = Date.now() - MAX_AGE_DAYS * 86_400_000;
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(LS_PREFIX)) continue;
      const parts = key.slice(LS_PREFIX.length).split("-");
      const dateStr = parts.slice(-3).join("-");
      const ts = new Date(dateStr).getTime();
      if (!Number.isNaN(ts) && ts < cutoff) {
        toRemove.push(key);
      }
    }
    for (const k of toRemove) {
      localStorage.removeItem(k);
    }
  } catch {
    // ignore
  }
}

function loadFromStorage(set: Set<string>) {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(LS_PREFIX)) {
        set.add(key.slice(LS_PREFIX.length));
      }
    }
  } catch {
    // ignore
  }
}

function saveToStorage(key: string) {
  try {
    localStorage.setItem(`${LS_PREFIX}${key}`, "1");
  } catch {
    // ignore
  }
}

function loadParticipantCounts(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LS_PARTICIPANT_COUNTS);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function saveParticipantCounts(counts: Record<string, number>) {
  try {
    localStorage.setItem(LS_PARTICIPANT_COUNTS, JSON.stringify(counts));
  } catch {
    // ignore
  }
}

/**
 * Fires browser push notifications:
 * 1. 60 and 30 minutes before each match.
 * 2. When the participant count increases on a match the user CREATED.
 *
 * Notification keys are persisted in localStorage so they survive page refreshes.
 * Interval is 30s for reliable detection.
 */
export function useMatchReminders(
  matches: Match[] | undefined,
  /** Principal string of the current user, to detect their created matches */
  currentPrincipal?: string,
  /** Map of matchId → participantCount from latest backend data */
  participantCounts?: Record<string, number>,
) {
  const sentRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);
  const prevCountsRef = useRef<Record<string, number>>({});
  const countsInitializedRef = useRef(false);

  // Request browser notification permission on mount
  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Load persisted keys once on mount and purge stale ones
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    purgeOldKeys();
    loadFromStorage(sentRef.current);
  }, []);

  // Pre-match time reminders (60 min and 30 min)
  useEffect(() => {
    if (!("Notification" in window)) return;
    if (!matches || matches.length === 0) return;

    const checkReminders = () => {
      if (Notification.permission !== "granted") return;

      const now = Date.now();
      const date = todayStr();

      for (const match of matches) {
        const matchTime = new Date(match.time).getTime();
        if (Number.isNaN(matchTime)) continue;

        const minsLeft = Math.floor((matchTime - now) / 60000);

        if (minsLeft >= 59 && minsLeft <= 61) {
          const key = `${match.id}-60-${date}`;
          if (!sentRef.current.has(key)) {
            sentRef.current.add(key);
            saveToStorage(key);
            new Notification("MatchUp - Sắp đến giờ thi đấu! ⚽", {
              body: `Trận ${match.title} sẽ diễn ra sau 60 phút. Chuẩn bị sẵn sàng nhé!`,
              icon: "/favicon.ico",
            });
          }
        }

        if (minsLeft >= 29 && minsLeft <= 31) {
          const key = `${match.id}-30-${date}`;
          if (!sentRef.current.has(key)) {
            sentRef.current.add(key);
            saveToStorage(key);
            new Notification("MatchUp - Sắp đến giờ thi đấu! ⚽", {
              body: `Trận ${match.title} sẽ diễn ra sau 30 phút. Đừng quên nhé!`,
              icon: "/favicon.ico",
            });
          }
        }
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, 30_000);
    return () => clearInterval(interval);
  }, [matches]);

  // Creator join notifications: detect when participant count increases
  useEffect(() => {
    if (!("Notification" in window)) return;
    if (!matches || !currentPrincipal || !participantCounts) return;

    if (!countsInitializedRef.current) {
      // First load: seed from localStorage
      const stored = loadParticipantCounts();
      prevCountsRef.current = { ...stored };
      countsInitializedRef.current = true;
      // Update stored counts with fresh data
      const merged = { ...stored, ...participantCounts };
      saveParticipantCounts(merged);
      prevCountsRef.current = merged;
      return;
    }

    if (Notification.permission !== "granted") return;

    // Check each match created by current user
    for (const match of matches) {
      const creatorStr = match.creator?.toString();
      if (creatorStr !== currentPrincipal) continue;

      const matchTime = new Date(match.time).getTime();
      if (Number.isNaN(matchTime) || matchTime < Date.now()) continue;

      const prevCount = prevCountsRef.current[match.id] ?? 0;
      const currCount = participantCounts[match.id] ?? 0;

      if (currCount > prevCount) {
        const key = `creator-join-${match.id}-${currCount}`;
        if (!sentRef.current.has(key)) {
          sentRef.current.add(key);
          saveToStorage(key);
          new Notification("MatchUp - Có người tham gia trận của bạn! 🎉", {
            body: `Trận "${match.title}" vừa có người tham gia mới (${currCount} người).`,
            icon: "/favicon.ico",
          });
        }
      }
    }

    // Update stored + in-memory counts
    const merged = { ...prevCountsRef.current, ...participantCounts };
    prevCountsRef.current = merged;
    saveParticipantCounts(merged);
  }, [matches, currentPrincipal, participantCounts]);
}
