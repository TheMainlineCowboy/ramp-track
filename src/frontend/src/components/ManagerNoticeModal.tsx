import type { ManagerMessage } from "../lib/managerMessages";

const PRESET_MESSAGES = [
  "Please return equipment to the correct designated area.",
  "Please scan equipment back in when finished.",
  "Please scan equipment out before using it.",
  "Equipment appears to be outside the designated area. Please verify and correct.",
  "Please report any equipment issue before check-in.",
  "Reminder: equipment must be clean, fueled, and ready before check-in.",
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

interface Props {
  message: ManagerMessage;
  currentUser: {
    name?: string;
    username: string;
    badge: string;
    roles: string[];
  };
  onAcknowledge: (id: string) => void;
}

export default function ManagerNoticeModal({ message, onAcknowledge }: Props) {
  const isPreset = PRESET_MESSAGES.includes(message.message);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.78)" }}
      data-ocid="manager_notice.dialog"
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col gap-5"
        style={{
          background: "rgba(15,23,42,0.97)",
          border: "1px solid rgba(0,120,210,0.45)",
          boxShadow: "0 0 40px rgba(0,120,210,0.18)",
        }}
      >
        {/* Title */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(0,120,210,0.2)",
              border: "1.5px solid #0078D2",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0078D2"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              role="img"
            >
              <title>Notice</title>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold" style={{ color: "#0078D2" }}>
            Manager Notice
          </h2>
        </div>

        {/* Fields */}
        <div
          className="rounded-xl p-4 space-y-3"
          style={{
            background: "rgba(30,41,59,0.7)",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "#64748b" }}
            >
              From
            </p>
            <p className="text-sm font-medium text-white mt-0.5">
              {message.sentByName}
            </p>
          </div>

          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "#64748b" }}
            >
              Message
            </p>
            <p
              className="text-base font-semibold mt-1 leading-snug"
              style={{ color: isPreset ? "#93c5fd" : "#e2e8f0" }}
              data-ocid="manager_notice.message_text"
            >
              {message.message}
            </p>
          </div>

          {message.equipmentId && (
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "#64748b" }}
              >
                Equipment ID
              </p>
              <p
                className="text-sm font-mono font-semibold mt-0.5"
                style={{ color: "#fbbf24" }}
              >
                {message.equipmentId}
              </p>
            </div>
          )}

          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "#64748b" }}
            >
              Sent
            </p>
            <p className="text-sm mt-0.5" style={{ color: "#94a3b8" }}>
              {formatTime(message.sentTimestamp)}
            </p>
          </div>
        </div>

        {/* Acknowledge button */}
        <button
          type="button"
          data-ocid="manager_notice.confirm_button"
          onClick={() => onAcknowledge(message.id)}
          className="w-full py-4 rounded-xl text-white text-base font-bold transition-all active:scale-95 hover:brightness-110"
          style={{
            background: "linear-gradient(135deg, #0078D2 0%, #0057a8 100%)",
            boxShadow: "0 4px 18px rgba(0,120,210,0.4)",
            letterSpacing: "0.02em",
          }}
        >
          Acknowledge
        </button>

        <p className="text-center text-xs" style={{ color: "#475569" }}>
          You must acknowledge this notice to continue.
        </p>
      </div>
    </div>
  );
}
