import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import { AuthModal } from "./AuthModal";
import { useLocalAuth } from "./hooks/useLocalAuth";
import {
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Heart,
  Loader2,
  LogIn,
  LogOut,
  MapPin,
  Medal,
  Moon,
  Newspaper,
  Pencil,
  Plus,
  QrCode,
  ScanLine,
  Search,
  Star,
  Sun,
  Target,
  Trash2,
  Trophy,
  User,
  Users,
  Wifi,
  WifiOff,
  X,
  Zap,
  Share2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ChatSection } from "./ChatSection";
import { useMatchReminders } from "./hooks/useMatchReminders";
import { type Notification, useNotifications } from "./hooks/useNotifications";
import {
  useCheckIn,
  useCreateMatch,
  useDeleteExpiredMatches,
  useDeleteMatch,
  useGetAllMatches,
  useGetAllProfiles,
  useGetAllRankings,
  useGetCheckIns,
  useGetHotNews,
  useGetMatchParticipants,
  useGetMyMatches,
  useGetMyProfile,
  useHasCheckedIn,
  useIsMatchParticipant,
  useJoinMatch,
  useLeaveMatch,
  useMatchWithUser,
  useRatePlayer,
  useRegisterMe,
  useSendMessage,
  useUpdateMyProfile,
} from "./hooks/useQueries";
import type {
  CheckInPublic,
  Match,
  MatchEntry,
  NewsItem,
  PlayerRank,
  ProfileEntry,
} from "./types";

const SPORTS = [
  "Soccer",
  "Basketball",
  "Tennis",
  "Volleyball",
  "Badminton",
  "Swimming",
  "Running",
  "Cycling",
  "Table Tennis",
  "Futsal",
];

// ---- VENUE DATABASE ----
interface Venue {
  name: string;
  address: string;
  district: string;
  sports: string[];
  lat: number;
  lng: number;
}

const VENUES: Venue[] = [
  // Quận 1
  {
    name: "Sân Hoa Lư",
    address: "2 Đinh Tiên Hoàng, Bình Thạnh",
    district: "Quận 1",
    sports: ["Soccer", "Futsal"],
    lat: 10.7892,
    lng: 106.7045,
  },
  {
    name: "Hồ bơi Lam Sơn",
    address: "7 Lam Sơn, Phường 6, Bình Thạnh",
    district: "Quận 1",
    sports: ["Swimming"],
    lat: 10.8003,
    lng: 106.7121,
  },
  {
    name: "Công viên 23 tháng 9",
    address: "Phạm Ngũ Lão, Phường Phạm Ngũ Lão",
    district: "Quận 1",
    sports: ["Running", "Cycling", "Badminton"],
    lat: 10.7692,
    lng: 106.6934,
  },
  {
    name: "Sân tennis Hoàng Gia",
    address: "31 Nguyễn Bỉnh Khiêm, Đa Kao",
    district: "Quận 1",
    sports: ["Tennis"],
    lat: 10.7885,
    lng: 106.7057,
  },
  // Quận 3
  {
    name: "Sân vận động Thống Nhất",
    address: "138 Đào Duy Từ, Phường 6",
    district: "Quận 10",
    sports: ["Soccer", "Running", "Cycling"],
    lat: 10.7784,
    lng: 106.6854,
  },
  {
    name: "Công viên Tao Đàn",
    address: "55C Nguyễn Thị Minh Khai",
    district: "Quận 3",
    sports: ["Running", "Badminton", "Table Tennis"],
    lat: 10.776,
    lng: 106.693,
  },
  {
    name: "Hồ bơi Phú Thọ",
    address: "1 Lữ Gia, Phường 15",
    district: "Quận 11",
    sports: ["Swimming"],
    lat: 10.7651,
    lng: 106.6592,
  },
  // Quận 5
  {
    name: "Sân cầu lông Thể Công",
    address: "15 Tô Hiến Thành, Phường 13",
    district: "Quận 10",
    sports: ["Badminton", "Table Tennis"],
    lat: 10.7755,
    lng: 106.6681,
  },
  {
    name: "Sân bóng rổ Nguyễn Tri Phương",
    address: "105 Nguyễn Tri Phương",
    district: "Quận 5",
    sports: ["Basketball"],
    lat: 10.7565,
    lng: 106.6783,
  },
  // Quận 7
  {
    name: "Sân bóng đá Phú Mỹ Hưng",
    address: "Nguyễn Văn Linh, Tân Phong",
    district: "Quận 7",
    sports: ["Soccer", "Futsal"],
    lat: 10.7283,
    lng: 106.7182,
  },
  {
    name: "Công viên Phú Mỹ Hưng",
    address: "Nguyễn Văn Linh, Tân Phong",
    district: "Quận 7",
    sports: ["Running", "Cycling", "Badminton"],
    lat: 10.731,
    lng: 106.7152,
  },
  {
    name: "Hồ bơi Phú Mỹ Hưng",
    address: "99 Nguyễn Thị Thập, Tân Phú",
    district: "Quận 7",
    sports: ["Swimming"],
    lat: 10.7245,
    lng: 106.7063,
  },
  {
    name: "Sân tennis Sunrise",
    address: "29B Cộng Hòa, Tân Bình",
    district: "Quận 7",
    sports: ["Tennis"],
    lat: 10.7201,
    lng: 106.709,
  },
  // Quận 10
  {
    name: "Nhà thi đấu Phú Thọ",
    address: "1 Lữ Gia, Phường 15",
    district: "Quận 11",
    sports: ["Basketball", "Badminton", "Table Tennis", "Volleyball"],
    lat: 10.766,
    lng: 106.6583,
  },
  {
    name: "Sân bóng chuyền Hoa Lư",
    address: "2 Đinh Tiên Hoàng, Bình Thạnh",
    district: "Quận 1",
    sports: ["Volleyball"],
    lat: 10.7893,
    lng: 106.7048,
  },
  // Tân Bình
  {
    name: "Sân bóng đá Tân Bình",
    address: "115 Hoàng Hoa Thám, Phường 13",
    district: "Tân Bình",
    sports: ["Soccer", "Futsal"],
    lat: 10.8093,
    lng: 106.6512,
  },
  {
    name: "Hồ bơi Tân Bình",
    address: "293 Hoàng Văn Thụ, Phường 1",
    district: "Tân Bình",
    sports: ["Swimming"],
    lat: 10.8001,
    lng: 106.657,
  },
  {
    name: "Sân cầu lông Phạm Văn Hai",
    address: "Phạm Văn Hai, Tân Bình",
    district: "Tân Bình",
    sports: ["Badminton", "Table Tennis"],
    lat: 10.8051,
    lng: 106.661,
  },
  // Bình Thạnh
  {
    name: "Công viên Gia Định",
    address: "1 Hoàng Minh Giám, Phường 9",
    district: "Bình Thạnh",
    sports: ["Running", "Cycling", "Badminton"],
    lat: 10.8123,
    lng: 106.692,
  },
  {
    name: "Sân tennis Bình Thạnh",
    address: "87 Đinh Tiên Hoàng, Phường 3",
    district: "Bình Thạnh",
    sports: ["Tennis"],
    lat: 10.8023,
    lng: 106.701,
  },
  {
    name: "Hồ bơi Bình Thạnh",
    address: "60 Nguyễn Xí, Phường 26",
    district: "Bình Thạnh",
    sports: ["Swimming"],
    lat: 10.7983,
    lng: 106.7082,
  },
  {
    name: "Sân bóng rổ Ung Văn Khiêm",
    address: "Ung Văn Khiêm, Phường 25",
    district: "Bình Thạnh",
    sports: ["Basketball", "Volleyball"],
    lat: 10.807,
    lng: 106.7093,
  },
  // Gò Vấp
  {
    name: "Sân bóng đá Gò Vấp",
    address: "272 Nguyễn Văn Nghi, Phường 7",
    district: "Gò Vấp",
    sports: ["Soccer", "Futsal"],
    lat: 10.828,
    lng: 106.6762,
  },
  {
    name: "Công viên Làng Hoa",
    address: "168 Phan Văn Trị, Phường 10",
    district: "Gò Vấp",
    sports: ["Running", "Badminton"],
    lat: 10.839,
    lng: 106.673,
  },
  {
    name: "Sân cầu lông Gò Vấp",
    address: "350 Quang Trung, Phường 10",
    district: "Gò Vấp",
    sports: ["Badminton", "Table Tennis"],
    lat: 10.831,
    lng: 106.669,
  },
  // Thủ Đức / TP. Thủ Đức
  {
    name: "Làng Đại Học Quốc Gia",
    address: "Khu phố 6, Linh Trung",
    district: "Thủ Đức",
    sports: ["Soccer", "Basketball", "Badminton", "Volleyball", "Running"],
    lat: 10.8706,
    lng: 106.8018,
  },
  {
    name: "Hồ bơi ĐHQG TP.HCM",
    address: "Khu phố 6, Linh Trung",
    district: "Thủ Đức",
    sports: ["Swimming"],
    lat: 10.8712,
    lng: 106.8022,
  },
  {
    name: "Sân tennis ĐHQG",
    address: "Khu phố 6, Linh Trung",
    district: "Thủ Đức",
    sports: ["Tennis"],
    lat: 10.8698,
    lng: 106.8031,
  },
  {
    name: "Công viên Tam Đảo",
    address: "Hiệp Bình Phước, Thủ Đức",
    district: "Thủ Đức",
    sports: ["Running", "Cycling"],
    lat: 10.849,
    lng: 106.753,
  },
  // Quận 9 / Long Bình
  {
    name: "Sân bóng đá Trường Thọ",
    address: "73 Lã Xuân Oai, Long Trường",
    district: "Quận 9",
    sports: ["Soccer", "Futsal"],
    lat: 10.801,
    lng: 106.812,
  },
  {
    name: "Khu thể thao Cát Lái",
    address: "Nguyễn Thị Định, Cát Lái",
    district: "Quận 2",
    sports: ["Soccer", "Basketball", "Volleyball"],
    lat: 10.789,
    lng: 106.768,
  },
  // Quận 12
  {
    name: "Sân bóng đá Quận 12",
    address: "15 Lê Thị Riêng, Thới An",
    district: "Quận 12",
    sports: ["Soccer", "Futsal"],
    lat: 10.8601,
    lng: 106.6401,
  },
  {
    name: "Hồ bơi Quận 12",
    address: "Tô Ký, Trung Mỹ Tây",
    district: "Quận 12",
    sports: ["Swimming"],
    lat: 10.862,
    lng: 106.636,
  },
  // Nhà Bè
  {
    name: "Sân thể thao Nhà Bè",
    address: "168 Huỳnh Tấn Phát, Phú Xuân",
    district: "Nhà Bè",
    sports: ["Soccer", "Badminton", "Volleyball"],
    lat: 10.698,
    lng: 106.726,
  },
  // Bình Chánh
  {
    name: "Trung tâm TDTT Bình Chánh",
    address: "QL50, Bình Chánh",
    district: "Bình Chánh",
    sports: ["Soccer", "Badminton", "Table Tennis"],
    lat: 10.687,
    lng: 106.632,
  },
  // Indoor multifunction
  {
    name: "SVĐ Quân khu 7",
    address: "720A Điện Biên Phủ, Phường 22, Bình Thạnh",
    district: "Bình Thạnh",
    sports: ["Soccer", "Running", "Cycling"],
    lat: 10.8202,
    lng: 106.7171,
  },
  {
    name: "Cung thể thao Quán Ngựa",
    address: "83A Hoàng Hoa Thám, Phường 12, Bình Thạnh",
    district: "Bình Thạnh",
    sports: ["Basketball", "Volleyball", "Badminton", "Table Tennis", "Futsal"],
    lat: 10.8065,
    lng: 106.6953,
  },
  {
    name: "Rink trượt băng Vincom Center",
    address: "72 Lê Thánh Tôn, Bến Nghé",
    district: "Quận 1",
    sports: ["Running"],
    lat: 10.7795,
    lng: 106.7008,
  },
  {
    name: "Sân cầu lông Lê Văn Sỹ",
    address: "160 Lê Văn Sỹ, Phường 12",
    district: "Quận 3",
    sports: ["Badminton", "Table Tennis"],
    lat: 10.7841,
    lng: 106.681,
  },
  {
    name: "Sân bóng rổ Tân Bình",
    address: "293 Cộng Hòa, Tân Bình",
    district: "Tân Bình",
    sports: ["Basketball"],
    lat: 10.802,
    lng: 106.653,
  },
];

const SPORT_CONFIG: Record<
  string,
  { band: string; emoji: string; color: string; flickrTag: string }
> = {
  Soccer: {
    band: "sport-band-soccer",
    emoji: "⚽",
    color: "#22C55E",
    flickrTag: "soccer",
  },
  Basketball: {
    band: "sport-band-basketball",
    emoji: "🏀",
    color: "#F97316",
    flickrTag: "basketball",
  },
  Tennis: {
    band: "sport-band-tennis",
    emoji: "🎾",
    color: "#EAB308",
    flickrTag: "tennis",
  },
  Volleyball: {
    band: "sport-band-volleyball",
    emoji: "🏐",
    color: "#3B82F6",
    flickrTag: "volleyball",
  },
  Badminton: {
    band: "sport-band-badminton",
    emoji: "🏸",
    color: "#A855F7",
    flickrTag: "badminton",
  },
  Swimming: {
    band: "sport-band-swimming",
    emoji: "🏊",
    color: "#06B6D4",
    flickrTag: "swimming",
  },
  Running: {
    band: "sport-band-running",
    emoji: "🏃",
    color: "#F59E0B",
    flickrTag: "running",
  },
  Cycling: {
    band: "sport-band-cycling",
    emoji: "🚴",
    color: "#10B981",
    flickrTag: "cycling",
  },
  "Table Tennis": {
    band: "sport-band-tabletennis",
    emoji: "🏓",
    color: "#EC4899",
    flickrTag: "tabletennis",
  },
  Futsal: {
    band: "sport-band-futsal",
    emoji: "🥅",
    color: "#8B5CF6",
    flickrTag: "futsal",
  },
};

function getSportConfig(sport: string) {
  return (
    SPORT_CONFIG[sport] ?? {
      band: "sport-band-default",
      emoji: "🎯",
      color: "#14B8A6",
      flickrTag: "sport",
    }
  );
}

function formatDateTime(timeStr: string): string {
  try {
    const d = new Date(timeStr);
    return d.toLocaleDateString("vi-VN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return timeStr;
  }
}

// ---- DARK MODE HOOK ----
function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const toggleDark = () => setIsDark((prev) => !prev);
  return { isDark, toggleDark };
}

// ---- CONNECTION STATUS ----
function ConnectionStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  const { isFetching, isError } = useGetAllMatches();

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (!online || isError) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium text-red-500">
        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
        <WifiOff className="w-3 h-3" />
        <span className="hidden sm:inline">Mất kết nối</span>
      </div>
    );
  }

  if (isFetching) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium text-yellow-600">
        <span className="w-2 h-2 rounded-full bg-yellow-500 pulse-yellow shrink-0" />
        <span className="hidden sm:inline">Đang kết nối...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs font-medium text-green-600">
      <span className="w-2 h-2 rounded-full bg-green-500 pulse-green shrink-0" />
      <Wifi className="w-3 h-3" />
      <span className="hidden sm:inline">Trực tuyến</span>
    </div>
  );
}

// ---- PROFILE SHEET ----
function ProfileSheet({
  open,
  onOpenChange,
  isLoggedIn,
  onLoginRequest,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoggedIn: boolean;
  onLoginRequest: () => void;
  user: { principal: string; displayName: string } | null;
}) {
  const { data: profile, isLoading } = useGetMyProfile(isLoggedIn);
  const updateMutation = useUpdateMyProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    bio: "",
    avatarUrl: "",
    skills: "",
  });

  // Sync form when profile loads or sheet opens
  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
        skills: profile.skills.join(", "),
      });
    }
  }, [profile]);

  function startEdit() {
    setForm({
      name: profile?.name ?? "",
      bio: profile?.bio ?? "",
      avatarUrl: profile?.avatarUrl ?? "",
      skills: (profile?.skills ?? []).join(", "),
    });
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
  }

  async function handleSave() {
    // 1. Auth guard
    if (!isLoggedIn) {
      toast.error("Vui lòng đăng nhập để lưu hồ sơ.");
      onLoginRequest();
      return;
    }

    // 2. Build payload
    const payload = {
      name: form.name.trim(),
      bio: form.bio.trim(),
      avatarUrl: form.avatarUrl.trim(),
      skills: form.skills
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean) as string[],
    };

    // 3. Call backend
    try {
      const result = await updateMutation.mutateAsync(payload);

      if (
        result !== undefined &&
        result !== null &&
        typeof result === "object" &&
        "err" in result
      ) {
        const errMsg = String((result as { err: unknown }).err);
        throw new Error(errMsg);
      }

      toast.success("Đã lưu hồ sơ thành công!");
      setIsEditing(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Không thể lưu hồ sơ: ${msg}`);
    }
  }

  const displayName = profile?.name || "Chưa có tên";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        data-ocid="profile.sheet"
        className="w-full sm:max-w-md overflow-y-auto"
        side="right"
      >
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl font-bold">Hồ Sơ Cá Nhân</SheetTitle>
          <SheetDescription className="text-muted-foreground text-sm">
            Thông tin cá nhân của bạn trên MatchUp
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div
            data-ocid="profile.loading_state"
            className="flex flex-col items-center gap-4 py-12"
          >
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Đang tải hồ sơ...</p>
          </div>
        ) : isEditing ? (
          // ---- EDIT FORM ----
          <motion.div
            data-ocid="profile.panel"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="space-y-5"
          >
            <div className="space-y-2">
              <Label htmlFor="profile-name" className="font-semibold text-sm">
                Tên
              </Label>
              <Input
                id="profile-name"
                data-ocid="profile.input"
                placeholder="Nguyễn Văn A"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-bio" className="font-semibold text-sm">
                Giới thiệu
              </Label>
              <Textarea
                id="profile-bio"
                data-ocid="profile.textarea"
                placeholder="Mô tả ngắn về bản thân..."
                value={form.bio}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, bio: e.target.value }))
                }
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold text-sm">Ảnh đại diện</Label>
              <div className="flex gap-2 items-center">
                <div className="flex-1 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs px-3"
                    onClick={() => {
                      const seed = (form.name.trim() || Math.random().toString(36).slice(2)) + Date.now();
                      const url = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
                      setForm((prev) => ({ ...prev, avatarUrl: url }));
                    }}
                  >
                    🎲 Tạo tự động
                  </Button>
                </div>
                {form.avatarUrl && (
                  <img
                    src={form.avatarUrl}
                    alt="preview"
                    className="w-12 h-12 rounded-full object-cover border border-border shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    onLoad={(e) => { (e.target as HTMLImageElement).style.display = "block"; }}
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-skills" className="font-semibold text-sm">
                Kỹ năng (cách nhau bởi dấu phẩy)
              </Label>
              <Input
                id="profile-skills"
                data-ocid="profile.skills_input"
                placeholder="Soccer, Basketball, Teamwork..."
                value={form.skills}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, skills: e.target.value }))
                }
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                data-ocid="profile.save_button"
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="flex-1 rounded-full font-semibold text-white border-0"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.58 0.18 220), oklch(0.70 0.20 138))",
                }}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang
                    lưu...
                  </>
                ) : (
                  "Lưu"
                )}
              </Button>
              <Button
                data-ocid="profile.cancel_button"
                variant="outline"
                onClick={cancelEdit}
                className="flex-1 rounded-full font-semibold"
              >
                <X className="w-4 h-4 mr-1" /> Hủy
              </Button>
            </div>
          </motion.div>
        ) : (
          // ---- VIEW MODE ----
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Avatar + Name */}
            <div className="flex flex-col items-center gap-4 py-4">
              <Avatar className="w-28 h-28 border-4 border-border shadow-xl">
                {profile?.avatarUrl ? (
                  <AvatarImage src={profile.avatarUrl} alt={displayName} />
                ) : null}
                <AvatarFallback
                  className="text-2xl font-bold"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.58 0.18 220), oklch(0.70 0.20 138))",
                    color: "white",
                  }}
                >
                  {profile?.name ? initials : <User className="w-10 h-10" />}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="text-xl font-bold text-foreground">
                  {displayName}
                </h3>
              </div>
            </div>

            <Separator />

            {/* Bio */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Giới thiệu
              </p>
              {profile?.bio ? (
                <p className="text-sm text-foreground leading-relaxed">
                  {profile.bio}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Chưa có giới thiệu
                </p>
              )}
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Kỹ năng
              </p>
              {profile?.skills && profile.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill: string) => (
                    <Badge
                      key={skill}
                      className="text-white border-0 text-xs font-medium"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.58 0.18 220), oklch(0.70 0.20 138))",
                      }}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Chưa có kỹ năng
                </p>
              )}
            </div>

            <Separator />

            <Button
              data-ocid="profile.edit_button"
              onClick={startEdit}
              variant="outline"
              className="w-full rounded-full font-semibold"
            >
              <Pencil className="w-4 h-4 mr-2" /> Chỉnh sửa
            </Button>
          </motion.div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ---- NOTIFICATION BELL ----
function NotificationBell({
  notifications,
  unreadCount,
  markAllRead,
  clearAll,
  onNotificationClick,
}: {
  notifications: Notification[];
  unreadCount: number;
  markAllRead: () => void;
  clearAll: () => void;
  onNotificationClick: (n: Notification) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  function formatTime(ts: number) {
    const diff = Date.now() - ts;
    if (diff < 60000) return "Vừa xong";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
    return new Date(ts).toLocaleDateString("vi-VN");
  }

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((v) => !v)}
        data-ocid="header.notification_button"
        className="rounded-full cursor-pointer transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] relative"
        aria-label="Thông báo"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1"
            data-ocid="header.notification_badge"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>
      <AnimatePresence>
        {open && (
          <motion.div
            data-ocid="header.notification_panel"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-full mt-2 z-50 min-w-72 w-80 rounded-xl border border-border bg-popover shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="font-semibold text-sm">Thông báo</span>
              <div className="flex gap-2">
                {notifications.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={markAllRead}
                      data-ocid="header.notification_mark_read"
                      className="text-xs text-blue-500 hover:underline cursor-pointer"
                    >
                      Đánh dấu đã đọc
                    </button>
                    <button
                      type="button"
                      onClick={clearAll}
                      data-ocid="header.notification_clear"
                      className="text-xs text-muted-foreground hover:underline cursor-pointer"
                    >
                      Xóa tất cả
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-border">
              {notifications.length === 0 ? (
                <div
                  data-ocid="header.notification_empty_state"
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  Chưa có thông báo nào
                </div>
              ) : (
                notifications.map((n, i) => (
                  <button
                    type="button"
                    key={n.id}
                    data-ocid={`header.notification.item.${i + 1}`}
                    onClick={() => { onNotificationClick(n); setOpen(false); }}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-muted/50 cursor-pointer ${
                      n.read
                        ? "bg-transparent"
                        : "bg-blue-50/60 dark:bg-blue-950/20 border-l-2 border-l-blue-400"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {n.title}
                        </p>
                        <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">
                          {n.body}
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5 shrink-0">
                        {formatTime(n.createdAt)}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---- HEADER ----

function Header({
  onCreateClick,
  onProfileClick,
  onChatClick,
  onRankingClick,
  onHotNewsClick,
  isDark,
  toggleDark,
  notifications,
  unreadCount,
  markAllRead,
  clearAll,
  onNotificationClick,
  isLoggedIn,
  displayName,
  onLoginClick,
  onLogout,
}: {
  onCreateClick: () => void;
  onProfileClick: () => void;
  onChatClick: () => void;
  onRankingClick: () => void;
  onHotNewsClick: () => void;
  isDark: boolean;
  toggleDark: () => void;
  notifications: Notification[];
  unreadCount: number;
  markAllRead: () => void;
  clearAll: () => void;
  onNotificationClick: (n: Notification) => void;
  isLoggedIn: boolean;
  displayName: string;
  onLoginClick: () => void;
  onLogout: () => void;
}) {

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-background border-b border-border shadow-xs transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img
              src="/assets/logo-matchup.png"
              alt="MatchUp"
              className="h-14 w-auto object-contain brightness-110 drop-shadow-[0_0_8px_rgba(99,179,237,0.3)]"
            />
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#matches"
              data-ocid="nav.link"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Tìm trận
            </a>
            <button
              type="button"
              onClick={onCreateClick}
              data-ocid="nav.create_link"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-full cursor-pointer"
            >
              Tạo trận
            </button>
            <button
              type="button"
              onClick={onChatClick}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-full cursor-pointer"
            >
              Tin nhắn
            </button>
            <button
              type="button"
              onClick={onRankingClick}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-full cursor-pointer"
            >
              Xếp hạng
            </button>
            <button
              type="button"
              onClick={onHotNewsClick}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-full cursor-pointer"
            >
              Hot News
            </button>
          </nav>

          {/* Auth + Connection + Dark Toggle */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-3">
              <ConnectionStatus />
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDark}
                data-ocid="header.theme_toggle"
                className="rounded-full cursor-pointer transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                aria-label="Toggle dark mode"
              >
                {isDark ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </Button>
              <NotificationBell
                notifications={notifications}
                unreadCount={unreadCount}
                markAllRead={markAllRead}
                clearAll={clearAll}
                onNotificationClick={onNotificationClick}
              />
              {isLoggedIn ? (
                <>
                  <span className="hidden sm:block text-xs text-muted-foreground truncate max-w-[100px] font-medium">
                    {displayName}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onProfileClick}
                    data-ocid="header.profile_button"
                    className="h-9 rounded-full cursor-pointer transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                  >
                    <User className="w-4 h-4 mr-1" /> Hồ sơ
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onLogout}
                    data-ocid="header.logout_button"
                    className="h-9 rounded-full cursor-pointer transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                  >
                    <LogOut className="w-4 h-4 mr-1" /> Đăng xuất
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={onLoginClick}
                  data-ocid="header.login_button"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.58 0.18 220), oklch(0.70 0.20 138))",
                  }}
                  className="text-white border-0 hover:opacity-90 h-9 rounded-full cursor-pointer transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                >
                  <LogIn className="w-4 h-4 mr-1" />
                  Đăng nhập
                </Button>
              )}
             </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// ---- HERO ----

const SPORT_DESCRIPTIONS: Record<string, string> = {
  Soccer:
    "Môn thể thao vua với 11 người mỗi đội, kết hợp kỹ thuật cá nhân và teamwork.",
  Basketball: "Môn bóng rổ nhanh, cần phối hợp đồng đội và kỹ năng ném bóng.",
  Tennis:
    "Môn thể thao đối kháng cá nhân hoặc đôi, đòi hỏi sức bền và kỹ thuật.",
  Volleyball:
    "Môn bóng chuyền cần teamwork và phản xạ tốt, phổ biến trong sinh viên.",
  Badminton: "Cầu lông nhẹ nhàng nhưng đầy tốc độ, phù hợp mọi lứa tuổi.",
  Swimming: "Bơi lội rèn luyện toàn thân, an toàn và hiệu quả cho sức khỏe.",
  Running: "Chạy bộ đơn giản nhưng hiệu quả cao, nâng cao sức bền và tim mạch.",
  Cycling: "Đạp xe kết hợp thể thao và khám phá, thân thiện với môi trường.",
  "Table Tennis":
    "Bóng bàn đòi hỏi phản xạ siêu nhanh và chiến thuật thông minh.",
  Futsal: "Futsal sân nhỏ, nhịp độ cao, kỹ thuật tinh tế và cần phối hợp tốt.",
};

const SPORT_VIDEOS: Record<string, string> = {
  Soccer: "https://youtu.be/a275Gh7yfK8",
  Basketball: "https://youtu.be/SJIe0oJpC1w",
  Tennis: "https://youtu.be/IoXZ9pilAZg",
  Volleyball: "https://youtu.be/hmFQqjMF_f0",
  Badminton: "https://www.youtube.com/watch?v=TbQdDdFhTxM",
  Swimming: "https://youtu.be/KMliGnl7uVo",
  Running: "https://youtu.be/0J42_MuTxoU",
  Cycling: "https://youtu.be/ZAXXJdTkWkY",
  "Table Tennis": "https://youtu.be/Dt0gbMIugVw",
  Futsal: "https://youtu.be/gvUO7mQskzs",
};

function SportDetailModal({
  sport,
  onClose,
  onCreateMatch,
}: {
  sport: string | null;
  onClose: () => void;
  onCreateMatch: (sport: string) => void;
}) {
  const cfg = sport ? getSportConfig(sport) : null;
  const description = sport ? (SPORT_DESCRIPTIONS[sport] ?? "") : "";
  const videoUrl = sport ? (SPORT_VIDEOS[sport] ?? "") : "";

  return (
    <Dialog
      open={!!sport}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto p-0"
        data-ocid="sport_detail.modal"
      >
        {sport && cfg && (
          <>
            <DialogHeader className="px-6 pt-6 pb-2">
              <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                <span className="text-4xl">{cfg.emoji}</span>
                <span style={{ color: cfg.color }}>{sport}</span>
              </DialogTitle>
              <p className="text-muted-foreground text-sm mt-1">
                {description}
              </p>
            </DialogHeader>

            <div className="px-6 pb-4 space-y-5">
              {/* Images grid */}
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((lock) => (
                  <div
                    key={lock}
                    className="rounded-xl overflow-hidden aspect-square bg-muted"
                  >
                    <img
                      src={`https://loremflickr.com/400/400/${cfg.flickrTag}?lock=${lock}`}
                      alt={`${sport} ${lock}`}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>

              {/* YouTube video link */}
              {videoUrl && (
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onClose()}
                  className="flex items-center gap-3 w-full rounded-xl bg-red-600 hover:bg-red-700 text-white px-5 py-3.5 font-semibold transition-colors"
                >
                  <svg
                    className="w-6 h-6 shrink-0"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                  Xem video trên YouTube
                </a>
              )}

              {/* CTA */}
              <Button
                data-ocid="sport_detail.primary_button"
                className="w-full h-12 text-base font-semibold text-white rounded-xl border-0"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.58 0.18 220), oklch(0.70 0.20 138))",
                }}
                onClick={() => {
                  onCreateMatch(sport);
                  onClose();
                }}
              >
                🏅 Tạo trận ngay
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

const DISTRICTS = [
  "Quận 1", "Quận 2", "Quận 3", "Quận 4", "Quận 5",
  "Quận 6", "Quận 7", "Quận 8", "Quận 9", "Quận 10",
  "Quận 11", "Quận 12", "Bình Thạnh", "Bình Tân", "Gò Vấp",
  "Phú Nhuận", "Tân Bình", "Tân Phú", "Thủ Đức",
  "Bình Chánh", "Cần Giờ", "Củ Chi", "Hóc Môn", "Nhà Bè",
];

function HeroSection({
  onSearch,
  onCreateMatch,
  filterTime,
  filterSlots,
  onFilterTime,
  onFilterSlots,
  filterLocation,
  onFilterLocation,
}: {
  onSearch: (sport: string, location: string) => void;
  onCreateMatch: (sport: string) => void;
  filterTime: string;
  filterSlots: boolean;
  onFilterTime: (v: string) => void;
  onFilterSlots: (v: boolean) => void;
  filterLocation: string;
  onFilterLocation: (v: string) => void;
}) {
  const [sport, setSport] = useState("all");
  const [selectedSport, setSelectedSport] = useState<string | null>(null);

  function handleSearch() {
    onSearch(sport === "all" ? "" : sport, "");
    document.getElementById("matches")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section className="hero-gradient relative">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)",
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">
              <Zap className="w-3 h-3 mr-1" /> Live Matchmaking
            </Badge>
            <h1 className="font-display text-6xl lg:text-8xl font-extrabold text-white leading-tight mb-4">
              Kết nối đam mê -{" "}
              <span className="text-yellow-300">Tạo nên trận đấu</span>
            </h1>
            <p className="text-base text-white/80 mb-8 max-w-lg">
              Kết nối với các bạn sinh viên yêu thể thao gần bạn. Tham gia trận
              đấu trực tiếp, lấp chỗ trống và thi đấu cùng nhau.
            </p>
            <div className="flex gap-8">
              {[
                { label: "Trận đang mở", value: "120+" },
                { label: "Môn thể thao", value: "10+" },
                { label: "Sinh viên", value: "2K+" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-bold text-white">{s.value}</div>
                  <div className="text-xs text-white/70">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="hidden lg:flex justify-end"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(SPORT_CONFIG).map(([name, cfg]) => (
                <button
                  key={name}
                  type="button"
                  data-ocid="hero.sport_card"
                  onClick={() => setSelectedSport(name)}
                  className="w-28 h-28 rounded-2xl flex flex-col items-center justify-center bg-white/20 backdrop-blur-md border border-white/25 shadow-xl transition-all duration-300 hover:scale-[1.08] hover:bg-white/28 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <span className="text-3xl">{cfg.emoji}</span>
                  <span className="text-xs text-white/80 mt-1 font-medium">
                    {name}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        <SportDetailModal
          sport={selectedSport}
          onClose={() => setSelectedSport(null)}
          onCreateMatch={onCreateMatch}
        />

        {/* Search panel */}
        <motion.div
          className="mt-10 bg-black/40 backdrop-blur-xl rounded-2xl p-6 shadow-2xl max-w-2xl border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <p className="text-white/60 text-sm font-semibold uppercase tracking-wider mb-4">
            Tìm trận đấu
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={sport} onValueChange={setSport}>
              <SelectTrigger
                data-ocid="hero.select"
                className="bg-white/10 border-white/20 text-white flex-1 min-h-[48px]"
              >
                <SelectValue placeholder="Chọn môn thể thao..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả môn</SelectItem>
                {SPORTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {getSportConfig(s).emoji} {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filterLocation || "all"}
              onValueChange={(v) => {
                const val = v === "all" ? "" : v;
                onFilterLocation(val);
                document.getElementById("matches")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <SelectTrigger className="bg-white/10 border-white/20 text-white flex-1 min-h-[48px]">
                <SelectValue placeholder="Chọn quận/huyện..." />
              </SelectTrigger>
              <SelectContent
                position="popper"
                sideOffset={8}
                className="z-[9999] max-h-60 overflow-y-auto"
              >
                <SelectItem value="all">📍 Tất cả khu vực</SelectItem>
                {DISTRICTS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              data-ocid="hero.find_button"
              onClick={handleSearch}
              className="text-white font-semibold px-6 shrink-0 border-0 min-h-[48px] rounded-full cursor-pointer transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.72 0.2 47), oklch(0.82 0.2 80))",
              }}
            >
              <Search className="w-4 h-4 mr-2" /> Tìm ngay
            </Button>
          </div>

          {/* Time + slots filters */}
          <div className="flex flex-wrap gap-2 mt-4 items-center">
            {[
              { value: "all", label: "⏰ Tất cả" },
              { value: "today", label: "📅 Hôm nay" },
              { value: "weekend", label: "🎉 Cuối tuần" },
              { value: "week", label: "📆 Tuần này" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onFilterTime(opt.value);
                  document.getElementById("matches")?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
                  filterTime === opt.value
                    ? "bg-white text-black"
                    : "bg-white/15 text-white/80 hover:bg-white/25"
                }`}
              >
                {opt.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                onFilterSlots(!filterSlots);
                document.getElementById("matches")?.scrollIntoView({ behavior: "smooth" });
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
                filterSlots
                  ? "bg-green-400 text-black"
                  : "bg-white/15 text-white/80 hover:bg-white/25"
              }`}
            >
              ✅ Còn chỗ
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ---- QR CHECK-IN COMPONENTS ----

function QrCheckInDisplay({
  matchId,
  onClose,
}: { matchId: string; onClose: () => void }) {
  const qrValue = `matchup-checkin:${matchId}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrValue)}&size=280x280&margin=12&format=png`;
  const [loaded, setLoaded] = useState(false);

  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-sm" data-ocid="checkin.qr_dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <QrCode className="w-5 h-5 text-primary" />
            Mã QR Check-in
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="relative rounded-2xl overflow-hidden border-2 border-primary/30 bg-white p-2 shadow-md">
            {!loaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-white">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            )}
            <img
              src={qrUrl}
              alt="QR Check-in"
              width={280}
              height={280}
              className={`w-[280px] h-[280px] object-contain transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
              onLoad={() => setLoaded(true)}
            />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Cho người chơi quét mã này
            </p>
            <p className="text-xs text-muted-foreground font-mono bg-muted px-3 py-1 rounded-lg">
              ID: {matchId.slice(0, 12)}…
            </p>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Người tham gia bấm “Check-in tại sân” và quét mã để xác nhận có mặt
          </p>
        </div>
        <Button
          data-ocid="checkin.qr_close_button"
          variant="outline"
          onClick={onClose}
          className="w-full rounded-full"
        >
          Đóng
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function QrCheckInScanner({
  onScan,
  onClose,
}: { onScan: (value: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const hasBarcodeDetector =
    typeof window !== "undefined" && "BarcodeDetector" in window;

  // biome-ignore lint/correctness/useExhaustiveDependencies: hasBarcodeDetector is static
  useEffect(() => {
    let active = true;
    async function startCamera() {
      setError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (!active) {
          for (const t of stream.getTracks()) t.stop();
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setScanning(true);
        }
      } catch {
        setError("Không thể truy cập camera. Vui lòng cấp quyền camera.");
      }
    }
    if (hasBarcodeDetector) startCamera();
    return () => {
      active = false;
      if (streamRef.current) {
        for (const t of streamRef.current.getTracks()) t.stop();
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: onScan is stable per call
  useEffect(() => {
    if (!scanning || !hasBarcodeDetector) return;
    type BarcodeDetectorType = {
      detect(src: HTMLVideoElement): Promise<Array<{ rawValue: string }>>;
    };
    const BarcodeDetectorCtor = (
      window as unknown as {
        BarcodeDetector: new (opts: {
          formats: string[];
        }) => BarcodeDetectorType;
      }
    ).BarcodeDetector;
    const detector: BarcodeDetectorType = new BarcodeDetectorCtor({
      formats: ["qr_code"],
    });
    let stopped = false;
    async function scanFrame() {
      if (stopped) return;
      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(scanFrame);
        return;
      }
      try {
        const barcodes = await detector.detect(video);
        if (barcodes.length > 0) {
          stopped = true;
          onScan(barcodes[0].rawValue);
          return;
        }
      } catch {
        /* ignore */
      }
      rafRef.current = requestAnimationFrame(scanFrame);
    }
    rafRef.current = requestAnimationFrame(scanFrame);
    return () => {
      stopped = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [scanning, hasBarcodeDetector]);

  function handleManualSubmit() {
    if (manualCode.trim()) onScan(manualCode.trim());
  }

  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-sm" data-ocid="checkin.scanner_dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ScanLine className="w-5 h-5 text-primary" />
            Quét mã QR Check-in
          </DialogTitle>
        </DialogHeader>
        {hasBarcodeDetector ? (
          <div className="flex flex-col items-center gap-4">
            {error ? (
              <div className="w-full rounded-xl bg-destructive/10 border border-destructive/30 p-4 text-center">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            ) : (
              <div
                className="relative rounded-2xl overflow-hidden border-2 border-primary/30 bg-black w-full"
                style={{ aspectRatio: "1" }}
              >
                <video
                  ref={videoRef}
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-white/70 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
                </div>
                {scanning && (
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                    <span className="bg-black/60 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" /> Đang quét...
                    </span>
                  </div>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground text-center">
              Hướng camera vào mã QR do chủ sân hiển thị
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-3 text-center">
              <p className="text-xs text-yellow-700 dark:text-yellow-400 font-medium">
                Trình duyệt chưa hỗ trợ quét QR tự động. Nhập mã thủ công:
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                data-ocid="checkin.manual_input"
                placeholder="Dán mã QR vào đây..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleManualSubmit();
                }}
                className="flex-1"
              />
              <Button
                type="button"
                data-ocid="checkin.manual_submit_button"
                onClick={handleManualSubmit}
                disabled={!manualCode.trim()}
                className="shrink-0"
              >
                Xác nhận
              </Button>
            </div>
          </div>
        )}
        <Button
          data-ocid="checkin.scanner_close_button"
          variant="outline"
          onClick={onClose}
          className="w-full rounded-full"
        >
          Đóng
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// ---- MATCH DETAIL MODAL ----
function MatchDetailModal({
  match,
  open,
  onClose,
  isLoggedIn,
  currentPrincipal,
  profiles,
}: {
  match: Match | null;
  open: boolean;
  onClose: () => void;
  isLoggedIn?: boolean;
  currentPrincipal?: string;
  profiles?: ProfileEntry[];
}) {
  const joinMutation = useJoinMatch();
  const leaveMutation = useLeaveMatch();
  const deleteMutation = useDeleteMatch();
  const ratePlayerMutation = useRatePlayer();
  const checkInMutation = useCheckIn();
  const { data: isParticipant = false } = useIsMatchParticipant(
    match?.id ?? "",
    open && !!match && (isLoggedIn ?? false),
  );
  const { data: participants = [] } = useGetMatchParticipants(match?.id ?? "");
  const { data: checkIns = [] } = useGetCheckIns(
    match?.id ?? "",
    open && !!match,
  );
  const { data: alreadyCheckedIn = false } = useHasCheckedIn(
    match?.id ?? "",
    open && !!match && (isLoggedIn ?? false),
  );

  const [showQrCode, setShowQrCode] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);

  // Rating state: {[principalStr]: {score, comment, submitted}}
  const [ratings, setRatings] = useState<
    Record<string, { score: number; comment: string; submitted: boolean }>
  >({});

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!match) return null;
  const cfg = getSportConfig(match.sport);
  const missing = Number(match.missing);
  const requirements =
    match.requirements ??
    (Array.isArray((match as { requirements?: unknown }).requirements)
      ? ((match as { requirements?: string[] }).requirements?.[0] ?? "")
      : "");

  const totalJoined = participants.length;
  const totalCapacity = missing + totalJoined;

  // Match has passed = can rate
  const matchPassed = new Date(match.time).getTime() < Date.now();

  // Is current user the creator of this match?
  const isCreator =
    !!currentPrincipal &&
    !!match.creator &&
    match.creator.toString() === currentPrincipal;

  // Resolve principal to profile name
  function resolveParticipantName(p: { toString(): string }): {
    name: string;
    avatarUrl: string;
  } {
    if (!profiles) return { name: "", avatarUrl: "" };
    const pStr = p.toString();
    const entry = profiles.find((pe) => pe.owner.toString() === pStr);
    return {
      name: entry?.profile.name ?? "",
      avatarUrl: entry?.profile.avatarUrl ?? "",
    };
  }

  async function handleJoin() {
    try {
      await joinMutation.mutateAsync(match!.id);
      toast.success("Tham gia trận thành công! 🎉");
      onClose();
    } catch {
      toast.error("Không thể tham gia trận");
    }
  }

  async function handleLeave() {
    try {
      await leaveMutation.mutateAsync(match!.id);
      toast.success("Rời trận thành công!");
      onClose();
    } catch {
      toast.error("Không thể rời trận");
    }
  }

  async function handleShare() {
    const url = `${window.location.origin}?match=${match!.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: match!.title,
          text: `Tham gia trận ${match!.sport} cùng mình! 🏃`,
          url,
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Đã sao chép link trận! 🔗");
    }
  }

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(match!.id);
      toast.success("Trận đã xóa thành công");
      setShowDeleteConfirm(false);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Không thể xóa trận: ${msg}`);
    }
  }

  async function handleCheckInScan(scannedValue: string) {
    setShowQrScanner(false);
    const prefix = "matchup-checkin:";
    if (!scannedValue.startsWith(prefix)) {
      toast.error("Mã QR không hợp lệ");
      return;
    }
    const scannedMatchId = scannedValue.slice(prefix.length);
    if (scannedMatchId !== match!.id) {
      toast.error("Mã QR không thuộc trận này");
      return;
    }
    try {
      const result = await checkInMutation.mutateAsync(scannedMatchId);
      if (result.__kind__ === "ok") {
        toast.success("Đã check-in thành công! ✅");
      } else {
        const errMsg = result.err;
        if (
          errMsg.toLowerCase().includes("already") ||
          errMsg.toLowerCase().includes("đã")
        ) {
          toast.warning("Đã check-in rồi. Bạn đã check-in trước đó rồi!");
        } else {
          toast.error(`Check-in thất bại: ${errMsg}`);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Check-in thất bại: ${msg}`);
    }
  }

  async function handleRate(ratedPrincipal: { toString(): string }) {
    const pStr = ratedPrincipal.toString();
    const rating = ratings[pStr];
    if (!rating || rating.score < 1) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await ratePlayerMutation.mutateAsync({
        ratedPrincipal: ratedPrincipal as Parameters<
          typeof ratePlayerMutation.mutateAsync
        >[0]["ratedPrincipal"],
        matchId: match!.id,
        score: rating.score,
        comment: rating.comment,
      });
      setRatings((prev) => ({
        ...prev,
        [pStr]: { ...prev[pStr], submitted: true },
      }));
      toast.success("Đã gửi đánh giá!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    }
  }

  function principalHue(p: string): number {
    return p.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  }

  function truncatePrincipal(p: string): string {
    if (p.length <= 10) return p;
    return `${p.slice(0, 5)}...${p.slice(-3)}`;
  }

  const alreadyJoined = isParticipant;
  const isFull = missing <= 0;
  const isMutating = joinMutation.isPending || leaveMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        data-ocid="match_detail.dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-bold">
            <span className="text-3xl">{cfg.emoji}</span>
            <span style={{ color: cfg.color }}>{match.sport}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Match image */}
        <div className="rounded-xl overflow-hidden aspect-video bg-muted -mx-1">
          <img
            src={`https://loremflickr.com/600/340/${cfg.flickrTag}`}
            alt={match.sport}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Title */}
        <h3 className="font-bold text-foreground text-lg leading-snug">
          {match.title}
        </h3>

        {/* Details */}
        <div className="space-y-2.5 py-1">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 shrink-0 text-primary" />
            <span>{formatDateTime(match.time)}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 shrink-0 text-primary" />
            <span>{match.location}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Users className="w-4 h-4 shrink-0 text-primary" />
            <span
              className="font-semibold"
              style={{ color: isFull ? "#22c55e" : "#f59e0b" }}
            >
              {isFull ? "Đã đủ quân" : `Còn ${missing} chỗ trống`}
            </span>
          </div>
        </div>

        {/* Requirements */}
        {requirements && (
          <div className="rounded-xl bg-primary/8 border border-primary/20 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Users className="w-4 h-4" />
              <span>Yêu cầu đồng đội</span>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {requirements}
            </p>
          </div>
        )}

        {/* Participant list with resolved profile names + check-in status */}
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Trophy className="w-4 h-4 text-primary" />
              <span>Người tham gia</span>
            </div>
            <div className="flex items-center gap-2">
              {checkIns.length > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                  {checkIns.length} ✅ check-in
                </span>
              )}
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: isFull
                    ? "oklch(0.70 0.20 138 / 0.15)"
                    : "oklch(0.58 0.18 220 / 0.12)",
                  color: isFull
                    ? "oklch(0.55 0.18 138)"
                    : "oklch(0.50 0.15 220)",
                }}
              >
                {totalJoined}/{totalCapacity} người
              </span>
            </div>
          </div>
          {totalJoined === 0 ? (
            <p
              className="text-xs text-muted-foreground text-center py-2"
              data-ocid="match_detail.participants_empty_state"
            >
              Chưa có ai tham gia. Hãy là người đầu tiên!
            </p>
          ) : (
            <div className="space-y-1.5">
              {participants.map((p, idx) => {
                const pStr = p.toString();
                const hue = principalHue(pStr);
                const { name, avatarUrl } = resolveParticipantName(p);
                const displayName = name || truncatePrincipal(pStr);
                const initials = name
                  ? name
                      .split(" ")
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase()
                  : pStr.charAt(0).toUpperCase();
                const checkedIn = (checkIns as CheckInPublic[]).some(
                  (ci) => ci.participant === pStr,
                );
                const checkInEntry = (checkIns as CheckInPublic[]).find(
                  (ci) => ci.participant === pStr,
                );
                const checkInTime = checkInEntry
                  ? new Date(
                      Number(checkInEntry.timestamp),
                    ).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : null;

                return (
                  <div
                    key={pStr}
                    data-ocid={`match_detail.participant.item.${idx + 1}`}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 border transition-colors ${
                      checkedIn
                        ? "bg-emerald-500/8 border-emerald-500/25 dark:border-emerald-500/30"
                        : "bg-background border-border"
                    }`}
                    title={pStr}
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="w-7 h-7 rounded-full object-cover shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <span
                        className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-white font-bold text-[10px]"
                        style={{ background: `oklch(0.62 0.18 ${hue})` }}
                      >
                        {initials}
                      </span>
                    )}
                    <span
                      className={`flex-1 text-xs min-w-0 truncate ${name ? "text-foreground font-medium" : "font-mono text-muted-foreground"}`}
                    >
                      {displayName}
                      {pStr === currentPrincipal && (
                        <span className="ml-1 text-[10px] text-primary font-semibold">
                          (bạn)
                        </span>
                      )}
                    </span>
                    {checkedIn ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">
                          {checkInTime ? checkInTime : "✓ Check-in"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/60 shrink-0">
                        Chưa check-in
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rating section (after match time has passed) */}
        {matchPassed && isLoggedIn && totalJoined > 0 && (
          <div className="rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>Đánh giá đồng đội</span>
            </div>
            {participants
              .filter((p) => p.toString() !== currentPrincipal)
              .map((p) => {
                const pStr = p.toString();
                const { name, avatarUrl } = resolveParticipantName(p);
                const displayName = name || truncatePrincipal(pStr);
                const rating = ratings[pStr] ?? {
                  score: 0,
                  comment: "",
                  submitted: false,
                };

                return (
                  <div
                    key={pStr}
                    className="bg-muted/30 rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={displayName}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{
                            background: `oklch(0.62 0.18 ${principalHue(pStr)})`,
                          }}
                        >
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm font-medium">{displayName}</span>
                    </div>
                    {rating.submitted ? (
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                        ✓ Bạn đã đánh giá người chơi này
                      </p>
                    ) : (
                      <>
                        {/* Star rating */}
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              data-ocid={`match_detail.rating_star.${star}`}
                              onClick={() =>
                                setRatings((prev) => ({
                                  ...prev,
                                  [pStr]: {
                                    ...(prev[pStr] ?? {
                                      comment: "",
                                      submitted: false,
                                    }),
                                    score: star,
                                  },
                                }))
                              }
                              className="text-xl transition-transform hover:scale-110"
                            >
                              <Star
                                className="w-5 h-5"
                                fill={star <= rating.score ? "#eab308" : "none"}
                                stroke={
                                  star <= rating.score
                                    ? "#eab308"
                                    : "currentColor"
                                }
                              />
                            </button>
                          ))}
                        </div>
                        <Input
                          data-ocid="match_detail.rating_comment_input"
                          placeholder="Nhận xét (tùy chọn)..."
                          value={rating.comment}
                          onChange={(e) =>
                            setRatings((prev) => ({
                              ...prev,
                              [pStr]: {
                                ...(prev[pStr] ?? {
                                  score: 0,
                                  submitted: false,
                                }),
                                comment: e.target.value,
                              },
                            }))
                          }
                          className="text-xs h-8"
                        />
                        <Button
                          data-ocid="match_detail.rating_submit_button"
                          size="sm"
                          disabled={
                            !rating.score || ratePlayerMutation.isPending
                          }
                          onClick={() => handleRate(p)}
                          className="h-7 text-xs text-white border-0"
                          style={{
                            background:
                              "linear-gradient(135deg, oklch(0.58 0.18 220), oklch(0.70 0.20 138))",
                          }}
                        >
                          {ratePlayerMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            "Gửi đánh giá"
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1 flex-wrap">
          {alreadyJoined ? (
            <Button
              data-ocid="match_detail.leave_button"
              onClick={handleLeave}
              disabled={isMutating}
              variant="outline"
              className="flex-1 h-11 font-semibold rounded-full border-red-400/50 text-red-500 dark:text-red-400 hover:bg-red-500/10 cursor-pointer"
            >
              {leaveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang rời...
                </>
              ) : (
                "Rời trận"
              )}
            </Button>
          ) : (
            <Button
              data-ocid="match_detail.join_button"
              onClick={handleJoin}
              disabled={isMutating || isFull}
              className="flex-1 h-11 text-white border-0 font-semibold rounded-full cursor-pointer"
              style={{
                background: !isFull
                  ? "linear-gradient(135deg, oklch(0.58 0.18 220), oklch(0.70 0.20 138))"
                  : "rgba(0,0,0,0.08)",
                color: isFull ? "var(--muted-foreground)" : undefined,
              }}
            >
              {joinMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang tham
                  gia...
                </>
              ) : isFull ? (
                "Đã đủ quân"
              ) : (
                "Tham gia trận này"
              )}
            </Button>
          )}

          {/* Share button */}
          <Button
            variant="outline"
            onClick={handleShare}
            className="h-11 px-4 rounded-full border-primary/40 text-primary hover:bg-primary/10"
            title="Chia sẻ trận"
          >
            <Share2 className="w-4 h-4 mr-1.5" /> Chia sẻ
          </Button>

          {/* QR Check-in: creator sees QR code button, participants see scanner */}
          {isLoggedIn && isCreator && (
            <Button
              data-ocid="match_detail.qr_button"
              variant="outline"
              onClick={() => setShowQrCode(true)}
              className="h-11 px-4 rounded-full border-primary/40 text-primary hover:bg-primary/10"
              title="Hiển thị mã QR Check-in"
            >
              <QrCode className="w-4 h-4 mr-1.5" /> Mã QR
            </Button>
          )}
          {isLoggedIn && !isCreator && isParticipant && (
            <Button
              data-ocid="match_detail.checkin_button"
              variant={alreadyCheckedIn ? "outline" : "default"}
              onClick={() => {
                if (!alreadyCheckedIn) setShowQrScanner(true);
              }}
              disabled={alreadyCheckedIn || checkInMutation.isPending}
              className={`h-11 px-4 rounded-full font-semibold ${
                alreadyCheckedIn
                  ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                  : "text-white border-0"
              }`}
              style={
                alreadyCheckedIn
                  ? undefined
                  : {
                      background:
                        "linear-gradient(135deg, oklch(0.55 0.20 155), oklch(0.65 0.22 165))",
                    }
              }
            >
              {checkInMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : alreadyCheckedIn ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Đã check-in
                </>
              ) : (
                <>
                  <ScanLine className="w-4 h-4 mr-1.5" /> Check-in tại sân
                </>
              )}
            </Button>
          )}

          {/* Delete button — only for creator */}
          {isCreator && !showDeleteConfirm && (
            <Button
              data-ocid="match_detail.delete_button"
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
              className="h-11 px-4 rounded-full border-red-400/50 text-red-500 dark:text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}

          <Button
            data-ocid="match_detail.close_button"
            variant="outline"
            onClick={onClose}
            className="h-11 px-5 rounded-full"
          >
            Đóng
          </Button>
        </div>

        {/* QR modals */}
        {showQrCode && (
          <QrCheckInDisplay
            matchId={match.id}
            onClose={() => setShowQrCode(false)}
          />
        )}
        {showQrScanner && (
          <QrCheckInScanner
            onScan={handleCheckInScan}
            onClose={() => setShowQrScanner(false)}
          />
        )}

        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <div className="rounded-xl border border-red-400/40 bg-red-50/50 dark:bg-red-950/20 p-4 space-y-3">
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
              Bạn có chắc muốn xóa trận này không?
            </p>
            <p className="text-xs text-muted-foreground">
              Trận hiện có {totalJoined} người tham gia. Hành động này không thể
              hoàn tác.
            </p>
            <div className="flex gap-2">
              <Button
                data-ocid="match_detail.confirm_button"
                size="sm"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="h-8 text-xs bg-red-500 hover:bg-red-600 text-white border-0"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  "Xóa trận"
                )}
              </Button>
              <Button
                data-ocid="match_detail.cancel_button"
                size="sm"
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="h-8 text-xs"
              >
                Hủy
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---- MATCH CARD (Glassmorphism) ----
function MatchCard({
  match,
  index,
  isNewest,
  isLoggedIn,
  currentPrincipal,
  profiles,
}: {
  match: Match;
  index: number;
  isNewest: boolean;
  isLoggedIn: boolean;
  currentPrincipal?: string;
  profiles?: ProfileEntry[];
}) {
  const joinMutation = useJoinMatch();
  const leaveMutation = useLeaveMatch();
  const { data: isParticipant = false } = useIsMatchParticipant(
    match.id,
    isLoggedIn,
  );
  const cfg = getSportConfig(match.sport);
  const missing = Number(match.missing);
  const imgSrc = `https://loremflickr.com/400/300/${cfg.flickrTag}`;
  const [detailOpen, setDetailOpen] = useState(false);

  // Handle both string and Motoko optional array format
  const requirements =
    typeof match.requirements === "string"
      ? match.requirements
      : Array.isArray(match.requirements)
        ? ((match.requirements as string[])[0] ?? "")
        : "";

  async function handleJoin(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await joinMutation.mutateAsync(match.id);
      toast.success("Tham gia trận thành công! 🎉");
    } catch {
      toast.error("Không thể tham gia trận");
    }
  }

  async function handleLeave(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await leaveMutation.mutateAsync(match.id);
      toast.success("Đã rời trận");
    } catch {
      toast.error("Không thể rời trận");
    }
  }

  const alreadyJoined = isParticipant;
  const isFull = missing <= 0;
  const isMutating = joinMutation.isPending || leaveMutation.isPending;

  return (
    <>
      <motion.div
        data-ocid={`matches.item.${index + 1}`}
        className="group match-card-img relative rounded-3xl overflow-hidden cursor-pointer"
        style={{ minHeight: "280px" }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay: index * 0.07,
          type: "spring",
          stiffness: 300,
          damping: 25,
        }}
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setDetailOpen(true)}
      >
        {/* Background image */}
        <img
          src={imgSrc}
          alt={match.sport}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
          loading="lazy"
        />

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

        {/* NEW badge */}
        {isNewest && (
          <div className="absolute top-3 left-3 z-10">
            <Badge className="bg-red-500 text-white border-0 text-xs font-bold px-2 py-0.5 animate-pulse">
              🔥 MỚI
            </Badge>
          </div>
        )}

        {/* Requirements indicator */}
        {requirements && (
          <div
            className="absolute top-3 left-3 z-10"
            style={{ top: isNewest ? "2rem" : undefined }}
          >
            <Badge
              className="bg-blue-500/80 text-white border-0 text-xs font-medium backdrop-blur-sm"
              style={{ marginTop: isNewest ? "1.75rem" : undefined }}
            >
              📋 Có yêu cầu
            </Badge>
          </div>
        )}

        {/* Sport badge top-right */}
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs font-semibold">
            {cfg.emoji} {match.sport}
          </Badge>
        </div>

        {/* Card content overlaid on image — solid dark bg for contrast */}
        <div
          className="absolute inset-x-0 bottom-0 rounded-b-3xl"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.75) 60%, transparent 100%)",
            borderTop: `2px solid ${cfg.color}`,
            padding: "1.25rem 1.5rem 1.25rem",
          }}
        >
          <h3 className="font-bold text-white text-base mb-2 line-clamp-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            {match.title}
          </h3>

          <div className="space-y-1 mb-3">
            <div className="flex items-center gap-2 text-xs">
              <Clock className="w-3.5 h-3.5 shrink-0 text-white" />
              <span className="truncate text-white font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                {formatDateTime(match.time)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-white" />
              <span className="truncate text-white font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                {match.location}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Users className="w-3.5 h-3.5 shrink-0 text-white" />
              <span
                className="font-bold drop-shadow-[0_1px_3px_rgba(0,0,0,1)]"
                style={{
                  color: isFull ? "#86efac" : "#fde68a",
                }}
              >
                {isFull ? "Đã đủ quân" : `${missing} chỗ trống`}
              </span>
            </div>
          </div>

          {/* Requirements preview on card */}
          {requirements && (
            <div className="mb-3 bg-black/50 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 flex items-start gap-2">
              <Users className="w-3.5 h-3.5 shrink-0 text-blue-300 mt-0.5" />
              <p className="text-xs text-white line-clamp-2 leading-relaxed flex-1">
                {requirements}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            {alreadyJoined ? (
              <Button
                data-ocid={`matches.leave_button.${index + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleLeave(e);
                }}
                disabled={isMutating}
                size="sm"
                className="flex-1 h-10 rounded-full font-semibold border border-red-400/50 text-red-300 bg-red-500/20 hover:bg-red-500/30 cursor-pointer"
              >
                {leaveMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  "Rời trận"
                )}
              </Button>
            ) : (
              <Button
                data-ocid={`matches.join_button.${index + 1}`}
                onClick={handleJoin}
                disabled={isMutating || isFull}
                size="sm"
                className="flex-1 text-white border-0 font-semibold h-10 rounded-full cursor-pointer transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                style={{
                  background: !isFull
                    ? "linear-gradient(135deg, oklch(0.58 0.18 220), oklch(0.70 0.20 138))"
                    : "rgba(255,255,255,0.15)",
                }}
              >
                {joinMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Đang
                    tham gia...
                  </>
                ) : isFull ? (
                  "Đã đủ quân"
                ) : (
                  "Tham gia ngay"
                )}
              </Button>
            )}
            {requirements && (
              <Button
                data-ocid={`matches.detail_button.${index + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setDetailOpen(true);
                }}
                size="sm"
                variant="ghost"
                className="h-10 px-3 text-white/80 hover:text-white hover:bg-white/15 rounded-full"
                aria-label="Xem chi tiết"
              >
                Xem
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      <MatchDetailModal
        match={match}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        isLoggedIn={isLoggedIn}
        currentPrincipal={currentPrincipal}
        profiles={profiles}
      />
    </>
  );
}

// ---- SKELETON CARD ----
function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ minHeight: "280px" }}>
      <div className="skeleton h-full w-full" style={{ minHeight: "280px" }} />
    </div>
  );
}

// ---- SPORT RANKING ----
function SportRanking({ matches }: { matches: Match[] }) {
  if (matches.length === 0) return null;

  const counts: Record<string, number> = {};
  for (const m of matches) {
    counts[m.sport] = (counts[m.sport] ?? 0) + 1;
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (!top) return null;
  const [sport, count] = top;
  const cfg = getSportConfig(sport);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-700/40 dark:text-yellow-300 rounded-full px-3 py-1.5">
      <span>⭐</span>
      <span className="font-semibold text-yellow-800 dark:text-yellow-300">
        Môn hot nhất: {cfg.emoji} {sport}
      </span>
      <span className="text-yellow-600 dark:text-yellow-400">
        ({count} trận)
      </span>
    </div>
  );
}

// ---- MATCH REASON HELPER ----
function getMatchReasons(mySkills: string[], theirSkills: string[]): string {
  const mine = mySkills.map((s) => s.trim().toLowerCase());
  const theirs = theirSkills.map((s) => s.trim().toLowerCase());
  const shared = mine.filter((s) => theirs.includes(s));
  if (shared.length === 0) return "Expand your network";
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  if (shared.length === 1) return `You both like ${capitalize(shared[0])}`;
  return `Shared: ${shared.slice(0, 2).map(capitalize).join(", ")}`;
}

// ---- MATCH PERCENT HELPER ----
function calculateMatchPercent(
  mySkills: string[],
  theirSkills: string[],
): number {
  if (mySkills.length === 0 && theirSkills.length === 0) return 50;
  const mine = mySkills.map((s) => s.trim().toLowerCase());
  const theirs = theirSkills.map((s) => s.trim().toLowerCase());
  const shared = mine.filter((s) => theirs.includes(s));
  const total = new Set([...mine, ...theirs]).size;
  if (total === 0) return 50;
  const base = Math.round((shared.length / total) * 100);
  // Scale to 30-99 range to feel realistic
  return Math.max(30, Math.min(99, base + 30));
}

// ---- TODAY'S MATCHES SECTION ----
// Shows matches CREATED today (not daily suggestions)
function TodayMatchesSection({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { data: allMatches = [], isLoading } = useGetAllMatches();
  const [showAll, setShowAll] = useState(false);

  const todayStart = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  })();
  const todayEnd = todayStart + 24 * 60 * 60 * 1000;

  const todayMatches = allMatches
    .filter((m) => {
      if (!m.createdAt) return false;
      // createdAt is milliseconds from Firestore serverTimestamp
      const ms = Number(m.createdAt);
      return ms >= todayStart && ms < todayEnd;
    })
    .sort((a, b) => {
      const ta = Number(a.createdAt ?? 0n);
      const tb = Number(b.createdAt ?? 0n);
      return tb - ta; // newest first
    });

  const displayed = showAll ? todayMatches : todayMatches.slice(0, 3);
  const todayLabel = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <section className="py-10 px-4 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <span>📅</span> Trận Hôm Nay
        </h2>
        <Badge variant="secondary" className="text-xs font-medium">
          {todayLabel}
        </Badge>
        {todayMatches.length > 0 && (
          <Badge
            className="text-white border-0 text-xs font-bold"
            style={{ background: "oklch(0.58 0.18 220)" }}
          >
            {todayMatches.length} trận
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : todayMatches.length === 0 ? (
        <div
          data-ocid="today_matches.empty_state"
          className="text-center py-10 text-muted-foreground bg-muted/30 rounded-2xl border border-border"
        >
          <div className="text-4xl mb-3">📭</div>
          <p className="font-semibold text-foreground">
            Chưa có trận nào được tạo hôm nay
          </p>
          <p className="text-sm mt-1">Hãy là người đầu tiên tạo trận!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {displayed.map((match, idx) => {
              const cfg = getSportConfig(match.sport);
              const missing = Number(match.missing);
              const isFull = missing <= 0;
              return (
                <motion.div
                  key={match.id}
                  data-ocid={`today_matches.item.${idx + 1}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.07 }}
                  className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-2 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <Badge
                      className="text-xs font-semibold border-0 text-white"
                      style={{ background: cfg.color }}
                    >
                      {cfg.emoji} {match.sport}
                    </Badge>
                    <span
                      className="text-xs font-bold"
                      style={{ color: isFull ? "#22c55e" : "#f59e0b" }}
                    >
                      {isFull ? "Đủ quân" : `${missing} chỗ`}
                    </span>
                  </div>
                  <p className="font-semibold text-sm text-foreground line-clamp-1">
                    {match.title}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>{formatDateTime(match.time)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{match.location}</span>
                  </div>
                  {isLoggedIn && (
                    <Badge
                      variant="secondary"
                      className="text-xs w-fit mt-1 bg-primary/10 text-primary border-0"
                    >
                      🆕 Mới hôm nay
                    </Badge>
                  )}
                </motion.div>
              );
            })}
          </div>
          {todayMatches.length > 3 && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                size="sm"
                data-ocid="today_matches.secondary_button"
                onClick={() => setShowAll((v) => !v)}
                className="rounded-full"
              >
                {showAll
                  ? "Thu gọn"
                  : `Xem thêm ${todayMatches.length - 3} trận`}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

// ---- FIND PLAYERS SECTION ----
function FindPlayersSection({
  callerPrincipal,
}: { callerPrincipal: string }) {
  const { data: profiles = [], isLoading } = useGetAllProfiles(true);
  const { data: myMatches = [] } = useGetMyMatches(true);
  const { data: myProfile } = useGetMyProfile(true);
  const mySkills = myProfile?.skills ?? [];
  const matchMutation = useMatchWithUser();

  const matchedSet = new Set(
    myMatches.map((m: MatchEntry) => m.matched.toString()),
  );
  const mutualSet = new Set(
    myMatches
      .filter((m: MatchEntry) => m.mutual)
      .map((m: MatchEntry) => m.matched.toString()),
  );

  const [filterSkills, setFilterSkills] = useState<string[]>([]);
  const [searchName, setSearchName] = useState("");

  const others = profiles.filter(
    (p: ProfileEntry) => p.owner.toString() !== callerPrincipal,
  );

  const allSkills: string[] = (
    [
      ...new Set(profiles.flatMap((p: ProfileEntry) => p.profile.skills)),
    ] as string[]
  ).sort();

  const filtered = others.filter((p: ProfileEntry) => {
    const matchesSkill =
      filterSkills.length === 0 ||
      p.profile.skills.some((s) => filterSkills.includes(s));
    const matchesName =
      !searchName.trim() ||
      p.profile.name.toLowerCase().includes(searchName.trim().toLowerCase());
    return matchesSkill && matchesName;
  });

  function toggleSkill(skill: string) {
    setFilterSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  }

  function getInitials(name: string) {
    return (
      name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "?"
    );
  }

  return (
    <section className="py-10 px-4 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold tracking-tight mb-6 text-foreground flex items-center gap-2">
        <span>🏃</span> Tìm Người Chơi
      </h2>

      {/* Name search input */}
      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          data-ocid="players.search_input"
          placeholder="Tìm kiếm theo tên..."
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          className="pl-9"
        />
        {searchName && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setSearchName("")}
            aria-label="Xóa tìm kiếm"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {allSkills.length > 0 && (
        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>Lọc theo kỹ năng / sở thích:</span>
          </div>
          <div className="flex flex-wrap gap-2" data-ocid="players.tab">
            {allSkills.map((skill) => (
              <Badge
                key={skill}
                variant={filterSkills.includes(skill) ? "default" : "outline"}
                className="cursor-pointer select-none hover:opacity-80 transition-opacity"
                onClick={() => toggleSkill(skill)}
                data-ocid="players.toggle"
              >
                {skill}
              </Badge>
            ))}
            <Badge
              variant="outline"
              className="cursor-not-allowed opacity-40 select-none"
              title="Goals field is not available yet"
            >
              Goals (coming soon)
            </Badge>
          </div>
          {filterSkills.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Đang lọc:</span>
              {filterSkills.map((skill) => (
                <Badge
                  key={skill}
                  variant="secondary"
                  className="flex items-center gap-1 cursor-pointer"
                  onClick={() => toggleSkill(skill)}
                >
                  {skill}
                  <X className="h-3 w-3" />
                </Badge>
              ))}
              <button
                type="button"
                className="text-xs text-primary hover:underline ml-1"
                onClick={() => setFilterSkills([])}
                data-ocid="players.secondary_button"
              >
                Xóa tất cả
              </button>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div
          data-ocid="players.loading_state"
          className="flex gap-4 overflow-x-auto pb-2"
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-56 h-48 rounded-2xl bg-muted animate-pulse"
            />
          ))}
        </div>
      ) : others.length === 0 ? (
        <div
          data-ocid="players.empty_state"
          className="text-center py-12 text-muted-foreground"
        >
          <p className="text-lg">Chưa có người chơi nào.</p>
          <p className="text-sm mt-1">Hãy tạo hồ sơ để xuất hiện ở đây!</p>
        </div>
      ) : filtered.length === 0 ? (
        <div
          data-ocid="players.empty_state"
          className="text-center py-12 text-muted-foreground"
        >
          <p className="text-lg">Không tìm thấy người chơi phù hợp.</p>
          <button
            type="button"
            className="text-sm text-primary hover:underline mt-2"
            onClick={() => {
              setFilterSkills([]);
              setSearchName("");
            }}
            data-ocid="players.secondary_button"
          >
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory">
          {filtered.map((entry: ProfileEntry, idx: number) => {
            const ownerStr = entry.owner.toString();
            const isMatched = matchedSet.has(ownerStr);
            const isMutual = mutualSet.has(ownerStr);
            const isPending =
              matchMutation.isPending &&
              matchMutation.variables?.toString() === ownerStr;

            return (
              <div
                key={ownerStr}
                data-ocid={`players.item.${idx + 1}`}
                className="flex-shrink-0 w-56 snap-start rounded-2xl border border-border bg-gradient-to-br from-card to-card/70 backdrop-blur-sm p-4 flex flex-col gap-3 card-hover-glow"
              >
                <div className="flex items-center gap-2">
                  {isMutual && (
                    <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30 text-xs">
                      🤝 Mutual
                    </Badge>
                  )}
                  {(() => {
                    const pct = calculateMatchPercent(
                      mySkills,
                      entry.profile.skills,
                    );
                    const color =
                      pct >= 70
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        : pct >= 50
                          ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30"
                          : "bg-muted text-muted-foreground";
                    return (
                      <Badge className={`ml-auto text-xs font-bold ${color}`}>
                        {pct}% match
                      </Badge>
                    );
                  })()}
                </div>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    {entry.profile.avatarUrl ? (
                      <AvatarImage
                        src={entry.profile.avatarUrl}
                        alt={entry.profile.name}
                      />
                    ) : null}
                    <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                      {getInitials(entry.profile.name || ownerStr)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {entry.profile.name || "Anonymous"}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {entry.profile.bio || "No bio yet"}
                    </p>
                  </div>
                </div>
                {entry.profile.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {entry.profile.skills.slice(0, 3).map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="text-xs px-2 py-0"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
                {(() => {
                  const reason = getMatchReasons(
                    mySkills,
                    entry.profile.skills,
                  );
                  const isShared =
                    reason.startsWith("You both like") ||
                    reason.startsWith("Shared:");
                  return (
                    <p
                      className={`text-xs font-medium flex items-center gap-1 ${isShared ? "bg-primary/10 text-primary rounded-md px-2 py-0.5" : "text-muted-foreground"}`}
                    >
                      <span>💡</span> {reason}
                    </p>
                  );
                })()}
                <Button
                  data-ocid={`players.button.${idx + 1}`}
                  size="sm"
                  variant={isMatched ? "outline" : "default"}
                  disabled={isMatched || isPending}
                  className={
                    isMatched
                      ? "text-green-600 dark:text-green-400 border-green-500/40"
                      : ""
                  }
                  onClick={() => matchMutation.mutate(entry.owner)}
                >
                  {isPending
                    ? "Matching…"
                    : isMatched
                      ? "✓ Matched!"
                      : "Match ✓"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ---- LIVE MATCHES SECTION ----
function LiveMatchesSection({
  filterSport,
  filterLocation,
  filterTime,
  filterSlots,
  isLoggedIn,
  currentPrincipal,
  profiles,
}: {
  filterSport: string;
  filterLocation: string;
  filterTime: string;
  filterSlots: boolean;
  isLoggedIn: boolean;
  currentPrincipal?: string;
  profiles?: ProfileEntry[];
}) {
  const { data: matches, isLoading } = useGetAllMatches();
  const deleteExpiredMutation = useDeleteExpiredMatches();

  // biome-ignore lint/correctness/useExhaustiveDependencies: mutate is stable
  useEffect(() => {
    if (!matches || matches.length === 0) return;
    const now = new Date();
    const expiredIds = matches
      .filter((m) => new Date(m.time) < now)
      .map((m) => m.id);
    if (expiredIds.length > 0) {
      deleteExpiredMutation.mutate(expiredIds);
    }
  }, [matches]);

  const now = new Date();
  const filtered = (matches ?? [])
    .filter((m) => {
      const matchTime = new Date(m.time);
      const notExpired = matchTime >= now;
      const matchSport =
        !filterSport || m.sport.toLowerCase() === filterSport.toLowerCase();
      const matchLoc =
        !filterLocation ||
        m.location.toLowerCase().includes(filterLocation.toLowerCase());

      // Time filter
      let matchTimeFilter = true;
      if (filterTime === "today") {
        const start = new Date(); start.setHours(0,0,0,0);
        const end = new Date(); end.setHours(23,59,59,999);
        matchTimeFilter = matchTime >= start && matchTime <= end;
      } else if (filterTime === "weekend") {
        const day = matchTime.getDay();
        matchTimeFilter = day === 0 || day === 6;
      } else if (filterTime === "week") {
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() + 7);
        matchTimeFilter = matchTime <= weekEnd;
      }

      // Slots filter
      const hasSlots = !filterSlots || Number(m.missing) > 0;

      return notExpired && matchSport && matchLoc && matchTimeFilter && hasSlots;
    })
    .sort((a, b) => {
      const ta = new Date(a.time).getTime();
      const tb = new Date(b.time).getTime();
      return ta - tb;
    });

  const newestId =
    filtered.length > 0
      ? filtered.reduce((prev, curr) =>
          (curr.createdAt ?? 0n) > (prev.createdAt ?? 0n) ? curr : prev,
        ).id
      : null;

  return (
    <section
      id="matches"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20"
    >
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="font-display text-3xl font-extrabold uppercase tracking-widest text-foreground">
              Trận Đang Mở
            </h2>
            {!isLoading && (
              <Badge
                className="text-white border-0 font-bold text-sm"
                style={{ background: "oklch(0.58 0.18 220)" }}
              >
                📊 {filtered.length} trận
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Zap className="w-3 h-3" /> Cập nhật tự động
          </div>
        </div>
        {!isLoading && <SportRanking matches={filtered} />}
      </div>

      {isLoading ? (
        <div
          data-ocid="matches.loading_state"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {Array.from({ length: 8 }, (_, i) => i).map((i) => (
            <SkeletonCard key={`skeleton-${i}`} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div data-ocid="matches.empty_state" className="text-center py-20">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            Chưa có trận nào
          </h3>
          <p className="text-muted-foreground mb-6">
            Hãy là người đầu tiên tạo trận trong khu vực của bạn!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatePresence>
            {filtered.map((match, i) => (
              <MatchCard
                key={match.id}
                match={match}
                index={i}
                isNewest={match.id === newestId}
                isLoggedIn={isLoggedIn}
                currentPrincipal={currentPrincipal}
                profiles={profiles}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}

// ---- CREATE MATCH SECTION ----
function LocationVenuePicker({
  value,
  onChange,
  sport,
  error,
}: {
  value: string;
  onChange: (val: string) => void;
  sport: string;
  error?: string;
}) {
  const [userDistrict, setUserDistrict] = useState<string | null>(null);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [showVenueList, setShowVenueList] = useState(true);
  const [showMore, setShowMore] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Haversine distance in km
  function haversineKm(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // Filter venues based on sport; sort by GPS distance if available, otherwise keep original order
  const filteredVenues = (() => {
    let venues = [...VENUES];
    if (sport && sport !== "none") {
      venues = venues.filter((v) => v.sports.includes(sport));
    }
    if (userLat !== null && userLng !== null) {
      venues = venues
        .map((v) => ({
          venue: v,
          dist: haversineKm(userLat!, userLng!, v.lat, v.lng),
        }))
        .sort((a, b) => a.dist - b.dist)
        .map((x) => x.venue);
    } else if (userDistrict) {
      const inDistrict = venues.filter((v) => v.district === userDistrict);
      const others = venues.filter((v) => v.district !== userDistrict);
      venues = [...inDistrict, ...others];
    }
    return venues;
  })();

  const visibleVenues = showMore ? filteredVenues : filteredVenues.slice(0, 6);

  async function detectLocation() {
    if (!navigator.geolocation) {
      setGpsError("Thiết bị không hỗ trợ GPS");
      return;
    }
    setIsDetectingLocation(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLat(latitude);
        setUserLng(longitude);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=vi`,
          );
          const data = (await res.json()) as {
            address?: {
              suburb?: string;
              city_district?: string;
              quarter?: string;
              county?: string;
            };
          };
          const district =
            data.address?.suburb ||
            data.address?.city_district ||
            data.address?.quarter ||
            data.address?.county ||
            null;
          setUserDistrict(district);
        } catch {
          setUserDistrict(null);
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (err) => {
        setIsDetectingLocation(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError("Bạn đã từ chối quyền truy cập vị trí");
        } else {
          setGpsError("Không thể lấy vị trí. Thử lại sau.");
        }
      },
      { timeout: 10000 },
    );
  }

  function selectVenue(venue: Venue) {
    setSelectedVenue(venue);
    onChange(`${venue.name}, ${venue.address}`);
    setShowVenueList(false);
  }

  function handleManualInput(val: string) {
    onChange(val);
    if (val !== `${selectedVenue?.name}, ${selectedVenue?.address}`) {
      setSelectedVenue(null);
    }
  }

  const mapLat = selectedVenue?.lat ?? userLat;
  const mapLng = selectedVenue?.lng ?? userLng;

  return (
    <div className="space-y-3">
      {/* GPS button row */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-ocid="create.location_gps_button"
          onClick={detectLocation}
          disabled={isDetectingLocation}
          className="h-8 text-xs font-medium rounded-full border-border gap-1.5"
        >
          {isDetectingLocation ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <MapPin className="w-3 h-3" />
          )}
          {isDetectingLocation ? "Đang xác định..." : "📍 Dùng vị trí của tôi"}
        </Button>
        {userDistrict && (
          <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 rounded-full px-2.5 py-1 font-medium">
            📍 Đang ở: {userDistrict}
          </span>
        )}
        {gpsError && (
          <span className="text-xs text-destructive">{gpsError}</span>
        )}
      </div>

      {/* Venue suggestions */}
      {showVenueList && filteredVenues.length > 0 && (
        <div
          ref={dropdownRef}
          className="rounded-xl border border-border bg-card shadow-sm overflow-hidden"
          data-ocid="create.venue_list"
        >
          <div className="px-3 py-2 border-b border-border bg-muted/40 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {sport && sport !== "none"
                ? `Sân ${sport} gợi ý`
                : "Sân thể thao gợi ý"}
              {userLat !== null
                ? " — gần nhất trước"
                : userDistrict
                  ? ` — ưu tiên ${userDistrict}`
                  : ""}
            </span>
            <button
              type="button"
              onClick={() => setShowVenueList(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Đóng danh sách sân"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-border max-h-56 overflow-y-auto">
            {visibleVenues.map((venue) => (
              <button
                key={`${venue.name}-${venue.district}`}
                type="button"
                data-ocid="create.venue_item"
                onClick={() => selectVenue(venue)}
                className="w-full text-left px-3 py-2.5 hover:bg-muted/60 dark:hover:bg-muted/30 transition-colors flex items-start justify-between gap-3 group"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                    {venue.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {venue.address}
                  </p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-0.5 mt-0.5">
                  {userLat !== null && userLng !== null && (
                    <span className="text-xs text-primary font-semibold">
                      {haversineKm(
                        userLat,
                        userLng,
                        venue.lat,
                        venue.lng,
                      ).toFixed(1)}{" "}
                      km
                    </span>
                  )}
                  <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                    {venue.district}
                  </span>
                </div>
              </button>
            ))}
          </div>
          {filteredVenues.length > 6 && (
            <div className="px-3 py-2 border-t border-border bg-muted/20">
              <button
                type="button"
                onClick={() => setShowMore((v) => !v)}
                className="text-xs text-primary hover:underline font-medium"
                data-ocid="create.venue_show_more"
              >
                {showMore
                  ? "Thu gọn"
                  : `Xem thêm ${filteredVenues.length - 6} sân khác`}
              </button>
            </div>
          )}
        </div>
      )}

      {!showVenueList && filteredVenues.length > 0 && (
        <button
          type="button"
          onClick={() => setShowVenueList(true)}
          className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
          data-ocid="create.venue_toggle"
        >
          <MapPin className="w-3 h-3" /> Chọn từ danh sách sân
        </button>
      )}

      {/* Manual input */}
      <div className="relative">
        <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
        <Input
          id="location"
          data-ocid="create.location_input"
          placeholder="Hoặc nhập địa chỉ thủ công..."
          value={value}
          onChange={(e) => handleManualInput(e.target.value)}
          className={`pl-9 min-h-[48px] ${error ? "border-red-500" : ""}`}
        />
      </div>

      {error && (
        <p
          className="text-xs text-destructive"
          data-ocid="create.location_field_error"
        >
          {error}
        </p>
      )}

      {/* Map preview */}
      {selectedVenue && mapLat && mapLng && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-xl overflow-hidden border border-border shadow-sm"
          data-ocid="create.map_preview"
        >
          <div className="px-3 py-1.5 bg-muted/40 border-b border-border flex items-center gap-2">
            <MapPin className="w-3 h-3 text-primary" />
            <span className="text-xs font-medium text-muted-foreground truncate">
              {selectedVenue.name}
            </span>
            <a
              href={`https://www.openstreetmap.org/?mlat=${mapLat}&mlon=${mapLng}&zoom=15`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-xs text-primary hover:underline shrink-0"
            >
              Mở bản đồ ↗
            </a>
          </div>
          <iframe
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapLng - 0.005},${mapLat - 0.005},${mapLng + 0.005},${mapLat + 0.005}&layer=mapnik&marker=${mapLat},${mapLng}`}
            style={{ width: "100%", height: "130px", border: "none" }}
            title={`Bản đồ ${selectedVenue.name}`}
            loading="lazy"
          />
        </motion.div>
      )}
    </div>
  );
}

// ---- CREATE MATCH SECTION ----
function CreateMatchSection({
  sectionRef,
  preSelectedSport,
  onPreSelectedSportConsumed,
  isLoggedIn,
  onLoginRequest,
}: {
  sectionRef: React.RefObject<HTMLElement | null>;
  preSelectedSport: string | null;
  onPreSelectedSportConsumed: () => void;
  isLoggedIn: boolean;
  onLoginRequest: () => void;
}) {
  const createMutation = useCreateMatch();
  const [form, setForm] = useState({
    sport: "none",
    title: "",
    location: "",
    time: "",
    missing: "",
    requirements: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync sport from modal pre-selection
  useEffect(() => {
    if (preSelectedSport) {
      setForm((prev) => ({ ...prev, sport: preSelectedSport }));
      setErrors((prev) => ({ ...prev, sport: "" }));
      onPreSelectedSportConsumed();
    }
  }, [preSelectedSport, onPreSelectedSportConsumed]);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!form.sport || form.sport === "none")
      newErrors.sport = "Vui lòng chọn môn thể thao";
    if (!form.location.trim()) newErrors.location = "Vui lòng nhập địa điểm";
    if (!form.time) newErrors.time = "Vui lòng chọn thời gian";
    const missingNum = Number(form.missing);
    if (!form.missing || Number.isNaN(missingNum) || missingNum <= 0) {
      newErrors.missing = "Số người thiếu phải là số nguyên dương";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error("Bạn cần đăng nhập để tạo trận.");
      onLoginRequest();
      return;
    }
    if (!validate()) return;
    setIsSubmitting(true);
    const payload = {
      sport: form.sport,
      title: form.title.trim() || `Trận ${form.sport} tại ${form.location}`,
      location: form.location.trim(),
      time: form.time,
      missing: BigInt(Math.round(Number(form.missing))),
      requirements: form.requirements.trim() || undefined,
    };
    console.log("[handleSubmit] payload:", payload);
    try {
      const result = await createMutation.mutateAsync(payload);
      console.log("[handleSubmit] success:", result);
      toast.success("Tạo trận thành công! 🎉");
      setForm({
        sport: "none",
        title: "",
        location: "",
        time: "",
        missing: "",
        requirements: "",
      });
      setErrors({});
      document
        .getElementById("matches")
        ?.scrollIntoView({ behavior: "smooth" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[handleSubmit] FAILED:", msg, err);
      if (
        msg.toLowerCase().includes("anonymous") ||
        msg.toLowerCase().includes("not connected")
      ) {
        toast.error("Bạn cần đăng nhập để tạo trận.");
      } else {
        toast.error(`Không thể tạo trận: ${msg}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section ref={sectionRef} id="create" className="bg-muted py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <Badge
            className="mb-3 text-white border-0"
            style={{ background: "oklch(0.58 0.18 220)" }}
          >
            <Plus className="w-3 h-3 mr-1" /> Host a Game
          </Badge>
          <h2 className="font-display text-3xl font-extrabold text-foreground">
            Tạo Trận Của Bạn
          </h2>
          <p className="text-muted-foreground mt-2 text-base">
            Điền thông tin và để mọi người tìm thấy bạn.
          </p>
        </div>

        <form onSubmit={handleSubmit} data-ocid="create.panel">
          <div className="bg-card dark:bg-card dark:border-border rounded-2xl shadow-card border border-border p-8 md:p-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* Sport */}
              <div className="space-y-2">
                <Label htmlFor="sport" className="font-semibold text-sm">
                  Môn thể thao <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.sport}
                  onValueChange={(v) => update("sport", v)}
                >
                  <SelectTrigger
                    id="sport"
                    data-ocid="create.select"
                    className={`w-full min-h-[48px] ${errors.sport ? "border-red-500" : ""}`}
                  >
                    <SelectValue placeholder="Chọn môn..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SPORTS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {getSportConfig(s).emoji} {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.sport && (
                  <p className="text-xs text-destructive">{errors.sport}</p>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="font-semibold text-sm">
                  Tên trận (tuỳ chọn)
                </Label>
                <Input
                  id="title"
                  data-ocid="create.input"
                  placeholder="VD: Bóng đá chiều thứ 6"
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  className="min-h-[48px]"
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="font-semibold text-sm">
                  Địa điểm <span className="text-red-500">*</span>
                </Label>
                <LocationVenuePicker
                  value={form.location}
                  onChange={(val) => update("location", val)}
                  sport={form.sport}
                  error={errors.location}
                />
              </div>

              {/* Time */}
              <div className="space-y-2">
                <Label htmlFor="time" className="font-semibold text-sm">
                  Ngày & Giờ <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="time"
                    type="datetime-local"
                    value={form.time}
                    onChange={(e) => update("time", e.target.value)}
                    className={`pl-9 min-h-[48px] ${errors.time ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.time && (
                  <p className="text-xs text-destructive">{errors.time}</p>
                )}
              </div>

              {/* Missing players */}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="missing" className="font-semibold text-sm">
                  Số người thiếu <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Users className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="missing"
                    type="number"
                    min="1"
                    max="20"
                    placeholder="Cần thêm bao nhiêu người?"
                    value={form.missing}
                    onChange={(e) => update("missing", e.target.value)}
                    className={`pl-9 min-h-[48px] ${errors.missing ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.missing && (
                  <p className="text-xs text-destructive">{errors.missing}</p>
                )}
              </div>

              {/* Teammate requirements */}
              <div className="space-y-2 sm:col-span-2">
                <Label
                  htmlFor="requirements"
                  className="font-semibold text-sm flex items-center gap-2"
                >
                  <Users className="w-4 h-4 text-primary" />
                  Yêu cầu đồng đội
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    (không bắt buộc)
                  </span>
                </Label>
                <Textarea
                  id="requirements"
                  data-ocid="create.requirements_textarea"
                  placeholder="VD: Cần người chơi có kinh nghiệm, tính cách thân thiện, tuổi 18–25, biết phối hợp đồng đội..."
                  value={form.requirements}
                  onChange={(e) => update("requirements", e.target.value)}
                  rows={3}
                  className="resize-none text-sm leading-relaxed"
                />
                <p className="text-xs text-muted-foreground">
                  Yêu cầu này sẽ hiển thị trên thẻ trận để người tham gia có thể
                  đọc và quyết định tham gia.
                </p>
              </div>
            </div>

            <Button
              type="submit"
              data-ocid="create.submit_button"
              disabled={isSubmitting}
              className="w-full mt-8 h-12 text-base font-bold text-white border-0 rounded-full cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.58 0.18 220), oklch(0.70 0.20 138))",
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Đang xử
                  lý...
                </>
              ) : !isLoggedIn ? (
                <>
                  <LogIn className="w-5 h-5 mr-2" /> Đăng nhập để tạo trận
                </>
              ) : (
                <>
                  <Target className="w-5 h-5 mr-2" /> Gửi / Tạo Trận
                </>
              )}
            </Button>
            {!isLoggedIn && (
              <p
                className="text-center text-sm text-muted-foreground mt-3"
                data-ocid="create.error_state"
              >
                Bạn cần{" "}
                <button
                  type="button"
                  onClick={onLoginRequest}
                  className="text-primary underline hover:no-underline font-medium"
                >
                  đăng nhập
                </button>{" "}
                để tạo trận đấu.
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}

// ---- RANKING SECTION ----
function RankingSection({
  isLoggedIn,
  profiles,
}: { isLoggedIn: boolean; profiles?: ProfileEntry[] }) {
  const { data: rankings = [], isLoading } = useGetAllRankings(isLoggedIn);
  const ratePlayerMutation = useRatePlayer();
  const { user } = useLocalAuth();
  const [hoverRating, setHoverRating] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});

  async function handleQuickRate(principal: string, score: number) {
    if (!isLoggedIn || submitted[principal]) return;
    try {
      await ratePlayerMutation.mutateAsync({
        ratedPrincipal: principal,
        matchId: "direct_vote",
        score,
        comment: "",
      });
      setSubmitted((prev) => ({ ...prev, [principal]: true }));
      toast.success("Đã đánh giá!");
    } catch {
      toast.error("Không thể đánh giá.");
    }
  }

  const hasData = rankings.length > 0;

  function resolveRankName(rank: PlayerRank): string {
    if (!profiles) return truncatePrincipal(rank.userPrincipal.toString());
    const entry = profiles.find(
      (p) => p.owner.toString() === rank.userPrincipal.toString(),
    );
    return (
      entry?.profile.name || truncatePrincipal(rank.userPrincipal.toString())
    );
  }

  function resolveRankAvatar(rank: PlayerRank): string {
    if (!profiles) return "";
    const entry = profiles.find(
      (p) => p.owner.toString() === rank.userPrincipal.toString(),
    );
    return entry?.profile.avatarUrl || "";
  }

  function truncatePrincipal(p: string): string {
    if (p.length <= 10) return p;
    return `${p.slice(0, 5)}...${p.slice(-3)}`;
  }

  function trophyIcon(rank: number): string | null {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  }

  return (
    <section className="py-14 bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-8">
          <Trophy className="w-7 h-7 text-yellow-500" />
          <h2 className="text-2xl font-bold text-foreground">Bảng Xếp Hạng</h2>
          <Badge variant="secondary" className="text-xs">
            Top người chơi
          </Badge>
        </div>

        {isLoading ? (
          <div data-ocid="ranking.loading_state" className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : !hasData ? (
          <div
            data-ocid="ranking.empty_state"
            className="text-center py-12 rounded-2xl border border-border bg-card"
          >
            <Medal className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-foreground">
              Chưa có dữ liệu xếp hạng
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Tham gia và hoàn thành các trận để leo hạng!
            </p>
          </div>
        ) : (
          <div className="space-y-3" data-ocid="ranking.list">
            {rankings.slice(0, 10).map((rank, idx) => {
              const name = resolveRankName(rank);
              const avatarUrl = resolveRankAvatar(rank);
              const trophy = trophyIcon(idx + 1);
              const hue =
                rank.userPrincipal
                  .toString()
                  .split("")
                  .reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

              return (
                <motion.div
                  key={rank.userPrincipal.toString()}
                  data-ocid={`ranking.item.${idx + 1}`}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  className={`flex items-center gap-4 rounded-xl border px-4 py-3 bg-card ${idx < 3 ? "border-yellow-400/40 shadow-sm" : "border-border"}`}
                >
                  {/* Rank number */}
                  <div className="w-8 text-center shrink-0">
                    {trophy ? (
                      <span className="text-xl">{trophy}</span>
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground">
                        {idx + 1}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={name}
                      className="w-10 h-10 rounded-full object-cover shrink-0 border border-border"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-white font-bold text-sm border border-border"
                      style={{ background: `oklch(0.62 0.18 ${hue})` }}
                    >
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {name}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {rank.totalMatches} trận
                      </span>
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        {rank.showUpCount} đúng hẹn
                      </span>
                    </div>
                  </div>

                  {/* Rating + Vote */}
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    {/* Avg rating display */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className="w-3 h-3"
                          fill={s <= Math.round(rank.avgRating) ? "#eab308" : "none"}
                          stroke={s <= Math.round(rank.avgRating) ? "#eab308" : "currentColor"}
                        />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">
                        {rank.avgRating.toFixed(1)} ({rank.totalRatings.toString()})
                      </span>
                    </div>
                    {/* Vote inline — chỉ hiện khi đã login và không phải chính mình */}
                    {isLoggedIn && rank.userPrincipal.toString() !== user?.principal && (
                      submitted[rank.userPrincipal.toString()] ? (
                        <span className="text-[11px] text-green-600 dark:text-green-400 font-medium">✓ Đã vote</span>
                      ) : (
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onMouseEnter={() => setHoverRating((prev) => ({ ...prev, [rank.userPrincipal.toString()]: s }))}
                              onMouseLeave={() => setHoverRating((prev) => ({ ...prev, [rank.userPrincipal.toString()]: 0 }))}
                              onClick={() => handleQuickRate(rank.userPrincipal.toString(), s)}
                              disabled={ratePlayerMutation.isPending}
                              className="transition-transform hover:scale-125 cursor-pointer disabled:opacity-50"
                              aria-label={`Vote ${s} sao`}
                            >
                              <Star
                                className="w-3.5 h-3.5"
                                fill={s <= (hoverRating[rank.userPrincipal.toString()] ?? 0) ? "#eab308" : "none"}
                                stroke={s <= (hoverRating[rank.userPrincipal.toString()] ?? 0) ? "#eab308" : "currentColor"}
                              />
                            </button>
                          ))}
                        </div>
                      )
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// ---- HOT NEWS SECTION ----

// Fallback articles from real Vietnamese sports sites (shown when API is unavailable)
// High-quality Unsplash fallback images per sport
const SPORT_IMG_FALLBACK: Record<string, string> = {
  Soccer:
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80",
  Basketball:
    "https://images.unsplash.com/photo-1546519638405-a0564eba17c9?w=800&q=80",
  Tennis:
    "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80",
  Swimming:
    "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&q=80",
  Running:
    "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&q=80",
  Cycling:
    "https://images.unsplash.com/photo-1534787238916-9ba6764efd4f?w=800&q=80",
  "Table Tennis":
    "https://images.unsplash.com/photo-1609743522653-52354461eb27?w=800&q=80",
  Futsal:
    "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80",
  Volleyball:
    "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&q=80",
  Badminton:
    "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80",
};
const IMG_FALLBACK_DEFAULT =
  "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80";

const FALLBACK_NEWS: NewsItem[] = [
  {
    id: "fallback-1",
    title: "Đội tuyển Việt Nam thi đấu tại vòng loại World Cup 2026",
    description:
      "Hành trình lịch sử của đội tuyển bóng đá quốc gia Việt Nam trong vòng loại thứ 3 World Cup 2026 khu vực châu Á.",
    imageUrl: SPORT_IMG_FALLBACK.Soccer,
    url: "https://bongdaplus.vn",
    source: "BongDaPlus",
    publishedAt: new Date().toISOString(),
    sport: "Soccer",
  },
  {
    id: "fallback-2",
    title: "Giải bóng rổ VBA 2026 khai mạc với nhiều điểm nhấn mới",
    description:
      "Mùa giải VBA 2026 hứa hẹn nhiều bất ngờ với sự tham gia của các ngoại binh chất lượng cao và lực lượng nội binh trưởng thành.",
    imageUrl: SPORT_IMG_FALLBACK.Basketball,
    url: "https://bongda.com.vn",
    source: "BongDa",
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    sport: "Basketball",
  },
  {
    id: "fallback-3",
    title: "Nguyễn Thùy Linh tỏa sáng tại giải cầu lông quốc tế",
    description:
      "Tay vợt số 1 Việt Nam tiếp tục tạo dấu ấn trên đấu trường quốc tế, mang về thành tích đáng tự hào cho thể thao Việt Nam.",
    imageUrl: SPORT_IMG_FALLBACK.Badminton,
    url: "https://thethao247.vn",
    source: "TheThao247",
    publishedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    sport: "Badminton",
  },
  {
    id: "fallback-4",
    title: "Giải Marathon TP.HCM 2026 phá kỷ lục người tham gia",
    description:
      "Hơn 15,000 vận động viên đăng ký tham gia giải chạy bộ lớn nhất miền Nam, cung đường chạy men theo sông Sài Gòn đẹp ngoạn mục.",
    imageUrl: SPORT_IMG_FALLBACK.Running,
    url: "https://vnexpress.net/the-thao",
    source: "VnExpress Thể Thao",
    publishedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    sport: "Running",
  },
  {
    id: "fallback-5",
    title: "Đội tuyển bóng chuyền nữ Việt Nam tiến vào chung kết AVC",
    description:
      "Với màn trình diễn xuất sắc, đội tuyển bóng chuyền nữ Việt Nam đã vượt qua nhiều đối thủ mạnh để lọt vào trận chung kết châu Á.",
    imageUrl: SPORT_IMG_FALLBACK.Volleyball,
    url: "https://thethaovanhoa.vn",
    source: "Thể Thao Văn Hóa",
    publishedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    sport: "Volleyball",
  },
  {
    id: "fallback-6",
    title: "Lý Hoàng Nam chinh phục mốc mới trong bảng xếp hạng ATP",
    description:
      "Tay vợt hàng đầu Việt Nam tiếp tục tiến bộ vượt bậc, khẳng định vị thế ngày càng vững chắc trên đấu trường quần vợt thế giới.",
    imageUrl: SPORT_IMG_FALLBACK.Tennis,
    url: "https://bongda.com.vn/tennis",
    source: "BongDa Tennis",
    publishedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    sport: "Tennis",
  },
];

function formatRelativeTime(isoDate: string): string {
  try {
    const diff = Date.now() - new Date(isoDate).getTime();
    if (diff < 60_000) return "Vừa xong";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} phút trước`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} giờ trước`;
    if (diff < 7 * 86_400_000)
      return `${Math.floor(diff / 86_400_000)} ngày trước`;
    return new Date(isoDate).toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
}

function NewsImageWithFallback({
  src,
  alt,
  className,
  sport,
}: { src: string; alt: string; className?: string; sport?: string }) {
  const fallback =
    (sport ? SPORT_IMG_FALLBACK[sport] : undefined) ?? IMG_FALLBACK_DEFAULT;
  const [imgSrc, setImgSrc] = useState(src || fallback);
  // Reset on prop change
  useEffect(() => {
    setImgSrc(src || fallback);
  }, [src, fallback]);
  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setImgSrc(fallback)}
    />
  );
}

function NewsSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-card border border-border animate-pulse">
      <div className="aspect-video bg-muted" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-2/3" />
      </div>
    </div>
  );
}

// ---- ARTICLE READER MODAL ----
function ArticleReaderModal({
  articles,
  initialIndex,
  onClose,
}: {
  articles: NewsItem[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const article = articles[currentIndex];
  const total = articles.length;

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Reset scroll when article changes
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }
  });

  function goNext() {
    setCurrentIndex((i) => (i + 1) % total);
  }

  if (!article) return null;

  const sportCfg = article.sport ? getSportConfig(article.sport) : null;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="article-modal-backdrop"
        data-ocid="hot_news.dialog"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Modal card */}
        <motion.div
          key={`article-modal-${currentIndex}`}
          initial={{ opacity: 0, y: 48, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 32, scale: 0.97 }}
          transition={{ type: "spring", damping: 26, stiffness: 300 }}
          className="relative w-full sm:max-w-2xl max-h-[96dvh] sm:max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden"
          style={{
            background:
              "linear-gradient(160deg, oklch(0.14 0.03 260) 0%, oklch(0.10 0.02 250) 100%)",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow:
              "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Hero image */}
          <div
            className="relative w-full shrink-0"
            style={{ aspectRatio: "16/7" }}
          >
            <NewsImageWithFallback
              src={article.imageUrl}
              sport={article.sport}
              alt={article.title}
              className="w-full h-full object-cover"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            {/* Close button */}
            <button
              type="button"
              data-ocid="hot_news.close_button"
              onClick={onClose}
              className="absolute top-3 right-3 z-20 flex items-center justify-center w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-white hover:bg-black/80 transition-colors"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
            {/* Article counter pill */}
            <span className="absolute top-3 left-3 z-20 inline-flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white/80 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-white/15">
              {currentIndex + 1} / {total}
            </span>
            {/* Sport badge — bottom of image */}
            {sportCfg && (
              <span
                className="absolute bottom-3 left-4 z-20 inline-flex items-center gap-1.5 text-[11px] font-bold text-white px-2.5 py-1 rounded-full shadow-lg border border-white/20 backdrop-blur-sm"
                style={{ background: `${sportCfg.color}e0` }}
              >
                <span className="text-sm leading-none">{sportCfg.emoji}</span>
                {article.sport}
              </span>
            )}
          </div>

          {/* Scrollable content */}
          <div
            ref={bodyRef}
            className="flex-1 overflow-y-auto px-5 py-4 space-y-3"
          >
            {/* Source + time row */}
            <div className="flex items-center justify-between gap-2">
              <span
                className="inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                style={{
                  background: "rgba(255,255,255,0.09)",
                  color: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                {article.source}
              </span>
              <span className="text-[11px] text-white/50 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatRelativeTime(article.publishedAt)}
              </span>
            </div>

            {/* Title */}
            <h2
              className="text-white font-extrabold text-lg sm:text-xl leading-tight"
              style={{ textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}
            >
              {article.title}
            </h2>

            {/* Description / body */}
            {article.description && (
              <p className="text-white/70 text-sm leading-relaxed">
                {article.description}
              </p>
            )}

            {/* Divider */}
            <div className="h-px bg-white/10 my-1" />

            {/* Action buttons */}
            <div className="flex items-center gap-3 pb-2">
              {/* Read original */}
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                data-ocid="hot_news.link"
                className="inline-flex items-center gap-2 text-sm font-semibold text-white px-4 py-2.5 rounded-2xl transition-all duration-200 shrink-0"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.55 0.22 250), oklch(0.50 0.24 280))",
                  border: "1px solid rgba(255,255,255,0.18)",
                  boxShadow: "0 4px 16px rgba(99,102,241,0.35)",
                }}
              >
                Đọc bài gốc
                <span className="text-base leading-none">→</span>
              </a>

              {/* Next article */}
              <button
                type="button"
                data-ocid="hot_news.secondary_button"
                onClick={goNext}
                className="flex-1 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white/90 px-4 py-2.5 rounded-2xl transition-all duration-200 hover:bg-white/15 active:scale-[0.97]"
                style={{
                  background: "rgba(255,255,255,0.09)",
                  border: "1px solid rgba(255,255,255,0.13)",
                }}
              >
                <Newspaper className="w-4 h-4 opacity-70" />
                Bài viết khác
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function HotNewsSection() {
  const { data: apiNews = [], isLoading, isError, refetch } = useGetHotNews();
  const [showAll, setShowAll] = useState(false);
  const [readerIndex, setReaderIndex] = useState<number | null>(null);

  // Use real data when available; otherwise show curated fallbacks
  const news: NewsItem[] = apiNews.length > 0 ? apiNews : FALLBACK_NEWS;
  const isFallback = apiNews.length === 0 && !isLoading;

  // Show featured + first 4 small, then expand
  const INITIAL_SMALL = 4;
  const featured = news[0] ?? null;
  const smallItems = news.slice(1);
  const visibleSmall = showAll
    ? smallItems
    : smallItems.slice(0, INITIAL_SMALL);
  const hasMore = smallItems.length > INITIAL_SMALL;

  return (
    <section
      className="py-14 px-4 max-w-7xl mx-auto"
      data-ocid="hot_news.section"
    >
      {/* Article reader modal */}
      {readerIndex !== null && (
        <ArticleReaderModal
          articles={news}
          initialIndex={readerIndex}
          onClose={() => setReaderIndex(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Newspaper className="w-7 h-7 text-primary" />
            <span className="absolute -top-1 -right-1 text-sm animate-bounce">
              🔥
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground leading-tight">
              <span
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.65 0.22 30), oklch(0.72 0.22 50))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Hot News
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tin thể thao mới nhất
            </p>
          </div>
          {isFallback && !isError && (
            <Badge variant="secondary" className="text-xs hidden sm:flex">
              Nội dung đề xuất
            </Badge>
          )}
          {isError && (
            <Badge className="text-xs bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800">
              Lỗi tải tin
            </Badge>
          )}
        </div>
        {news.length > INITIAL_SMALL + 1 && (
          <Button
            variant="outline"
            size="sm"
            data-ocid="hot_news.toggle"
            onClick={() => setShowAll((v) => !v)}
            className="rounded-full text-xs font-medium"
          >
            {showAll ? "Thu gọn" : `Xem tất cả (${news.length})`}
          </Button>
        )}
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-5">
          <div className="rounded-2xl overflow-hidden bg-card border border-border animate-pulse">
            <div className="aspect-video bg-muted" />
            <div className="p-5 space-y-3">
              <div className="h-5 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-full" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <NewsSkeleton key={i} />
            ))}
          </div>
        </div>
      )}

      {/* Error state with retry */}
      {isError && (
        <div
          data-ocid="hot_news.error_state"
          className="text-center py-12 rounded-2xl border border-border bg-card"
        >
          <div className="text-4xl mb-3">📡</div>
          <p className="font-semibold text-foreground mb-1">
            Không thể tải tin tức
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Vui lòng thử lại sau
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="rounded-full"
            data-ocid="hot_news.secondary_button"
          >
            Thử lại
          </Button>
        </div>
      )}

      {/* News content */}
      {!isLoading && !isError && featured && (
        <div className="space-y-6">
          {/* Featured article — cinematic hero */}
          <motion.article
            key={featured.id}
            data-ocid="hot_news.item.1"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="relative rounded-3xl overflow-hidden cursor-pointer group w-full shadow-xl"
            style={{ minHeight: "320px", aspectRatio: "16/7" }}
            onClick={() => setReaderIndex(0)}
          >
            {/* Cinematic image — zoom only on image */}
            <div className="absolute inset-0 overflow-hidden">
              <NewsImageWithFallback
                src={featured.imageUrl}
                sport={featured.sport}
                alt={featured.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
            </div>
            {/* Deep gradient for legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
            {/* Top row: sport badge left, source right */}
            <div className="absolute top-5 left-5 right-5 flex items-start justify-between z-10 gap-3">
              {featured.sport && (
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm border border-white/20"
                  style={{
                    background: `${getSportConfig(featured.sport).color}e0`,
                  }}
                >
                  <span className="text-base leading-none">
                    {getSportConfig(featured.sport).emoji}
                  </span>
                  {featured.sport}
                </span>
              )}
              <span className="inline-flex items-center bg-black/50 backdrop-blur-sm text-white/90 text-[11px] font-semibold px-3 py-1.5 rounded-full border border-white/15 ml-auto">
                {featured.source}
              </span>
            </div>
            {/* Bottom text overlay */}
            <div className="absolute inset-x-0 bottom-0 px-6 pb-6 pt-10 z-10 bg-gradient-to-t from-black/60 to-transparent">
              <h3
                className="text-white font-extrabold text-xl sm:text-2xl md:text-3xl leading-tight mb-2 line-clamp-2"
                style={{ textShadow: "0 2px 12px rgba(0,0,0,0.7)" }}
              >
                {featured.title}
              </h3>
              {featured.description && (
                <p className="text-white/75 text-sm leading-relaxed line-clamp-2 mb-3 hidden sm:block">
                  {featured.description}
                </p>
              )}
              <div className="flex items-center justify-between gap-3">
                <span className="text-white/65 text-xs flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  {formatRelativeTime(featured.publishedAt)}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-primary/90 hover:bg-primary border border-primary/60 rounded-full px-4 py-1.5 group-hover:bg-primary transition-colors shadow-md">
                  📖 Đọc bài viết
                </span>
              </div>
            </div>
          </motion.article>

          {/* Editorial grid — clean cards with image on top */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {visibleSmall.map((item, idx) => (
                <motion.article
                  key={item.id}
                  data-ocid={`hot_news.item.${idx + 2}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.07, duration: 0.35 }}
                  className="rounded-2xl overflow-hidden bg-card border border-border cursor-pointer group hover:shadow-lg hover:-translate-y-1 transition-all duration-250"
                  onClick={() =>
                    window.open(item.url, "_blank", "noopener,noreferrer")
                  }
                >
                  {/* Image — aspect 4:3 for editorial feel */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    <NewsImageWithFallback
                      src={item.imageUrl}
                      sport={item.sport}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-[1.06]"
                    />
                    {/* Subtle bottom gradient on image */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  {/* Text section — clean, no overlay */}
                  <div className="p-3.5 space-y-2">
                    {/* Sport pill */}
                    {item.sport && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-white px-2 py-0.5 rounded-full"
                        style={{
                          background: `${getSportConfig(item.sport).color}d0`,
                        }}
                      >
                        {getSportConfig(item.sport).emoji}
                        <span className="hidden sm:inline">{item.sport}</span>
                      </span>
                    )}
                    <h4 className="font-semibold text-xs text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {item.title}
                    </h4>
                    <div className="flex items-center justify-between gap-1 pt-0.5 border-t border-border/50">
                      <span className="text-[10px] text-muted-foreground font-medium truncate flex-1">
                        {item.source}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {formatRelativeTime(item.publishedAt)}
                      </span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>

          {/* Expand / collapse button */}
          {hasMore && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center pt-2"
            >
              <Button
                variant="outline"
                data-ocid="hot_news.toggle"
                onClick={() => setShowAll((v) => !v)}
                className="rounded-full px-8 font-semibold text-sm"
              >
                {showAll ? (
                  <>↑ Thu gọn</>
                ) : (
                  <>Xem thêm {smallItems.length - INITIAL_SMALL} tin nữa ↓</>
                )}
              </Button>
            </motion.div>
          )}
        </div>
      )}

      {/* Empty state (no news at all) */}
      {!isLoading && !isError && news.length === 0 && (
        <div
          data-ocid="hot_news.empty_state"
          className="text-center py-12 rounded-2xl border border-border bg-card"
        >
          <div className="text-4xl mb-3">📰</div>
          <p className="font-semibold text-foreground">Chưa có tin tức</p>
          <p className="text-sm text-muted-foreground mt-1">
            Quay lại sau để xem tin mới nhất!
          </p>
        </div>
      )}
    </section>
  );
}

// ---- FOOTER ----
function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="text-white py-16"
      style={{ background: "oklch(0.18 0.03 220)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          <div>
            <div className="flex items-center mb-3">
              <img
                src="/assets/logo-matchup.png"
                className="h-10 w-auto brightness-110 drop-shadow-[0_0_8px_rgba(99,179,237,0.3)]"
                alt="MatchUp"
              />
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              Nền tảng kết nối thể thao dành cho sinh viên. Tìm trận, lấp chỗ
              trống, thi đấu nhiều hơn.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-white/80 uppercase text-xs tracking-wider">
              Nền tảng
            </h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li>
                <a
                  href="#matches"
                  className="hover:text-white transition-colors"
                >
                  Tìm trận
                </a>
              </li>
              <li>
                <a
                  href="#create"
                  className="hover:text-white transition-colors"
                >
                  Tạo trận
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-white/80 uppercase text-xs tracking-wider">
              Môn thể thao
            </h4>
            <div className="flex flex-wrap gap-2">
              {SPORTS.map((s) => (
                <span
                  key={s}
                  className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/70"
                >
                  {getSportConfig(s).emoji} {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Phần dưới footer */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-white/50">
          <span>© {year} MatchUp. All rights reserved.</span>
          <span className="flex items-center gap-1">
            Built with <Heart className="inline w-3 h-3 text-red-400" /> by{" "}
            <span className="font-medium text-white/70">
              TEAM 7 - L02 - IM1031 - BKHCM
            </span>
          </span>
        </div>
      </div>
    </footer>
  );
}

// ---- MOBILE STICKY BOTTOM BAR ----
function MobileStickyBar({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-safe-area-inset-bottom bg-white dark:bg-background border-t border-border dark:border-border py-3 transition-colors duration-300">
      <Button
        data-ocid="mobile.create_button"
        onClick={onCreateClick}
        className="w-full h-12 text-white font-bold text-base border-0 rounded-full cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.58 0.18 220), oklch(0.70 0.20 138))",
        }}
      >
        🏆 Tạo trận ngay
      </Button>
    </div>
  );
}

// ---- APP ----
export default function App() {
  const [filterSport, setFilterSport] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterTime, setFilterTime] = useState("all");
  const [filterSlots, setFilterSlots] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [preSelectedSport, setPreSelectedSport] = useState<string | null>(null);
  const createSectionRef = useRef<HTMLElement>(null);
  const { isDark, toggleDark } = useDarkMode();

  // ---- Local auth (thay thế Internet Identity) ----
  const auth = useLocalAuth();
  const { isLoggedIn, user, logout } = auth;
  const callerPrincipal = user?.principal ?? "";

  // Deep link: open match from ?match=ID URL param
  const [deepLinkMatchId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("match");
  });
  const [deepLinkMatch, setDeepLinkMatch] = useState<Match | null>(null);
  const [deepLinkOpen, setDeepLinkOpen] = useState(false);
  const { data: allMatchesForDeepLink } = useGetAllMatches();
  useEffect(() => {
    if (!deepLinkMatchId || !allMatchesForDeepLink) return;
    const found = (allMatchesForDeepLink as Match[]).find((m) => m.id === deepLinkMatchId);
    if (found) {
      setDeepLinkMatch(found);
      setDeepLinkOpen(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [deepLinkMatchId, allMatchesForDeepLink]);

  // Fetch all profiles at app level
  const { data: allProfiles = [] } = useGetAllProfiles(isLoggedIn);

  const { notifications, unreadCount, markAllRead, clearAll, markOneRead, unreadSenders } =
    useNotifications(isLoggedIn, callerPrincipal);

  const [openChatWith, setOpenChatWith] = useState<string | null>(null);
  const chatSectionRef = useRef<HTMLDivElement>(null);

  const { data: allMatchesForReminders } = useGetAllMatches();

  const participantCountsMap: Record<string, number> = {};
  if (allMatchesForReminders) {
    for (const m of allMatchesForReminders) {
      participantCountsMap[m.id] = Number(m.missing ?? 0);
    }
  }

  useMatchReminders(
    allMatchesForReminders,
    callerPrincipal,
    participantCountsMap,
  );

  const { mutate: doRegisterMe } = useRegisterMe();
  const registeredRef = useRef(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: doRegisterMe is stable
  useEffect(() => {
    if (isLoggedIn && !registeredRef.current) {
      registeredRef.current = true;
      doRegisterMe();
    }
    if (!isLoggedIn) {
      registeredRef.current = false;
    }
  }, [isLoggedIn]);

  function handleSearch(sport: string, location: string) {
    setFilterSport(sport);
    setFilterLocation(location);
    setFilterTime("all");
    setFilterSlots(false);
  }

  function scrollToCreate() {
    createSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function scrollToChat() {
    document.getElementById("chat")?.scrollIntoView({ behavior: "smooth" });
  }

  function scrollToRanking() {
    document.getElementById("ranking")?.scrollIntoView({ behavior: "smooth" });
  }

  function scrollToHotNews() {
    document.getElementById("hotnews")?.scrollIntoView({ behavior: "smooth" });
  }

  function handleCreateMatchFromSport(sport: string) {
    setPreSelectedSport(sport);
    setTimeout(() => {
      createSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 150);
  }

  // Fake identity object để tương thích với ChatSection
  const fakeIdentity = callerPrincipal
    ? { getPrincipal: () => ({ toString: () => callerPrincipal }) }
    : null;

  return (
    <div className="min-h-screen flex flex-col pb-16 sm:pb-0 bg-background text-foreground transition-colors duration-300">
      <Toaster position="top-right" />
      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        auth={auth}
      />
      <Header
        onCreateClick={scrollToCreate}
        onProfileClick={() => setProfileOpen(true)}
        isDark={isDark}
        toggleDark={toggleDark}
        notifications={notifications}
        unreadCount={unreadCount}
        markAllRead={markAllRead}
        clearAll={clearAll}
        onChatClick={scrollToChat}
        onRankingClick={scrollToRanking}
        onHotNewsClick={scrollToHotNews}
        onNotificationClick={(n) => {
          markOneRead(n.id);
          if (n.senderPrincipal) {
            setOpenChatWith(n.senderPrincipal);
            setTimeout(() => {
              chatSectionRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 150);
          }
        }}
        isLoggedIn={isLoggedIn}
        displayName={user?.displayName ?? ""}
        onLoginClick={() => setAuthModalOpen(true)}
        onLogout={logout}
      />
      <ProfileSheet
        open={profileOpen}
        onOpenChange={setProfileOpen}
        isLoggedIn={isLoggedIn}
        onLoginRequest={() => setAuthModalOpen(true)}
        user={user}
      />
      <motion.main
        className="flex-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
      >
        <HeroSection
          onSearch={handleSearch}
          onCreateMatch={handleCreateMatchFromSport}
          filterTime={filterTime}
          filterSlots={filterSlots}
          onFilterTime={setFilterTime}
          onFilterSlots={setFilterSlots}
          filterLocation={filterLocation}
          onFilterLocation={setFilterLocation}
        />
        {isLoggedIn && fakeIdentity ? (
          <>
            <TodayMatchesSection isLoggedIn={isLoggedIn} />
            <FindPlayersSection callerPrincipal={callerPrincipal} />
            <div ref={chatSectionRef} id="chat">
              <ChatSection
                identity={fakeIdentity as any}
                openWithPrincipal={openChatWith}
                onOpenHandled={() => setOpenChatWith(null)}
              />
            </div>
          </>
        ) : null}
        <LiveMatchesSection
          filterSport={filterSport}
          filterLocation={filterLocation}
          filterTime={filterTime}
          filterSlots={filterSlots}
          isLoggedIn={isLoggedIn}
          currentPrincipal={callerPrincipal}
          profiles={allProfiles as ProfileEntry[]}
        />
        <div id="ranking">
          <RankingSection
            isLoggedIn={isLoggedIn}
            profiles={allProfiles as ProfileEntry[]}
          />
        </div>
        <CreateMatchSection
          sectionRef={createSectionRef}
          preSelectedSport={preSelectedSport}
          onPreSelectedSportConsumed={() => setPreSelectedSport(null)}
          isLoggedIn={isLoggedIn}
          onLoginRequest={() => setAuthModalOpen(true)}
        />
        <div id="hotnews">
          <HotNewsSection />
        </div>
      </motion.main>
      <Footer />
      <MobileStickyBar onCreateClick={scrollToCreate} />
    </div>
  );
}
