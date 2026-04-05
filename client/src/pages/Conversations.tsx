import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Search, Send, MessageCircle, Bot, CheckCheck, Clock,
  User, Phone, Filter, MoreVertical, CheckCircle2, Loader2
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format, isToday, isYesterday } from "date-fns";

const statusColors: Record<string, string> = {
  open: "bg-green-100 text-green-700",
  resolved: "bg-gray-100 text-gray-600",
  pending: "bg-yellow-100 text-yellow-700",
  bot: "bg-blue-100 text-blue-700",
};

function formatTime(date: Date | string) {
  const d = new Date(date);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "dd MMM");
}

export default function Conversations() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], refetch: refetchConvos } = trpc.conversations.list.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: 100,
    offset: 0,
  });

  const { data: messages = [], refetch: refetchMessages } = trpc.conversations.getMessages.useQuery(
    { conversationId: selectedId! },
    { enabled: !!selectedId }
  );

  const sendMessage = trpc.conversations.sendMessage.useMutation({
    onSuccess: () => { setMessage(""); refetchMessages(); refetchConvos(); },
    onError: (e) => toast.error(e.message),
  });

  const updateStatus = trpc.conversations.updateStatus.useMutation({
    onSuccess: () => refetchConvos(),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filtered = conversations.filter((c: any) =>
    !search ||
    c.contact?.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.waId?.includes(search) ||
    c.lastMessageText?.toLowerCase().includes(search.toLowerCase())
  );

  const selected = conversations.find((c: any) => c.id === selectedId);

  const handleSend = () => {
    if (!message.trim() || !selectedId) return;
    sendMessage.mutate({ conversationId: selectedId, content: message.trim() });
  };

  return (
    <div className="flex h-full bg-background overflow-hidden">
      {/* Conversation list */}
      <div className={`flex flex-col border-r border-border/50 bg-white ${selectedId ? "hidden md:flex w-80" : "flex w-full md:w-80"}`}>
        <div className="p-3 border-b border-border/50 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Conversations</h2>
            <Badge variant="secondary" className="text-xs">{conversations.length}</Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-xs">
              <Filter className="w-3 h-3 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="bot">Bot</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <MessageCircle className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Messages will appear here once customers contact you</p>
            </div>
          ) : (
            filtered.map((convo: any) => (
              <button
                key={convo.id}
                onClick={() => setSelectedId(convo.id)}
                className={`w-full flex items-start gap-3 px-3 py-3 hover:bg-muted/50 transition-colors border-b border-border/30 text-left ${selectedId === convo.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
              >
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                    {(convo.contact?.name || convo.waId || "?").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-medium text-sm text-foreground truncate">
                      {convo.contact?.name || convo.waId}
                    </span>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                      {convo.lastMessageAt ? formatTime(convo.lastMessageAt) : ""}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground truncate">{convo.lastMessageText || "No messages"}</p>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      {convo.unreadCount > 0 && (
                        <span className="w-4 h-4 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-bold">
                          {convo.unreadCount}
                        </span>
                      )}
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusColors[convo.status] || "bg-gray-100 text-gray-600"}`}>
                        {convo.status}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message thread */}
      {selectedId ? (
        <div className="flex-1 flex flex-col bg-[oklch(0.97_0.01_150)]">
          {/* Thread header */}
          <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-border/50">
            <div className="flex items-center gap-3">
              <button
                className="md:hidden p-1.5 rounded-lg hover:bg-muted transition-colors"
                onClick={() => setSelectedId(null)}
              >
                ←
              </button>
              <Avatar className="w-9 h-9">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {(selected?.contact?.name || selected?.waId || "?").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm text-foreground">{selected?.contact?.name || selected?.waId}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {selected?.waId}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={selected?.status}
                onValueChange={(v: any) => updateStatus.mutate({ id: selectedId, status: v })}
              >
                <SelectTrigger className="h-7 w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="bot">Bot</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">No messages in this conversation</p>
              </div>
            ) : (
              messages.map((msg: any) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[70%] ${msg.direction === "outbound" ? "msg-bubble-out" : "msg-bubble-in"} px-4 py-2.5`}>
                    {(msg.isAutoReply || msg.isBotMessage) && (
                      <div className={`flex items-center gap-1 text-xs mb-1 ${msg.direction === "outbound" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        <Bot className="w-3 h-3" />
                        {msg.isBotMessage ? "FAQ Bot" : "Auto-Reply"}
                      </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${msg.direction === "outbound" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {format(new Date(msg.createdAt), "HH:mm")}
                      {msg.direction === "outbound" && (
                        msg.status === "read" ? <CheckCheck className="w-3 h-3" /> :
                        msg.status === "delivered" ? <CheckCheck className="w-3 h-3 opacity-60" /> :
                        <Clock className="w-3 h-3 opacity-60" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          <div className="p-3 bg-white border-t border-border/50">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!message.trim() || sendMessage.isPending}
                size="sm"
                className="px-4"
              >
                {sendMessage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-[oklch(0.97_0.01_150)]">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-1">Select a conversation</h3>
            <p className="text-sm text-muted-foreground">Choose a conversation from the left to view messages</p>
          </div>
        </div>
      )}
    </div>
  );
}
