/**
 * useQueries.ts — localStorage-based implementation (no ICP backend needed)
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CheckInPublic,
  Match,
  NewsItem,
  PlayerRank,
  PlayerRating,
  ProfileEntry,
  UserProfile,
} from "../types";
import { useLocalAuth } from "./useLocalAuth";

const LS_MATCHES = "matchup_matches";
const LS_PROFILES = "matchup_profiles";
const LS_PARTICIPANTS = "matchup_participants";
const LS_CHECKINS = "matchup_checkins";
const LS_MESSAGES = "matchup_messages";

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function saveJSON(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}
function uuidv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function loadMatches(): Match[] {
  const raw = loadJSON<Record<string, unknown>[]>(LS_MATCHES, []);
  return raw.map((m) => ({
    ...m,
    missing: BigInt(String(m.missing ?? 0)),
    createdAt: m.createdAt ? BigInt(String(m.createdAt)) : undefined,
  })) as Match[];
}
function saveMatches(matches: Match[]) {
  saveJSON(
    LS_MATCHES,
    matches.map((m) => ({
      ...m,
      missing: m.missing.toString(),
      createdAt: m.createdAt?.toString(),
      creator: typeof m.creator === "object" && m.creator !== null
        ? (m.creator as { toString(): string }).toString()
        : m.creator,
    })),
  );
}

function loadParticipants(): Record<string, string[]> {
  return loadJSON<Record<string, string[]>>(LS_PARTICIPANTS, {});
}
function saveParticipants(p: Record<string, string[]>) {
  saveJSON(LS_PARTICIPANTS, p);
}

function loadProfiles(): Record<string, UserProfile> {
  return loadJSON<Record<string, UserProfile>>(LS_PROFILES, {});
}
function saveProfiles(p: Record<string, UserProfile>) {
  saveJSON(LS_PROFILES, p);
}

function loadCheckIns(): CheckInPublic[] {
  const raw = loadJSON<Record<string, unknown>[]>(LS_CHECKINS, []);
  return raw.map((c) => ({ ...c, timestamp: BigInt(String(c.timestamp ?? 0)) })) as CheckInPublic[];
}
function saveCheckIns(list: CheckInPublic[]) {
  saveJSON(LS_CHECKINS, list.map((c) => ({ ...c, timestamp: c.timestamp.toString() })));
}

// ---- Hooks ----

export function useGetAllMatches() {
  return useQuery<Match[]>({
    queryKey: ["matches"],
    queryFn: () => loadMatches(),
    refetchInterval: 3000,
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
      const matches = loadMatches();
      const id = uuidv4();
      matches.push({
        id, sport: data.sport, title: data.title, time: data.time,
        location: data.location, missing: data.missing,
        createdAt: BigInt(Date.now()), requirements: data.requirements,
        creator: user.principal as unknown as Match["creator"],
      });
      saveMatches(matches);
      const parts = loadParticipants();
      parts[id] = [user.principal];
      saveParticipants(parts);
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
      const parts = loadParticipants();
      const list = parts[id] ?? [];
      if (!list.includes(user.principal)) {
        list.push(user.principal);
        parts[id] = list;
        saveParticipants(parts);
        const matches = loadMatches();
        const idx = matches.findIndex((m) => m.id === id);
        if (idx !== -1 && matches[idx].missing > 0n) {
          matches[idx] = { ...matches[idx], missing: matches[idx].missing - 1n };
          saveMatches(matches);
        }
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
      const parts = loadParticipants();
      const list = parts[id] ?? [];
      const filtered = list.filter((p) => p !== user.principal);
      if (filtered.length !== list.length) {
        parts[id] = filtered;
        saveParticipants(parts);
        const matches = loadMatches();
        const idx = matches.findIndex((m) => m.id === id);
        if (idx !== -1) {
          matches[idx] = { ...matches[idx], missing: matches[idx].missing + 1n };
          saveMatches(matches);
        }
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
      saveMatches(loadMatches().filter((m) => m.id !== id));
      const parts = loadParticipants();
      delete parts[id];
      saveParticipants(parts);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["matches"] }); },
  });
}

export function useDeleteExpiredMatches() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      if (ids.length === 0) return 0;
      saveMatches(loadMatches().filter((m) => !ids.includes(m.id)));
      const parts = loadParticipants();
      for (const id of ids) delete parts[id];
      saveParticipants(parts);
      return ids.length;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["matches"] }); },
  });
}

export function useGetMyProfile(isLoggedIn: boolean) {
  const { user } = useLocalAuth();
  return useQuery<UserProfile | null>({
    queryKey: ["profile", user?.principal],
    queryFn: () => {
      if (!user) return null;
      const profiles = loadProfiles();
      return profiles[user.principal] ?? { name: user.displayName, bio: "", avatarUrl: "", skills: [] };
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
      const profiles = loadProfiles();
      profiles[user.principal] = data;
      saveProfiles(profiles);
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
    queryFn: () => {
      const profiles = loadProfiles();
      return Object.entries(profiles).map(([principal, profile]) => ({
        owner: principal as unknown as ProfileEntry["owner"],
        profile,
      }));
    },
    enabled: isLoggedIn && !!user,
  });
}

export function useIsMatchParticipant(matchId: string, enabled: boolean) {
  const { user } = useLocalAuth();
  return useQuery<boolean>({
    queryKey: ["isParticipant", matchId, user?.principal],
    queryFn: () => {
      if (!user) return false;
      return (loadParticipants()[matchId] ?? []).includes(user.principal);
    },
    enabled: enabled && !!matchId && !!user,
    staleTime: 10_000,
  });
}

export function useGetMatchParticipants(matchId: string) {
  return useQuery<string[]>({
    queryKey: ["matchParticipants", matchId],
    queryFn: () => loadParticipants()[matchId] ?? [],
    enabled: !!matchId,
    staleTime: 15_000,
  });
}

export function useCheckIn() {
  const { user } = useLocalAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (matchId: string) => {
      if (!user) throw new Error("Bạn cần đăng nhập.");
      const list = loadCheckIns();
      if (list.some((c) => c.matchId === matchId && c.participant === user.principal)) {
        return { __kind__: "err" as const, err: "Đã check-in rồi" };
      }
      list.push({ matchId, participant: user.principal, timestamp: BigInt(Date.now()) });
      saveCheckIns(list);
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
    queryFn: () => loadCheckIns().filter((c) => c.matchId === matchId),
    enabled: enabled && !!matchId,
    staleTime: 10_000,
  });
}

export function useHasCheckedIn(matchId: string, enabled: boolean) {
  const { user } = useLocalAuth();
  return useQuery<boolean>({
    queryKey: ["hasCheckedIn", matchId, user?.principal],
    queryFn: () => {
      if (!user) return false;
      return loadCheckIns().some((c) => c.matchId === matchId && c.participant === user.principal);
    },
    enabled: enabled && !!matchId && !!user,
    staleTime: 10_000,
  });
}

export function useRegisterMe() {
  const { user } = useLocalAuth();
  return useMutation({
    mutationFn: async () => {
      if (!user) return;
      const profiles = loadProfiles();
      if (!profiles[user.principal]) {
        profiles[user.principal] = { name: user.displayName, bio: "", avatarUrl: "", skills: [] };
        saveProfiles(profiles);
      }
    },
  });
}

export function useGetMessages(withUser: string | null, enabled: boolean) {
  const { user } = useLocalAuth();
  return useQuery({
    queryKey: ["messages", withUser],
    queryFn: () => {
      if (!user || !withUser) return [];
      return (loadJSON<unknown[]>(LS_MESSAGES, [])).filter((m: unknown) => {
        const msg = m as { from: string; to: string };
        return (msg.from === user.principal && msg.to === withUser)
          || (msg.from === withUser && msg.to === user.principal);
      });
    },
    enabled: enabled && !!withUser && !!user,
    refetchInterval: 3000,
  });
}

export function useSendMessage() {
  const { user } = useLocalAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { to: string; text: string }) => {
      if (!user) throw new Error("Bạn cần đăng nhập.");
      const all = loadJSON<unknown[]>(LS_MESSAGES, []);
      all.push({ id: uuidv4(), from: user.principal, to: data.to, text: data.text, createdAt: Date.now().toString() });
      saveJSON(LS_MESSAGES, all);
    },
    onSuccess: (_r, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", variables.to] });
    },
  });
}

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
    queryKey: ["myMatches", user?.principal],
    queryFn: () => [],
    enabled: isLoggedIn && !!user,
  });
}

export function useRatePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_data: { ratedPrincipal: unknown; matchId: string; score: number; comment: string }) => {},
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["rankings"] }); },
  });
}

export function useGetAllRankings(isLoggedIn: boolean) {
  const { user } = useLocalAuth();
  return useQuery<PlayerRank[]>({
    queryKey: ["rankings"],
    queryFn: (): PlayerRank[] => [],
    enabled: isLoggedIn && !!user,
  });
}

export function useGetRatingsForPlayer(_playerPrincipal: unknown, enabled: boolean) {
  return useQuery<PlayerRating[]>({
    queryKey: ["playerRatings"],
    queryFn: (): PlayerRating[] => [],
    enabled,
  });
}

export function useGetHotNews() {
  return useQuery<NewsItem[]>({
    queryKey: ["hotNews"],
    queryFn: (): NewsItem[] => [],
    staleTime: 30 * 60 * 1000,
  });
}
