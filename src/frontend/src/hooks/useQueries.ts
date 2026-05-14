/**
 * useQueries.ts — Firestore-based implementation (multi-device sync)
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  collection, doc, setDoc, getDoc, getDocs, deleteDoc,
  updateDoc, addDoc, query, where, orderBy, serverTimestamp,
  increment, Timestamp, onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import type {
  CheckInPublic, Match, NewsItem, PlayerRank,
  PlayerRating, ProfileEntry, UserProfile,
} from "../types";
import { useLocalAuth } from "./useLocalAuth";

function uuidv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function docToMatch(id: string, data: Record<string, unknown>): Match {
  return {
    id,
    sport: data.sport as string,
    title: data.title as string,
    time: data.time as string,
    location: data.location as string,
    missing: BigInt(String(data.missing ?? 0)),
    createdAt: data.createdAt ? BigInt((data.createdAt as Timestamp).toMillis()) : undefined,
    requirements: data.requirements as string | undefined,
    creator: data.creator as Match["creator"],
  };
}

// ---- Matches ----

export function useGetAllMatches() {
  return useQuery<Match[]>({
    queryKey: ["matches"],
    queryFn: async () => {
      const snap = await getDocs(collection(db, "matches"));
      return snap.docs.map((d) => docToMatch(d.id, d.data() as Record<string, unknown>));
    },
    refetchInterval: 5000,
  });
}

export function useCreateMatch() {
  const { user } = useLocalAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      sport: string; title: string; time: string;
      location: string; missing: bigint; requirements?: string;
    }) => {
      if (!user) throw new Error("Bạn cần đăng nhập để tạo trận.");
      const id = uuidv4();
      await setDoc(doc(db, "matches", id), {
        sport: data.sport,
        title: data.title,
        time: data.time,
        location: data.location,
        missing: Number(data.missing),
        requirements: data.requirements ?? "",
        creator: user.principal,
        createdAt: serverTimestamp(),
      });
      // auto-join creator
      await setDoc(doc(db, "participants", `${id}_${user.principal}`), {
        matchId: id,
        userId: user.principal,
        joinedAt: serverTimestamp(),
      });
      return id;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["matches"] }); },
  });
}

export function useJoinMatch() {
  const { user } = useLocalAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Bạn cần đăng nhập.");
      const partId = `${id}_${user.principal}`;
      const partRef = doc(db, "participants", partId);
      const existing = await getDoc(partRef);
      if (!existing.exists()) {
        await setDoc(partRef, { matchId: id, userId: user.principal, joinedAt: serverTimestamp() });
        const matchRef = doc(db, "matches", id);
        await updateDoc(matchRef, { missing: increment(-1) });
      }
    },
    onSuccess: (_r, id) => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["isParticipant", id] });
      queryClient.invalidateQueries({ queryKey: ["matchParticipants", id] });
    },
  });
}

export function useLeaveMatch() {
  const { user } = useLocalAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Bạn cần đăng nhập.");
      const partRef = doc(db, "participants", `${id}_${user.principal}`);
      const existing = await getDoc(partRef);
      if (existing.exists()) {
        await deleteDoc(partRef);
        await updateDoc(doc(db, "matches", id), { missing: increment(1) });
      }
    },
    onSuccess: (_r, id) => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["isParticipant", id] });
      queryClient.invalidateQueries({ queryKey: ["matchParticipants", id] });
    },
  });
}

export function useDeleteMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, "matches", id));
      // delete participants
      const snap = await getDocs(query(collection(db, "participants"), where("matchId", "==", id)));
      await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["matches"] }); },
  });
}

export function useDeleteExpiredMatches() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      if (ids.length === 0) return 0;
      await Promise.all(ids.map((id) => deleteDoc(doc(db, "matches", id))));
      return ids.length;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["matches"] }); },
  });
}

// ---- Participants ----

export function useIsMatchParticipant(matchId: string, enabled: boolean) {
  const { user } = useLocalAuth();
  return useQuery<boolean>({
    queryKey: ["isParticipant", matchId, user?.principal],
    queryFn: async () => {
      if (!user) return false;
      const snap = await getDoc(doc(db, "participants", `${matchId}_${user.principal}`));
      return snap.exists();
    },
    enabled: enabled && !!matchId && !!user,
    staleTime: 10_000,
  });
}

export function useGetMatchParticipants(matchId: string) {
  return useQuery<string[]>({
    queryKey: ["matchParticipants", matchId],
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, "participants"), where("matchId", "==", matchId)));
      return snap.docs.map((d) => (d.data() as { userId: string }).userId);
    },
    enabled: !!matchId,
    staleTime: 15_000,
  });
}

// ---- Profile ----

export function useGetMyProfile(isLoggedIn: boolean) {
  const { user } = useLocalAuth();
  return useQuery<UserProfile | null>({
    queryKey: ["profile", user?.principal],
    queryFn: async () => {
      if (!user) return null;
      const snap = await getDoc(doc(db, "profiles", user.principal));
      if (snap.exists()) return snap.data() as UserProfile;
      return { name: user.displayName, bio: "", avatarUrl: "", skills: [] };
    },
    enabled: isLoggedIn && !!user,
  });
}

export function useUpdateMyProfile() {
  const { user } = useLocalAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; bio: string; avatarUrl: string; skills: string[] }) => {
      if (!user) throw new Error("Bạn cần đăng nhập.");
      await setDoc(doc(db, "profiles", user.principal), data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
  });
}

export function useGetAllProfiles(isLoggedIn: boolean) {
  const { user } = useLocalAuth();
  return useQuery<ProfileEntry[]>({
    queryKey: ["profiles"],
    queryFn: async () => {
      const snap = await getDocs(collection(db, "profiles"));
      return snap.docs.map((d) => ({
        owner: d.id as unknown as ProfileEntry["owner"],
        profile: d.data() as UserProfile,
      }));
    },
    enabled: isLoggedIn && !!user,
  });
}

export function useRegisterMe() {
  const { user } = useLocalAuth();
  return useMutation({
    mutationFn: async () => {
      if (!user) return;
      const ref = doc(db, "profiles", user.principal);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, { name: user.displayName, bio: "", avatarUrl: "", skills: [] });
      }
    },
  });
}

// ---- Check-in ----

export function useCheckIn() {
  const { user } = useLocalAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (matchId: string) => {
      if (!user) throw new Error("Bạn cần đăng nhập.");
      const id = `${matchId}_${user.principal}`;
      const ref = doc(db, "checkins", id);
      const snap = await getDoc(ref);
      if (snap.exists()) return { __kind__: "err" as const, err: "Đã check-in rồi" };
      await setDoc(ref, { matchId, participant: user.principal, timestamp: serverTimestamp() });
      return { __kind__: "ok" as const, ok: "Check-in thành công" };
    },
    onSuccess: (_r, matchId) => {
      queryClient.invalidateQueries({ queryKey: ["checkIns", matchId] });
      queryClient.invalidateQueries({ queryKey: ["hasCheckedIn", matchId] });
    },
  });
}

export function useGetCheckIns(matchId: string, enabled: boolean) {
  return useQuery<CheckInPublic[]>({
    queryKey: ["checkIns", matchId],
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, "checkins"), where("matchId", "==", matchId)));
      return snap.docs.map((d) => {
        const data = d.data() as { matchId: string; participant: string; timestamp: Timestamp };
        return {
          matchId: data.matchId,
          participant: data.participant,
          timestamp: BigInt(data.timestamp?.toMillis() ?? 0),
        };
      });
    },
    enabled: enabled && !!matchId,
    staleTime: 10_000,
  });
}

export function useHasCheckedIn(matchId: string, enabled: boolean) {
  const { user } = useLocalAuth();
  return useQuery<boolean>({
    queryKey: ["hasCheckedIn", matchId, user?.principal],
    queryFn: async () => {
      if (!user) return false;
      const snap = await getDoc(doc(db, "checkins", `${matchId}_${user.principal}`));
      return snap.exists();
    },
    enabled: enabled && !!matchId && !!user,
    staleTime: 10_000,
  });
}

// ---- Messages ----

export function useGetMessages(withUser: string | null, enabled: boolean) {
  const { user } = useLocalAuth();
  const [messages, setMessages] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    if (!enabled || !user || !withUser) return;
    const q = query(
      collection(db, "messages"),
      where("participants", "array-contains", user.principal),
      orderBy("createdAt")
    );
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs
        .map((d) => d.data())
        .filter((m) => {
          const msg = m as { from: string; to: string };
          return (msg.from === user.principal && msg.to === withUser)
            || (msg.from === withUser && msg.to === user.principal);
        });
      setMessages(msgs);
    });
    return () => unsub();
  }, [user, withUser, enabled]);

  return { data: messages };
}

export function useSendMessage() {
  const { user } = useLocalAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { to: string; text: string }) => {
      if (!user) throw new Error("Bạn cần đăng nhập.");
      await addDoc(collection(db, "messages"), {
        from: user.principal,
        to: data.to,
        text: data.text,
        participants: [user.principal, data.to],
        createdAt: serverTimestamp(),
      });
    },
    onSuccess: (_r, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", variables.to] });
    },
  });
}

// ---- Match with user (stub — social matching) ----

export function useMatchWithUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_target: unknown) => {},
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["myMatches"] }); },
  });
}

export function useGetMyMatches(isLoggedIn: boolean) {
  const { user } = useLocalAuth();
  return useQuery({
    queryKey: ["myMatches"],
    queryFn: () => [],
    enabled: isLoggedIn && !!user,
  });
}

// ---- Rating ----

export function useRatePlayer() {
  const { user } = useLocalAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { ratedPrincipal: string; matchId: string; score: number; comment: string }) => {
      if (!user) throw new Error("Bạn cần đăng nhập.");
      const id = `${data.matchId}_${user.principal}_${data.ratedPrincipal}`;
      await setDoc(doc(db, "ratings", id), {
        raterPrincipal: user.principal,
        ratedPrincipal: data.ratedPrincipal,
        matchId: data.matchId,
        score: data.score,
        comment: data.comment,
        createdAt: serverTimestamp(),
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["rankings"] }); },
  });
}

export function useGetAllRankings(isLoggedIn: boolean) {
  const { user } = useLocalAuth();
  return useQuery<PlayerRank[]>({
    queryKey: ["rankings"],
    queryFn: async (): Promise<PlayerRank[]> => {
      // Tính ranking từ participants + ratings
      const [partSnap, ratingSnap] = await Promise.all([
        getDocs(collection(db, "participants")),
        getDocs(collection(db, "ratings")),
      ]);

      const matchCount: Record<string, number> = {};
      for (const d of partSnap.docs) {
        const userId = (d.data() as { userId: string }).userId;
        matchCount[userId] = (matchCount[userId] ?? 0) + 1;
      }

      const ratingMap: Record<string, { total: number; count: number; last: number }> = {};
      for (const d of ratingSnap.docs) {
        const r = d.data() as { ratedPrincipal: string; score: number; createdAt: Timestamp };
        const p = r.ratedPrincipal;
        if (!ratingMap[p]) ratingMap[p] = { total: 0, count: 0, last: 0 };
        ratingMap[p].total += r.score;
        ratingMap[p].count += 1;
        const ms = r.createdAt?.toMillis() ?? 0;
        if (ms > ratingMap[p].last) ratingMap[p].last = ms;
      }

      const allUsers = new Set([...Object.keys(matchCount), ...Object.keys(ratingMap)]);
      const ranks: PlayerRank[] = Array.from(allUsers).map((uid) => {
        const rm = ratingMap[uid];
        return {
          userPrincipal: uid as unknown as PlayerRank["userPrincipal"],
          totalMatches: BigInt(matchCount[uid] ?? 0),
          showUpCount: BigInt(matchCount[uid] ?? 0),
          avgRating: rm ? rm.total / rm.count : 0,
          totalRatings: BigInt(rm?.count ?? 0),
          lastActive: BigInt(rm?.last ?? 0),
        };
      });

      return ranks.sort((a, b) => {
        const scoreA = Number(a.totalMatches) * 10 + a.avgRating * 5;
        const scoreB = Number(b.totalMatches) * 10 + b.avgRating * 5;
        return scoreB - scoreA;
      });
    },
    enabled: isLoggedIn && !!user,
    staleTime: 60_000,
  });
}

export function useGetRatingsForPlayer(ratedPrincipal: unknown, enabled: boolean) {
  return useQuery<PlayerRating[]>({
    queryKey: ["playerRatings", ratedPrincipal],
    queryFn: async (): Promise<PlayerRating[]> => {
      if (!ratedPrincipal) return [];
      const snap = await getDocs(
        query(collection(db, "ratings"), where("ratedPrincipal", "==", String(ratedPrincipal)))
      );
      return snap.docs.map((d) => {
        const data = d.data() as {
          raterPrincipal: string; ratedPrincipal: string;
          matchId: string; score: number; comment: string; createdAt: Timestamp;
        };
        return {
          raterPrincipal: data.raterPrincipal as unknown as PlayerRating["raterPrincipal"],
          ratedPrincipal: data.ratedPrincipal as unknown as PlayerRating["ratedPrincipal"],
          matchId: data.matchId,
          score: data.score,
          comment: data.comment,
          createdAt: BigInt(data.createdAt?.toMillis() ?? 0),
        };
      });
    },
    enabled,
    staleTime: 30_000,
  });
}

export function useGetHotNews() {
  return useQuery<NewsItem[]>({
    queryKey: ["hotNews"],
    queryFn: (): NewsItem[] => [],
    staleTime: 30 * 60 * 1000,
  });
}
