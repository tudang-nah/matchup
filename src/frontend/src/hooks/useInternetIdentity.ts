import { AuthClient } from "@dfinity/auth-client";
import { useCallback, useEffect, useRef, useState } from "react";

const II_URL =
  typeof process !== "undefined" && process.env.DFX_NETWORK === "ic"
    ? "https://identity.ic0.app"
    : "http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:4943";

export interface IIAuthState {
  isLoggedIn: boolean;
  principal: string;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

export function useInternetIdentity(): IIAuthState {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [principal, setPrincipal] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const authClientRef = useRef<AuthClient | null>(null);

  // Init and restore session on mount
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const client = await AuthClient.create();
        if (cancelled) return;
        authClientRef.current = client;
        const authenticated = await client.isAuthenticated();
        if (cancelled) return;
        if (authenticated) {
          const id = client.getIdentity();
          setPrincipal(id.getPrincipal().toString());
          setIsLoggedIn(true);
        }
      } catch (err) {
        console.error("[II] init error:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async () => {
    try {
      // Create fresh client if needed
      if (!authClientRef.current) {
        authClientRef.current = await AuthClient.create();
      }
      const client = authClientRef.current;
      await new Promise<void>((resolve, reject) => {
        client.login({
          identityProvider: II_URL,
          onSuccess: () => {
            const id = client.getIdentity();
            setPrincipal(id.getPrincipal().toString());
            setIsLoggedIn(true);
            resolve();
          },
          onError: (err) => {
            console.error("[II] login error:", err);
            reject(new Error(err ?? "Login failed"));
          },
        });
      });
    } catch (err) {
      console.error("[II] login exception:", err);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (authClientRef.current) {
        await authClientRef.current.logout();
      }
    } catch (err) {
      console.error("[II] logout error:", err);
    } finally {
      setIsLoggedIn(false);
      setPrincipal("");
    }
  }, []);

  return { isLoggedIn, principal, isLoading, login, logout };
}
