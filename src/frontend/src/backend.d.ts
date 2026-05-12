import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface PlayerRating {
    raterPrincipal: Principal;
    createdAt: bigint;
    score: bigint;
    comment: string;
    matchId: string;
    ratedPrincipal: Principal;
}
export type MatchResult = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: string;
};
export interface MatchEntry {
    mutual: boolean;
    matched: Principal;
    profile: UserProfile;
}
export interface MatchPublic {
    id: string;
    title: string;
    creator: Principal;
    participants: Array<Principal>;
    missing: bigint;
    createdAt: bigint;
    time: string;
    sport: string;
    requirements?: string;
    location: string;
}
export interface Message {
    id: string;
    to: Principal;
    from: Principal;
    createdAt: bigint;
    text: string;
}
export interface CheckInPublic {
    participant: string;
    matchId: string;
    timestamp: bigint;
}
export interface ProfileEntry {
    owner: Principal;
    profile: UserProfile;
}
export type AuthResult = {
    __kind__: "ok";
    ok: string;
} | {
    __kind__: "err";
    err: string;
};
export interface NewsItem {
    id: string;
    url: string;
    title: string;
    source: string;
    publishedAt: string;
    description: string;
    sport: string;
    imageUrl: string;
}
export interface UserProfile {
    bio: string;
    name: string;
    avatarUrl: string;
    skills: Array<string>;
}
export interface PlayerRank {
    totalRatings: bigint;
    totalMatches: bigint;
    showUpCount: bigint;
    userPrincipal: Principal;
    lastActive: bigint;
    avgRating: number;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    checkIn(matchId: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createMatch(sport: string, title: string, time: string, location: string, missing: bigint, requirements: string | null): Promise<string>;
    deleteExpiredMatches(ids: Array<string>): Promise<bigint>;
    deleteMatch(id: string): Promise<MatchResult>;
    getAllMatches(): Promise<Array<MatchPublic>>;
    getAllProfiles(): Promise<Array<ProfileEntry>>;
    getAllRankings(): Promise<Array<PlayerRank>>;
    getCallerUserRole(): Promise<UserRole>;
    getCheckIns(matchId: string): Promise<Array<CheckInPublic>>;
    getHotNews(): Promise<Array<NewsItem>>;
    getMatchParticipants(id: string): Promise<Array<Principal>>;
    getMessages(withUser: Principal): Promise<Array<Message>>;
    getMyMatches(): Promise<Array<MatchEntry>>;
    getMyProfile(): Promise<UserProfile | null>;
    getPlayerRank(user: Principal): Promise<PlayerRank | null>;
    getRatingsForPlayer(user: Principal): Promise<Array<PlayerRating>>;
    hasCheckedIn(matchId: string): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    isMatchParticipant(id: string): Promise<boolean>;
    joinMatch(id: string): Promise<void>;
    leaveMatch(id: string): Promise<void>;
    loginUser(username: string, password: string): Promise<AuthResult>;
    logoutUser(token: string): Promise<void>;
    matchWithUser(target: Principal): Promise<void>;
    ratePlayer(matchId: string, ratedPrincipal: Principal, score: bigint, comment: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    registerMe(): Promise<void>;
    registerUser(username: string, password: string): Promise<AuthResult>;
    searchMatchesByLocation(location: string): Promise<Array<MatchPublic>>;
    searchMatchesBySport(sport: string): Promise<Array<MatchPublic>>;
    sendMessage(to: Principal, text: string): Promise<string>;
    updateMyProfile(name: string, bio: string, avatarUrl: string, skills: Array<string>): Promise<void>;
    validateSession(token: string): Promise<string | null>;
}
