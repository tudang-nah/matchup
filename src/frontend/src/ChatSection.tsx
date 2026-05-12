import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useGetMessages,
  useGetMyMatches,
  useSendMessage,
} from "./hooks/useQueries";
import type { MatchEntry, Message } from "./types";

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
  return (
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

function formatTime(createdAt: bigint) {
  try {
    const ms = Number(createdAt) / 1_000_000;
    const d = new Date(ms);
    return d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function ChatSection({
  identity,
}: { identity: { getPrincipal: () => { toString: () => string } } }) {
  const callerPrincipal = identity.getPrincipal().toString();
  const { data: myMatches = [] } = useGetMyMatches(true);
  const [selectedContact, setSelectedContact] = useState<MatchEntry | null>(
    null,
  );
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mutualMatches = myMatches.filter((m: MatchEntry) => m.mutual);

  const { data: messages = [], isLoading: loadingMessages } = useGetMessages(
    selectedContact?.matched ?? null,
    !!selectedContact,
  );
  const sendMutation = useSendMessage();

  // Pick 3 random icebreakers per contact (stable per selection)
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally keyed on contact principal
  const icebreakers = useMemo(
    () => pickRandom(ICEBREAKERS, 3),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedContact?.matched.toString()],
  );

  const messagesLen = messages.length;
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message count change
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
      { to: selectedContact.matched, text: text.trim() },
      { onSuccess: () => setText("") },
    );
  }

  function handleIcebreaker(question: string) {
    if (!selectedContact) return;
    sendMutation.mutate({ to: selectedContact.matched, text: question });
  }

  function handleKeyDown(e: import("react").KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Find index of my last sent message
  const myLastMsgIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].from.toString() === callerPrincipal) return i;
    }
    return -1;
  })();

  // "Seen": if after my last message, the contact has replied
  const seenByContact =
    myLastMsgIdx >= 0 &&
    messages
      .slice(myLastMsgIdx + 1)
      .some((m: Message) => m.from.toString() !== callerPrincipal);

  return (
    <section className="py-10 px-4 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold tracking-tight mb-6 text-foreground flex items-center gap-2">
        <span>💬</span> Tin nhắn
      </h2>

      {mutualMatches.length === 0 ? (
        <div
          data-ocid="chat.empty_state"
          className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-2xl"
        >
          <p className="text-lg">Chưa có kết nối nào.</p>
          <p className="text-sm mt-1">
            Kết nối với người chơi để bắt đầu nhắn tin!
          </p>
        </div>
      ) : (
        <div className="flex gap-4 h-[480px] border border-border rounded-3xl overflow-hidden bg-card/60 backdrop-blur-sm shadow-2xl">
          {/* Contact list */}
          <div className="w-56 flex-shrink-0 border-r border-border overflow-y-auto bg-card/40 backdrop-blur-sm">
            {mutualMatches.map((m: MatchEntry, idx: number) => {
              const isSelected =
                selectedContact?.matched.toString() === m.matched.toString();
              return (
                <button
                  type="button"
                  key={m.matched.toString()}
                  data-ocid={`chat.item.${idx + 1}`}
                  onClick={() => setSelectedContact(m)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/60 transition-colors ${
                    isSelected ? "bg-primary/10 border-r-2 border-primary" : ""
                  }`}
                >
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    {m.profile.avatarUrl ? (
                      <AvatarImage
                        src={m.profile.avatarUrl}
                        alt={m.profile.name}
                      />
                    ) : null}
                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                      {getInitials(m.profile.name || m.matched.toString())}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium truncate text-foreground">
                    {m.profile.name || `${m.matched.toString().slice(0, 8)}...`}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Message thread */}
          {selectedContact ? (
            <div className="flex-1 flex flex-col min-w-0">
              {/* Header */}
              <div className="px-4 py-3 border-b border-border flex items-center gap-3 bg-muted/30">
                <Avatar className="h-8 w-8">
                  {selectedContact.profile.avatarUrl ? (
                    <AvatarImage
                      src={selectedContact.profile.avatarUrl}
                      alt={selectedContact.profile.name}
                    />
                  ) : null}
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {getInitials(
                      selectedContact.profile.name ||
                        selectedContact.matched.toString(),
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">
                    {selectedContact.profile.name ||
                      `${selectedContact.matched.toString().slice(0, 8)}...`}
                  </span>
                  <span className="text-xs text-emerald-500 font-medium">
                    ● Online
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div
                ref={scrollRef}
                data-ocid="chat.panel"
                className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1"
              >
                {loadingMessages ? (
                  <div
                    data-ocid="chat.loading_state"
                    className="flex items-center justify-center h-full text-muted-foreground text-sm"
                  >
                    Đang tải...
                  </div>
                ) : messages.length === 0 ? (
                  <div
                    data-ocid="chat.empty_state"
                    className="flex flex-col items-center justify-center h-full gap-4 px-2"
                  >
                    <div className="text-center">
                      <p className="text-base font-semibold text-foreground">
                        🎯 Phá băng nào!
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Chọn câu hỏi để bắt đầu
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 w-full max-w-xs">
                      {icebreakers.map((q, i) => (
                        <button
                          key={q}
                          type="button"
                          data-ocid={`chat.item.${i + 1}`}
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
                    {messages.map((msg: Message, idx: number) => {
                      const isMine = msg.from.toString() === callerPrincipal;
                      const isLastMine = idx === myLastMsgIdx;
                      const prevMsg = messages[idx - 1];
                      const showTime =
                        !prevMsg ||
                        prevMsg.from.toString() !== msg.from.toString() ||
                        Number(msg.createdAt - prevMsg.createdAt) >
                          60_000_000_000; // 1 min gap

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${
                            isMine ? "items-end" : "items-start"
                          } ${showTime ? "mt-3" : "mt-0.5"}`}
                        >
                          <div
                            className={`max-w-[72%] px-4 py-2 text-sm leading-relaxed shadow-sm ${
                              isMine
                                ? "text-white rounded-2xl rounded-br-md"
                                : "bg-muted text-foreground rounded-2xl rounded-bl-md"
                            }`}
                            style={
                              isMine
                                ? {
                                    background:
                                      "linear-gradient(135deg, oklch(0.52 0.22 260), oklch(0.45 0.20 280))",
                                  }
                                : undefined
                            }
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

                    {/* Typing indicator (own preview bubble while composing) */}
                    {isTyping && (
                      <div className="flex items-end justify-end mt-1">
                        <div className="bg-primary/20 text-primary text-xs px-4 py-2 rounded-2xl rounded-br-md flex items-center gap-1 italic">
                          <span
                            className="animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          >
                            •
                          </span>
                          <span
                            className="animate-bounce"
                            style={{ animationDelay: "120ms" }}
                          >
                            •
                          </span>
                          <span
                            className="animate-bounce"
                            style={{ animationDelay: "240ms" }}
                          >
                            •
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-border flex gap-2 items-center bg-card/80 backdrop-blur-sm">
                <Input
                  data-ocid="chat.input"
                  value={text}
                  onChange={(e) => handleTextChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 rounded-full bg-muted/50 border-muted focus-visible:ring-primary/30"
                />
                <Button
                  data-ocid="chat.submit_button"
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
      )}
    </section>
  );
}
