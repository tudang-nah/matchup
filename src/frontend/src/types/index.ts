import type { Principal } from "@icp-sdk/core/principal";

// Match / game session
export interface Match {
  id: string;
  sport: string;
  title: string;
  time: string;
  location: string;
  missing: bigint;
  createdAt?: bigint;
  requirements?: string;
  creator?: Principal;
}

// User profile data (nested)
export interface UserProfile {
  name: string;
  bio: string;
  avatarUrl: string;
  skills: string[];
}

// Profile entry returned by getAllProfiles
export interface ProfileEntry {
  owner: Principal;
  profile: UserProfile;
}

// Match-with-user entry
export interface MatchEntry {
  matched: Principal;
  mutual: boolean;
  profile: UserProfile;
}

// Chat message
export interface Message {
  id: string;
  from: Principal;
  to: Principal;
  text: string;
  createdAt: bigint;
}

// Player rating (submitted by one player for another after a match)
export interface PlayerRating {
  raterPrincipal: Principal;
  ratedPrincipal: Principal;
  matchId: string;
  score: number; // 1–5
  comment: string;
  createdAt: bigint;
}

// News article from backend getHotNews()
export interface NewsItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  url: string;
  source: string;
  publishedAt: string;
  sport: string;
}

// Player rank/leaderboard entry// Check-in record for a match (returned by getCheckIns)
export interface CheckInPublic {
  matchId: string;
  participant: string;
  timestamp: bigint;
}

export interface PlayerRank {
  userPrincipal: Principal;
  totalMatches: bigint;
  showUpCount: bigint;
  avgRating: number;
  totalRatings: bigint;
  lastActive: bigint;
}
