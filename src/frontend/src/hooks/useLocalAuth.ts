/**
 * useLocalAuth — thay thế Internet Identity bằng đăng ký/đăng nhập local.
 * Tài khoản lưu trong localStorage, mỗi user có một "principal" giả dạng UUID.
 */

import { useCallback, useEffect, useState } from "react";

export interface LocalUser {
  username: string;
  principal: string; // UUID dùng làm principal giả
  displayName: string;
}

interface StoredAccount {
  username: string;
  passwordHash: string; // sha256 hex
  principal: string;
  displayName: string;
  createdAt: number;
}

const LS_ACCOUNTS_KEY = "matchup_accounts";
const LS_SESSION_KEY = "matchup_session";

// --- helpers ---

function uuidv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function loadAccounts(): StoredAccount[] {
  try {
    return JSON.parse(localStorage.getItem(LS_ACCOUNTS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveAccounts(accounts: StoredAccount[]) {
  localStorage.setItem(LS_ACCOUNTS_KEY, JSON.stringify(accounts));
}

function loadSession(): LocalUser | null {
  try {
    const raw = localStorage.getItem(LS_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(user: LocalUser | null) {
  if (user) {
    localStorage.setItem(LS_SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(LS_SESSION_KEY);
  }
}

// --- hook ---

export type AuthStatus = "idle" | "logged_in" | "loading";

export function useLocalAuth() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("idle");

  // Restore session on mount
  useEffect(() => {
    setStatus("loading");
    const session = loadSession();
    setUser(session);
    setStatus(session ? "logged_in" : "idle");
  }, []);

  const register = useCallback(
    async (
      username: string,
      password: string,
      displayName: string,
    ): Promise<{ ok: boolean; error?: string }> => {
      const trimmed = username.trim().toLowerCase();
      if (!trimmed || trimmed.length < 3)
        return { ok: false, error: "Tên đăng nhập phải có ít nhất 3 ký tự" };
      if (password.length < 6)
        return { ok: false, error: "Mật khẩu phải có ít nhất 6 ký tự" };

      const accounts = loadAccounts();
      if (accounts.find((a) => a.username === trimmed)) {
        return { ok: false, error: "Tên đăng nhập đã tồn tại" };
      }

      const passwordHash = await sha256(password);
      const principal = uuidv4();
      const newAccount: StoredAccount = {
        username: trimmed,
        passwordHash,
        principal,
        displayName: displayName.trim() || trimmed,
        createdAt: Date.now(),
      };

      accounts.push(newAccount);
      saveAccounts(accounts);

      const newUser: LocalUser = {
        username: trimmed,
        principal,
        displayName: newAccount.displayName,
      };
      saveSession(newUser);
      setUser(newUser);
      setStatus("logged_in");

      return { ok: true };
    },
    [],
  );

  const login = useCallback(
    async (
      username: string,
      password: string,
    ): Promise<{ ok: boolean; error?: string }> => {
      const trimmed = username.trim().toLowerCase();
      const accounts = loadAccounts();
      const account = accounts.find((a) => a.username === trimmed);
      if (!account) {
        return { ok: false, error: "Tên đăng nhập không tồn tại" };
      }

      const passwordHash = await sha256(password);
      if (passwordHash !== account.passwordHash) {
        return { ok: false, error: "Mật khẩu không đúng" };
      }

      const loggedUser: LocalUser = {
        username: account.username,
        principal: account.principal,
        displayName: account.displayName,
      };
      saveSession(loggedUser);
      setUser(loggedUser);
      setStatus("logged_in");

      return { ok: true };
    },
    [],
  );

  const logout = useCallback(() => {
    saveSession(null);
    setUser(null);
    setStatus("idle");
  }, []);

  const isLoggedIn = status === "logged_in" && !!user;

  return { user, status, isLoggedIn, register, login, logout };
}
