import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { useGetMessages, useSendMessage, useGetAllProfiles } from "./hooks/useQueries";
import { useLocalAuth } from "./hooks/useLocalAuth";
import type { Message } from "./types";

const ICEBREAKERS = [
  "Môn thể thao nào bạn chưa thử nhưng muốn thử nhất? 🏄",
  "Nếu được chọn một siêu năng lực trong thể thao, bạn chọn gì? ⚡",
  "Trận đấu đáng nhớ nhất trong cuộc đời bạn là gì? 🏆",
  "Đồng đội lý tưởng của bạn cần có phẩm chất gì? 🤝",
  "Bạn thích thi đấu buổi sáng hay buổi tối hơn? 🌅",
  "Thất bại hay chiến thắng dạy bạn nhiều hơn? 💪",
];

function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
}

function formatTime(ts: string | number) {
  try {
    const d = new Date(typeof ts === "string" ? Number(ts) : ts);
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

interface Contact {
  principal: string;
  name: string;
  avatarUrl: string;
}

export function ChatSection({
  identity,
}: { identity: { getPrincipal: () => { toString: () => string } } }) {
  const { user } = useLocalAuth();
  const callerPrincipal = user?.principal ?? identity.getPrincipal().toString();

  const { data: allProfiles = [] } = useGetAllProfiles(true);

  // Contacts = people who share a match with me
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);

  useEffect(() => {
    if (!callerPrincipal) return;
    async function fetchContacts() {
      setLoadingContacts(true);
      try {
        // Get all matches I'm a participant in
        const mySnap = await getDocs(
          query(collection(db, "participants"), where("userId", "==", callerPrincipal))
        );
        const myMatchIds = mySnap.docs.map((d) => (d.data() as { matchId: string }).matchId);
        if (myMatchIds.length === 0) { setContacts([]); setLoadingContacts(false); return; }

        // Get all participants in those matches
        const otherPrincipals = new Set<string>();
        for (const matchId of myMatchIds) {
          const snap = await getDocs(
            query(collection(db, "participants"), where("matchId", "==", matchId))
          );
          for (const d of snap.docs) {
            const uid = (d.data() as { userId: string }).userId;
            if (uid !== callerPrincipal) otherPrincipals.add(uid);
          }
        }

        // Build contact list with profiles
        const profileMap = new Map(allProfiles.map((p) => [p.owner.toString(), p.profile]));
        const list: Contact[] = Array.from(otherPrincipals).map((principal) => {
          const profile = profileMap.get(principal);
          return {
            principal,
            name: profile?.name || principal.slice(0, 8) + "...",
            avatarUrl: profile?.avatarUrl || "",
          };
        });
        setContacts(list);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingContacts(false);
      }
    }
    fetchContacts();
  }, [callerPrincipal, allProfiles]);

  // Search
  const [search, setSearch] = useState("");
  const profileMap = useMemo(
    () => new Map(allProfiles.map((p) => [p.owner.toString(), p.profile])),
    [allProfiles]
  );

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return allProfiles
      .filter((p) => {
        const principal = p.owner.toString();
        return (
          principal !== callerPrincipal &&
          (p.profile.name.toLowerCase().includes(q) || principal.includes(q))
        );
      })
      .map((p) => ({
        principal: p.owner.toString(),
        name: p.profile.name || p.owner.toString().slice(0, 8) + "...",
        avatarUrl: p.profile.avatarUrl || "",
      }));
  }, [search, allProfiles, callerPrincipal]);

  const displayContacts = search.trim() ? searchResults : contacts;

  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: messages = [], isLoading: loadingMessages } = useGetMessages(
    selectedContact?.principal ?? null,
    !!selectedContact,
  );

  const sendMutation = useSendMessage();

  const icebreakers = useMemo(
    () => pickRandom(ICEBREAKERS, 3),
    // biome-ignore lint/correctness/useExhaustiveDependencies: stable per contact
    [selectedContact?.principal],
  );

  const messagesLen = messages.length;
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messagesLen, isTyping]);

  const handleTextChange = useCallback((value: string) => {
    setText(value);
    if (value.trim()) {
      setIsTyping(true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => setIsTyping(false), 1500);
    } else {
      setIsTyping(false);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    }
  }, []);

  function handleSend() {
    if (!text.trim() || !selectedContact) return;
    setIsTyping(false);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    sendMutation.mutate(
      { to: selectedContact.principal, text: text.trim() },
      { onSuccess: () => setText("") },
    );
  }

  function handleIcebreaker(question: string) {
    if (!selectedContact) return;
    sendMutation.mutate({ to: selectedContact.principal, text: question });
  }

  function handleKeyDown(e: import("react").KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const typedMessages = messages as Array<{
    id: string; from: string; to: string; text: string; createdAt: string;
  }>;

  const myLastMsgIdx = (() => {
    for (let i = typedMessages.length - 1; i >= 0; i--) {
      if (typedMessages[i].from === callerPrincipal) return i;
    }
    return -1;
  })();

  const seenByContact =
    myLastMsgIdx >= 0 &&
    typedMessages.slice(myLastMsgIdx + 1).some((m) => m.from !== callerPrincipal);

  return (
    <section className="py-10 px-4 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold tracking-tight mb-6 text-foreground flex items-center gap-2">
        <span>💬</span> Tin nhắn
      </h2>

      <div className="flex gap-4 h-[520px] border border-border rounded-3xl overflow-hidden bg-card/60 backdrop-blur-sm shadow-2xl">
        {/* Contact list */}
        <div className="w-64 flex-shrink-0 border-r border-border flex flex-col bg-card/40">
          {/* Search */}
          <div className="p-3 border-b border-border">
            <Input
              placeholder="🔍 Tìm người dùng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-full text-sm bg-muted/50"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingContacts && !search.trim() ? (
              <div className="text-center text-muted-foreground text-sm py-6">Đang tải...</div>
            ) : displayContacts.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-6 px-3">
                {search.trim()
                  ? "Không tìm thấy người dùng"
                  : "Chưa có người chơi cùng trận"}
              </div>
            ) : (
              displayContacts.map((c) => {
                const isSelected = selectedContact?.principal === c.principal;
                return (
                  <button
                    type="button"
                    key={c.principal}
                    onClick={() => { setSelectedContact(c); setSearch(""); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/60 transition-colors ${
                      isSelected ? "bg-primary/10 border-r-2 border-primary" : ""
                    }`}
                  >
                    <Avatar className="h-9 w-9 flex-shrink-0">
                      {c.avatarUrl ? <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">{getInitials(c.name)}</AvatarFallback> : null}
                      <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                        {getInitials(c.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium truncate text-foreground">{c.name}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Message thread */}
        {selectedContact ? (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border flex items-center gap-3 bg-muted/30">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                  {getInitials(selectedContact.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-semibold text-foreground">{selectedContact.name}</span>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1"
            >
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Đang tải...</div>
              ) : typedMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 px-2">
                  <div className="text-center">
                    <p className="text-base font-semibold text-foreground">🎯 Phá băng nào!</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Chọn câu hỏi để bắt đầu</p>
                  </div>
                  <div className="flex flex-col gap-2 w-full max-w-xs">
                    {icebreakers.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => handleIcebreaker(q)}
                        disabled={sendMutation.isPending}
                        className="text-left text-sm px-4 py-3 rounded-xl border border-border bg-muted/40 hover:bg-primary/10 hover:border-primary/40 transition-colors text-foreground disabled:opacity-50 cursor-pointer"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {typedMessages.map((msg, idx) => {
                    const isMine = msg.from === callerPrincipal;
                    const isLastMine = idx === myLastMsgIdx;
                    const prevMsg = typedMessages[idx - 1];
                    const showTime =
                      !prevMsg ||
                      prevMsg.from !== msg.from ||
                      Math.abs(Number(msg.createdAt) - Number(prevMsg.createdAt)) > 60_000;

                    return (
                      <div
                        key={msg.id || idx}
                        className={`flex flex-col ${isMine ? "items-end" : "items-start"} ${showTime ? "mt-3" : "mt-0.5"}`}
                      >
                        <div
                          className={`max-w-[72%] px-4 py-2 text-sm leading-relaxed shadow-sm ${
                            isMine
                              ? "text-white rounded-2xl rounded-br-md"
                              : "bg-muted text-foreground rounded-2xl rounded-bl-md"
                          }`}
                          style={isMine ? { background: "linear-gradient(135deg, oklch(0.52 0.22 260), oklch(0.45 0.20 280))" } : undefined}
                        >
                          {msg.text}
                        </div>
                        {showTime && (
                          <span className="text-[10px] text-muted-foreground mt-1 px-1">
                            {formatTime(msg.createdAt)}
                          </span>
                        )}
                        {isLastMine && (
                          <span className="text-[10px] text-muted-foreground px-1 mt-0.5">
                            {seenByContact ? "✓✓ Đã xem" : "✓ Đã gửi"}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {isTyping && (
                    <div className="flex items-end justify-end mt-1">
                      <div className="bg-primary/20 text-primary text-xs px-4 py-2 rounded-2xl rounded-br-md flex items-center gap-1 italic">
                        <span className="animate-bounce" style={{ animationDelay: "0ms" }}>•</span>
                        <span className="animate-bounce" style={{ animationDelay: "120ms" }}>•</span>
                        <span className="animate-bounce" style={{ animationDelay: "240ms" }}>•</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-border flex gap-2 items-center bg-card/80 backdrop-blur-sm">
              <Input
                value={text}
                onChange={(e) => handleTextChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập tin nhắn..."
                className="flex-1 rounded-full bg-muted/50 border-muted focus-visible:ring-primary/30"
              />
              <Button
                onClick={handleSend}
                disabled={!text.trim() || sendMutation.isPending}
                size="sm"
                className="rounded-full px-4"
              >
                Gửi
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Chọn người để nhắn tin
          </div>
        )}
      </div>
    </section>
  );
}
