import { MessageSquare, RefreshCw, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import EmptyState from "../components/EmptyState";
import PageTransition from "../components/PageTransition";
import { Button } from "../components/ui/button";
import {
  type ManagerMessage,
  loadMessages,
  sendMessage,
} from "../lib/managerMessages";

const PRESET_MESSAGES = [
  "Please return equipment to the correct designated area.",
  "Please scan equipment back in when finished.",
  "Please scan equipment out before using it.",
  "Equipment appears to be outside the designated area. Please verify and correct.",
  "Please report any equipment issue before check-in.",
  "Reminder: equipment must be clean, fueled, and ready before check-in.",
];

// Agent users only (roles include "agent" but NOT "admin")
const AGENT_USERS = [
  { username: "agent@ramptrack.com", name: "Agent" },
  { username: "operator@demo.com", name: "Demo Agent" },
  { username: "100001", name: "Demo Agent (100001)" },
];

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function StatusBadge({ status }: { status: ManagerMessage["status"] }) {
  const isAck = status === "ACKNOWLEDGED";
  return (
    <span
      className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{
        background: isAck ? "rgba(34,197,94,0.18)" : "rgba(245,158,11,0.18)",
        color: isAck ? "#4ade80" : "#fbbf24",
        border: `1px solid ${isAck ? "rgba(34,197,94,0.35)" : "rgba(245,158,11,0.35)"}`,
      }}
    >
      {isAck ? "Acknowledged" : "Awaiting Acknowledgment"}
    </span>
  );
}

interface Props {
  currentUser: {
    name?: string;
    username: string;
    badge: string;
    roles: string[];
  };
  onBack: () => void;
}

export default function UserMessagesScreen({ currentUser, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<"send" | "history">("send");
  const [selectedAgent, setSelectedAgent] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const [selectedMessage, setSelectedMessage] = useState("");
  const [messages, setMessages] = useState<ManagerMessage[]>([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    setMessages(loadMessages());
  }, []);

  const senderName =
    currentUser.name || currentUser.username || currentUser.badge;

  const agentUser = AGENT_USERS.find((a) => a.username === selectedAgent);

  const handleSend = () => {
    if (!selectedAgent || !selectedMessage || isSending) return;
    setIsSending(true);
    // Brief 500ms intentional delay to feel polished
    setTimeout(() => {
      sendMessage({
        sentBy: currentUser.username,
        sentByName: senderName,
        sentTo: selectedAgent,
        sentToName: agentUser?.name ?? selectedAgent,
        equipmentId: equipmentId.trim() || undefined,
        message: selectedMessage,
      });
      setSelectedAgent("");
      setEquipmentId("");
      setSelectedMessage("");
      setIsSending(false);
      toast.success("Message sent successfully");
      setActiveTab("history");
      setMessages(loadMessages());
    }, 500);
  };

  const handleRefresh = () => {
    setMessages(loadMessages());
  };

  const selectStyle: React.CSSProperties = {
    background: "rgba(30,41,59,0.7)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "#ffffff",
    borderRadius: "10px",
    padding: "12px 14px",
    width: "100%",
    fontSize: "15px",
    outline: "none",
    appearance: "none",
  };

  const inputStyle: React.CSSProperties = {
    background: "rgba(30,41,59,0.7)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "#ffffff",
    borderRadius: "10px",
    padding: "12px 14px",
    width: "100%",
    fontSize: "15px",
    outline: "none",
  };

  const canSend = !!selectedAgent && !!selectedMessage && !isSending;

  return (
    <PageTransition>
      <div
        className="min-h-screen relative"
        style={{
          backgroundImage:
            "url(/assets/homescreenbackground-019d2e4a-c901-72bd-837b-8409f84ded93.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/40 to-black/30 backdrop-blur-[1px]" />
        <div className="relative z-10 flex flex-col min-h-screen">
          {/* Header */}
          <header
            className="border-b shadow-lg"
            style={{
              background: "rgba(15,23,42,0.95)",
              borderColor: "rgba(255,255,255,0.12)",
            }}
          >
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  onClick={onBack}
                  data-ocid="user_messages.back_button"
                  className="rounded-lg border text-white transition-colors hover:bg-[rgba(0,120,210,0.25)]"
                  style={{
                    background: "rgba(10,20,50,0.75)",
                    borderColor: "rgba(0,120,210,0.4)",
                  }}
                >
                  ← Back
                </Button>
                <div className="flex items-center gap-2">
                  <MessageSquare
                    className="h-5 w-5"
                    style={{ color: "#0078D2" }}
                  />
                  <h1
                    className="text-2xl font-bold"
                    style={{ color: "#0078D2" }}
                  >
                    User Messages
                  </h1>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 container mx-auto px-4 py-6 max-w-2xl space-y-5">
            {/* Tabs */}
            <div
              className="flex rounded-xl overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.12)" }}
            >
              <button
                type="button"
                data-ocid="user_messages.send_tab"
                onClick={() => setActiveTab("send")}
                className="flex-1 py-3 text-sm font-semibold transition-all"
                style={{
                  background:
                    activeTab === "send"
                      ? "rgba(0,120,210,0.25)"
                      : "rgba(15,23,42,0.7)",
                  color: activeTab === "send" ? "#60b4ff" : "#94a3b8",
                  borderRight: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                Send Message
              </button>
              <button
                type="button"
                data-ocid="user_messages.history_tab"
                onClick={() => {
                  setActiveTab("history");
                  setMessages(loadMessages());
                }}
                className="flex-1 py-3 text-sm font-semibold transition-all"
                style={{
                  background:
                    activeTab === "history"
                      ? "rgba(0,120,210,0.25)"
                      : "rgba(15,23,42,0.7)",
                  color: activeTab === "history" ? "#60b4ff" : "#94a3b8",
                }}
              >
                Message History
              </button>
            </div>

            {/* SEND TAB */}
            {activeTab === "send" && (
              <div
                className="rounded-2xl p-5 space-y-5"
                style={{
                  background: "rgba(15,23,42,0.92)",
                  border: "1px solid rgba(255,255,255,0.14)",
                }}
              >
                <h2 className="text-lg font-semibold text-white">
                  Send a Reminder Notice
                </h2>

                {/* Agent select */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="msg-agent-select"
                    className="text-sm font-medium"
                    style={{ color: "#94a3b8" }}
                  >
                    Select Agent <span style={{ color: "#f87171" }}>*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="msg-agent-select"
                      data-ocid="user_messages.agent.select"
                      value={selectedAgent}
                      onChange={(e) => setSelectedAgent(e.target.value)}
                      style={selectStyle}
                    >
                      <option value="" style={{ background: "#0f172a" }}>
                        — Choose an agent —
                      </option>
                      {AGENT_USERS.map((a) => (
                        <option
                          key={a.username}
                          value={a.username}
                          style={{ background: "#0f172a" }}
                        >
                          {a.name} ({a.username})
                        </option>
                      ))}
                    </select>
                    <svg
                      className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>

                {/* Equipment ID (optional) */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="msg-equip-id"
                    className="text-sm font-medium"
                    style={{ color: "#94a3b8" }}
                  >
                    Equipment ID{" "}
                    <span className="text-xs" style={{ color: "#64748b" }}>
                      (optional)
                    </span>
                  </label>
                  <input
                    id="msg-equip-id"
                    data-ocid="user_messages.equipment_id.input"
                    type="text"
                    value={equipmentId}
                    onChange={(e) => setEquipmentId(e.target.value)}
                    placeholder="e.g. TV1042"
                    style={inputStyle}
                  />
                </div>

                {/* Preset message */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="msg-preset-select"
                    className="text-sm font-medium"
                    style={{ color: "#94a3b8" }}
                  >
                    Select Message <span style={{ color: "#f87171" }}>*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="msg-preset-select"
                      data-ocid="user_messages.message.select"
                      value={selectedMessage}
                      onChange={(e) => setSelectedMessage(e.target.value)}
                      style={{ ...selectStyle, paddingRight: "36px" }}
                    >
                      <option value="" style={{ background: "#0f172a" }}>
                        — Choose a message —
                      </option>
                      {PRESET_MESSAGES.map((msg) => (
                        <option
                          key={msg}
                          value={msg}
                          style={{ background: "#0f172a" }}
                        >
                          {msg}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                  {selectedMessage && (
                    <p
                      className="text-xs mt-1.5 rounded-lg px-3 py-2"
                      style={{
                        color: "#93c5fd",
                        background: "rgba(0,120,210,0.12)",
                        border: "1px solid rgba(0,120,210,0.2)",
                      }}
                    >
                      {selectedMessage}
                    </p>
                  )}
                </div>

                {/* Send button with loading state */}
                <button
                  type="button"
                  data-ocid="user_messages.send.submit_button"
                  disabled={!canSend}
                  onClick={handleSend}
                  className="w-full py-4 rounded-xl text-white text-base font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                  style={{
                    background: !canSend
                      ? "rgba(30,41,59,0.7)"
                      : "linear-gradient(135deg, #0078D2 0%, #0057a8 100%)",
                    border: !canSend
                      ? "1px solid rgba(255,255,255,0.12)"
                      : "none",
                    color: !canSend ? "#475569" : "#ffffff",
                    cursor: !canSend ? "not-allowed" : "pointer",
                    boxShadow: !canSend
                      ? "none"
                      : "0 4px 16px rgba(0,120,210,0.35)",
                    opacity: isSending ? 0.75 : 1,
                  }}
                >
                  {isSending ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Notice
                    </>
                  )}
                </button>

                {!canSend && !isSending && (
                  <p
                    className="text-center text-xs"
                    style={{ color: "#475569" }}
                  >
                    {!selectedAgent && !selectedMessage
                      ? "Select an agent and a message to send."
                      : !selectedAgent
                        ? "Select an agent."
                        : "Select a message."}
                  </p>
                )}
              </div>
            )}

            {/* HISTORY TAB */}
            {activeTab === "history" && (
              <div
                className="rounded-2xl p-5 space-y-4"
                style={{
                  background: "rgba(15,23,42,0.92)",
                  border: "1px solid rgba(255,255,255,0.14)",
                }}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">
                    Message History
                  </h2>
                  <button
                    type="button"
                    data-ocid="user_messages.refresh.button"
                    onClick={handleRefresh}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all hover:bg-white/10"
                    style={{
                      color: "#94a3b8",
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(30,41,59,0.5)",
                    }}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                  </button>
                </div>

                {messages.length === 0 ? (
                  <EmptyState
                    icon={MessageSquare}
                    title="No messages yet"
                    subtitle="Send a reminder to an agent to get started"
                    data-ocid="user_messages.history.empty_state"
                  />
                ) : (
                  <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                    {messages.map((msg, i) => (
                      <div
                        key={msg.id}
                        data-ocid={`user_messages.history.item.${i + 1}`}
                        className="rounded-xl p-4 space-y-2"
                        style={{
                          background: "rgba(30,41,59,0.6)",
                          border: "1px solid rgba(255,255,255,0.10)",
                        }}
                      >
                        {/* Top row: status + time */}
                        <div className="flex items-start justify-between gap-2">
                          <StatusBadge status={msg.status} />
                          <span
                            className="text-xs"
                            style={{ color: "#64748b" }}
                          >
                            {formatTime(msg.sentTimestamp)}
                          </span>
                        </div>

                        {/* From / To */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs" style={{ color: "#64748b" }}>
                              Sent by
                            </p>
                            <p className="text-sm font-medium text-white">
                              {msg.sentByName}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs" style={{ color: "#64748b" }}>
                              Sent to
                            </p>
                            <p className="text-sm font-medium text-white">
                              {msg.sentToName}
                            </p>
                          </div>
                        </div>

                        {/* Equipment ID */}
                        <div>
                          <p className="text-xs" style={{ color: "#64748b" }}>
                            Equipment ID
                          </p>
                          <p
                            className="text-sm font-mono"
                            style={{
                              color: msg.equipmentId ? "#fbbf24" : "#475569",
                            }}
                          >
                            {msg.equipmentId ?? "—"}
                          </p>
                        </div>

                        {/* Message */}
                        <div>
                          <p className="text-xs" style={{ color: "#64748b" }}>
                            Message
                          </p>
                          <p className="text-sm" style={{ color: "#cbd5f5" }}>
                            {msg.message}
                          </p>
                        </div>

                        {/* Acknowledged info */}
                        {msg.status === "ACKNOWLEDGED" &&
                          msg.acknowledgedTimestamp && (
                            <div
                              className="rounded-lg px-3 py-2 grid grid-cols-2 gap-2"
                              style={{
                                background: "rgba(34,197,94,0.08)",
                                border: "1px solid rgba(34,197,94,0.2)",
                              }}
                            >
                              <div>
                                <p
                                  className="text-xs"
                                  style={{ color: "#64748b" }}
                                >
                                  Acknowledged by
                                </p>
                                <p
                                  className="text-sm font-medium"
                                  style={{ color: "#4ade80" }}
                                >
                                  {msg.acknowledgedByName ?? msg.acknowledgedBy}
                                </p>
                              </div>
                              <div>
                                <p
                                  className="text-xs"
                                  style={{ color: "#64748b" }}
                                >
                                  Acknowledged at
                                </p>
                                <p
                                  className="text-sm"
                                  style={{ color: "#4ade80" }}
                                >
                                  {formatTime(msg.acknowledgedTimestamp)}
                                </p>
                              </div>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>

          <footer className="py-6 text-center text-sm text-white/90 drop-shadow-lg">
            © Jayson James &amp; Ramp Track Systems
          </footer>
        </div>
      </div>
    </PageTransition>
  );
}
