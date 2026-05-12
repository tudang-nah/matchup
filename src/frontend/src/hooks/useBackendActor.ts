import { useActor } from "@caffeineai/core-infrastructure";
import type { Principal } from "@icp-sdk/core/principal";
import { useRef } from "react";
import { ExternalBlob, createActor } from "../backend";
import type { CreateActorOptions } from "../backend";

// Typed actor interface for all backend methods used in this app
export interface AppActor {
  getAllMatches(): Promise<import("../types").Match[]>;
  createMatch(
    sport: string,
    title: string,
    time: string,
    location: string,
    missing: bigint,
    requirements: string | null,
  ): Promise<string>;
  joinMatch(id: string): Promise<void>;
  deleteMatch(id: string): Promise<void>;
  deleteExpiredMatches(ids: string[]): Promise<bigint>;
  getMyProfile(): Promise<import("../types").UserProfile | null>;
  updateMyProfile(
    name: string,
    bio: string,
    avatarUrl: string,
    skills: string[],
  ): Promise<void>;
  getAllProfiles(): Promise<import("../types").ProfileEntry[]>;
  matchWithUser(
    target: import("../types").ProfileEntry["owner"],
  ): Promise<void>;
  getMyMatches(): Promise<import("../types").MatchEntry[]>;
  getMessages(
    withUser: import("../types").ProfileEntry["owner"],
  ): Promise<import("../types").Message[]>;
  sendMessage(
    to: import("../types").ProfileEntry["owner"],
    text: string,
  ): Promise<string>;
  registerMe(): Promise<void>;
  isMatchParticipant(id: string): Promise<boolean>;
  leaveMatch(id: string): Promise<void>;
  getMatchParticipants(id: string): Promise<Principal[]>;
  checkIn(
    matchId: string,
  ): Promise<{ __kind__: "ok"; ok: string } | { __kind__: "err"; err: string }>;
  getCheckIns(matchId: string): Promise<import("../types").CheckInPublic[]>;
  hasCheckedIn(matchId: string): Promise<boolean>;
}

// Wraps a promise with a timeout so that actor calls never hang indefinitely.
// If the promise does not resolve within `ms`, it rejects with a timeout error.
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Actor call timed out after ${ms}ms`)),
      ms,
    );
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e: unknown) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

// Timeout for individual actor method calls (30 seconds)
const ACTOR_CALL_TIMEOUT_MS = 30_000;

// Creates a Proxy around the actor that wraps every method call with a timeout
// guard and error logging, preventing silent hangs.
function wrapActorWithTimeout(actor: AppActor): AppActor {
  return new Proxy(actor, {
    get(target, prop) {
      const value = target[prop as keyof AppActor];
      if (typeof value !== "function") return value;
      return (...args: unknown[]) => {
        let result: unknown;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          result = (value as (...a: unknown[]) => unknown).apply(target, args);
        } catch (err) {
          console.error(`[actor.${String(prop)}] sync error:`, err);
          return Promise.reject(err);
        }
        if (result instanceof Promise) {
          return withTimeout(result, ACTOR_CALL_TIMEOUT_MS).catch(
            (err: unknown) => {
              console.error(`[actor.${String(prop)}] call failed:`, err);
              return Promise.reject(err);
            },
          );
        }
        return result;
      };
    },
  });
}

export function useBackendActor() {
  // The infrastructure's useActor calls createActor(canisterId, options).
  // But the generated createActor signature is createActor(canisterId, uploadFile, downloadFile, options).
  // We wrap it to inject no-op file handlers so the infrastructure can call it correctly.
  const wrappedCreateActor = useRef(
    (canisterId: string, options?: Record<string, unknown>) => {
      const noopUpload = async (_file: ExternalBlob): Promise<Uint8Array> =>
        new Uint8Array();
      const noopDownload = async (_file: Uint8Array): Promise<ExternalBlob> =>
        ExternalBlob.fromBytes(new Uint8Array());
      return createActor(
        canisterId,
        noopUpload,
        noopDownload,
        (options as CreateActorOptions) ?? {},
      );
    },
  ).current;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = useActor(wrappedCreateActor as any) as {
    actor: AppActor | null;
    isFetching: boolean;
  };

  // Wrap the actor with timeout+error handling when it's available
  const actor = raw.actor ? wrapActorWithTimeout(raw.actor) : null;

  return { actor, isFetching: raw.isFetching };
}
