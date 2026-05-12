import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import { useState } from "react";
import type { useLocalAuth } from "./hooks/useLocalAuth";

type AuthHook = ReturnType<typeof useLocalAuth>;

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auth: AuthHook;
}

export function AuthModal({ open, onOpenChange, auth }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function reset() {
    setUsername("");
    setDisplayName("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
    setLoading(false);
  }

  function switchTab(t: "login" | "register") {
    setTab(t);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === "register") {
        if (password !== confirmPassword) {
          setError("Mật khẩu xác nhận không khớp");
          return;
        }
        const res = await auth.register(username, password, displayName);
        if (!res.ok) {
          setError(res.error ?? "Đăng ký thất bại");
          return;
        }
      } else {
        const res = await auth.login(username, password);
        if (!res.ok) {
          setError(res.error ?? "Đăng nhập thất bại");
          return;
        }
      }
      reset();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            {tab === "login" ? "🏅 Đăng nhập MatchUp" : "🎯 Tạo tài khoản"}
          </DialogTitle>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex rounded-xl overflow-hidden border border-border mb-2">
          <button
            type="button"
            onClick={() => switchTab("login")}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${
              tab === "login"
                ? "bg-primary text-white"
                : "bg-transparent text-muted-foreground hover:bg-muted"
            }`}
          >
            <LogIn className="w-3.5 h-3.5 inline mr-1.5" />
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => switchTab("register")}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${
              tab === "register"
                ? "bg-primary text-white"
                : "bg-transparent text-muted-foreground hover:bg-muted"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 inline mr-1.5" />
            Đăng ký
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="auth-username" className="text-sm font-semibold">
              Tên đăng nhập
            </Label>
            <Input
              id="auth-username"
              placeholder="vd: nguyenvana"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              className="min-h-[44px]"
            />
          </div>

          {tab === "register" && (
            <div className="space-y-1.5">
              <Label
                htmlFor="auth-displayname"
                className="text-sm font-semibold"
              >
                Tên hiển thị
              </Label>
              <Input
                id="auth-displayname"
                placeholder="vd: Nguyễn Văn A"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="min-h-[44px]"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="auth-password" className="text-sm font-semibold">
              Mật khẩu
            </Label>
            <Input
              id="auth-password"
              type="password"
              placeholder="Ít nhất 6 ký tự"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={
                tab === "register" ? "new-password" : "current-password"
              }
              required
              className="min-h-[44px]"
            />
          </div>

          {tab === "register" && (
            <div className="space-y-1.5">
              <Label
                htmlFor="auth-confirm"
                className="text-sm font-semibold"
              >
                Xác nhận mật khẩu
              </Label>
              <Input
                id="auth-confirm"
                type="password"
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
                className="min-h-[44px]"
              />
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                {error}
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 font-bold text-white border-0 rounded-full"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.58 0.18 220), oklch(0.70 0.20 138))",
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : tab === "login" ? (
              <>
                <LogIn className="w-4 h-4 mr-2" /> Đăng nhập
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" /> Tạo tài khoản
              </>
            )}
          </Button>

          {tab === "login" && (
            <p className="text-center text-xs text-muted-foreground">
              Chưa có tài khoản?{" "}
              <button
                type="button"
                onClick={() => switchTab("register")}
                className="text-primary font-semibold hover:underline"
              >
                Đăng ký ngay
              </button>
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
