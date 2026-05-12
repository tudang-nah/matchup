import type { Principal } from "@icp-sdk/core/principal";
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
import { useBackendActor } from "./useBackendActor";

export function useGetAllMatches() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Match[]>({
    queryKey: ["matches"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMatches();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 3000,
  });
}

export function useCreateMatch() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      sport: string;
      title: string;
      time: string;
      location: string;
      missing: bigint;
      requirements?: string;
    }) => {
      if (!actor)
        throw new Error(
          "Not connected to backend. Please wait for connection.",
        );
      console.log("[createMatch] payload:", data);
      const result = await actor.createMatch(
        data.sport,
        data.title,
        data.time,
        data.location,
        data.missing,
        data.requirements?.trim() || null,
      );
      console.log("[createMatch] result:", result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}

export function useJoinMatch() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.joinMatch(id);
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["matches"] });
      const previous = queryClient.getQueryData<Match[]>(["matches"]);
      queryClient.setQueryData<Match[]>(["matches"], (old) =>
        (old ?? []).map((m) =>
          m.id === id
            ? { ...m, missing: m.missing > 0n ? m.missing - 1n : 0n }
            : m,
        ),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["matches"], context.previous);
      }
    },
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["isParticipant", id] });
      queryClient.invalidateQueries({ queryKey: ["matchParticipants", id] });
    },
  });
}

export function useDeleteMatch() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteMatch(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}

export function useGetMyProfile(isLoggedIn: boolean) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<UserProfile | null>({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMyProfile();
    },
    enabled: !!actor && !isFetching && isLoggedIn,
  });
}

export function useUpdateMyProfile() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      bio: string;
      avatarUrl: string;
      skills: Array<string>;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateMyProfile(
        data.name,
        data.bio,
        data.avatarUrl,
        data.skills,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useGetAllProfiles(isLoggedIn: boolean) {
  const { actor, isFetching } = useBackendActor();
  return useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllProfiles();
    },
    enabled: !!actor && !isFetching && isLoggedIn,
  });
}

export function useMatchWithUser() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (target: ProfileEntry["owner"]) => {
      if (!actor) throw new Error("Not connected");
      return actor.matchWithUser(target);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myMatches"] });
    },
  });
}

export function useGetMyMatches(isLoggedIn: boolean) {
  const { actor, isFetching } = useBackendActor();
  return useQuery({
    queryKey: ["myMatches"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyMatches();
    },
    enabled: !!actor && !isFetching && isLoggedIn,
  });
}

export function useGetMessages(
  withUser: ProfileEntry["owner"] | null,
  enabled: boolean,
) {
  const { actor, isFetching } = useBackendActor();
  return useQuery({
    queryKey: ["messages", withUser?.toString()],
    queryFn: async () => {
      if (!actor || !withUser) return [];
      return actor.getMessages(withUser);
    },
    enabled: !!actor && !isFetching && enabled && !!withUser,
    refetchInterval: 3000,
  });
}

export function useSendMessage() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      to: ProfileEntry["owner"];
      text: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.sendMessage(data.to, data.text);
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.to.toString()],
      });
    },
  });
}

export function useRegisterMe() {
  const { actor } = useBackendActor();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return actor.registerMe();
    },
  });
}

export function useDeleteExpiredMatches() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      if (!actor || ids.length === 0) return 0;
      return actor.deleteExpiredMatches(ids);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}

/**
 * Checks whether the current user has already joined a specific match.
 */
export function useIsMatchParticipant(matchId: string, enabled: boolean) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<boolean>({
    queryKey: ["isParticipant", matchId],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isMatchParticipant(matchId);
    },
    enabled: !!actor && !isFetching && enabled && !!matchId,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

/**
 * Leaves a match the current user has joined.
 */
export function useLeaveMatch() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.leaveMatch(id);
    },
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["isParticipant", id] });
      queryClient.invalidateQueries({ queryKey: ["matchParticipants", id] });
    },
  });
}

/**
 * Returns the list of Principal IDs that have joined a specific match.
 */
export function useGetMatchParticipants(matchId: string) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Principal[]>({
    queryKey: ["matchParticipants", matchId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMatchParticipants(matchId);
    },
    enabled: !!actor && !isFetching && !!matchId,
    staleTime: 15_000,
    refetchInterval: 15_000,
  });
}

/**
 * Call checkIn for the current user on a specific match.
 */
export function useCheckIn() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (matchId: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.checkIn(matchId);
    },
    onSuccess: (_result, matchId) => {
      queryClient.invalidateQueries({ queryKey: ["checkIns", matchId] });
      queryClient.invalidateQueries({ queryKey: ["hasCheckedIn", matchId] });
    },
  });
}

/**
 * Get all check-ins for a specific match.
 */
export function useGetCheckIns(matchId: string, enabled: boolean) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<CheckInPublic[]>({
    queryKey: ["checkIns", matchId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCheckIns(matchId);
    },
    enabled: !!actor && !isFetching && enabled && !!matchId,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

/**
 * Check if the current user has already checked in for a match.
 */
export function useHasCheckedIn(matchId: string, enabled: boolean) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<boolean>({
    queryKey: ["hasCheckedIn", matchId],
    queryFn: async () => {
      if (!actor) return false;
      return actor.hasCheckedIn(matchId);
    },
    enabled: !!actor && !isFetching && enabled && !!matchId,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

/**
 * Rate a player after a match. Falls back gracefully if backend doesn't support it yet.
 */
export function useRatePlayer() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      ratedPrincipal: Principal;
      matchId: string;
      score: number;
      comment: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const actorAny = actor as unknown as Record<
        string,
        (...args: unknown[]) => Promise<unknown>
      >;
      if (typeof actorAny.ratePlayer !== "function") {
        throw new Error("Tính năng đánh giá chưa được kích hoạt trên backend.");
      }
      return actorAny.ratePlayer(
        data.ratedPrincipal,
        data.matchId,
        data.score,
        data.comment,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rankings"] });
    },
  });
}

/**
 * Get rankings for all players. Falls back to empty array if not supported.
 */
export function useGetAllRankings(isLoggedIn: boolean) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<PlayerRank[]>({
    queryKey: ["rankings"],
    queryFn: async (): Promise<PlayerRank[]> => {
      if (!actor) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const actorAny = actor as unknown as Record<
        string,
        (...args: unknown[]) => Promise<unknown>
      >;
      if (typeof actorAny.getAllRankings !== "function") return [];
      try {
        const result = await actorAny.getAllRankings();
        return result as PlayerRank[];
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && isLoggedIn,
    refetchInterval: 30_000,
  });
}

/**
 * Get ratings for a specific player. Falls back to empty array if not supported.
 */
export function useGetRatingsForPlayer(
  playerPrincipal: Principal | null,
  enabled: boolean,
) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<PlayerRating[]>({
    queryKey: ["playerRatings", playerPrincipal?.toString()],
    queryFn: async (): Promise<PlayerRating[]> => {
      if (!actor || !playerPrincipal) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const actorAny = actor as unknown as Record<
        string,
        (...args: unknown[]) => Promise<unknown>
      >;
      if (typeof actorAny.getRatingsForPlayer !== "function") return [];
      try {
        const result = await actorAny.getRatingsForPlayer(playerPrincipal);
        return result as PlayerRating[];
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && enabled && !!playerPrincipal,
  });
}

/**
 * Fetch hot sports news from backend (cached 30 minutes).
 * Falls back to empty array if backend doesn't support it (e.g. GitHub Pages static demo).
 */
export function useGetHotNews() {
  const { actor, isFetching } = useBackendActor();
  const THIRTY_MIN = 30 * 60 * 1000;
  return useQuery<NewsItem[]>({
    queryKey: ["hotNews"],
    queryFn: async (): Promise<NewsItem[]> => {
      if (!actor) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const actorAny = actor as unknown as Record<
        string,
        (...args: unknown[]) => Promise<unknown>
      >;
      if (typeof actorAny.getHotNews !== "function") return [];
      try {
        const result = await actorAny.getHotNews();
        return result as NewsItem[];
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: THIRTY_MIN,
    refetchInterval: THIRTY_MIN,
    retry: 2,
  });
}
