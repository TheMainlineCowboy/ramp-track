import { useEffect, useState } from "react";
import checkInIcon from "../assets/Check_In_Icon.png";
import checkOutIcon from "../assets/Check_Out_Icon.png";
import reportIssueIcon from "../assets/Report_Issue_Icon.png";
import ManagerNoticeModal from "../components/ManagerNoticeModal";
import {
  type ManagerMessage,
  acknowledgeMessage,
  getPendingMessagesForUser,
} from "../lib/managerMessages";

function formatUserDisplayName(user: {
  name?: string;
  username: string;
  badge: string;
}) {
  const raw = user.name || user.username || user.badge || "";
  if (!raw) return "";
  const parts = raw.trim().split(/\s+/);
  if (parts.length >= 2) {
    const first = parts[0];
    const last = parts[parts.length - 1];
    if (/[a-zA-Z]/.test(first)) {
      return first;
    }
    return `${first.charAt(0).toUpperCase()}. ${last}`;
  }
  return raw;
}

export default function OperatorHomeScreen({
  onCheckOut,
  onCheckIn,
  onReportIssue,
  onLogout,
  onBack,
  currentUser,
}: {
  onCheckOut: () => void;
  onCheckIn: () => void;
  onReportIssue: () => void;
  onLogout: () => void;
  onBack: () => void;
  currentUser: {
    name?: string;
    username: string;
    badge: string;
    roles: string[];
  };
}) {
  const [pendingMessages, setPendingMessages] = useState<ManagerMessage[]>([]);

  useEffect(() => {
    const pending = getPendingMessagesForUser(currentUser.username);
    setPendingMessages(pending);
  }, [currentUser.username]);

  const handleAcknowledge = (id: string) => {
    const displayName = currentUser.name || currentUser.username;
    acknowledgeMessage(id, currentUser.username, displayName);
    setPendingMessages((prev) => prev.filter((m) => m.id !== id));
  };

  return (
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
      <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-black/30 to-black/20" />
      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="bg-card/90 backdrop-blur-sm border-b shadow-lg">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                data-ocid="home.back.button"
                onClick={onBack}
                className="px-3 py-2 rounded-lg border transition-colors text-sm font-medium text-white hover:bg-[rgba(0,120,210,0.25)]"
                style={{
                  background: "rgba(10,20,50,0.75)",
                  borderColor: "rgba(0,120,210,0.4)",
                }}
              >
                ← Back
              </button>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: "#0078D2" }}>
                  Ramp Track
                </h1>
                <p className="text-sm text-muted-foreground">
                  {formatUserDisplayName(currentUser)}
                </p>
              </div>
            </div>
            <button
              type="button"
              data-ocid="home.logout.button"
              onClick={onLogout}
              className="px-4 py-2 rounded-lg border transition-colors text-sm font-medium text-white hover:bg-[rgba(0,120,210,0.25)]"
              style={{
                background: "rgba(10,20,50,0.75)",
                borderColor: "rgba(0,120,210,0.4)",
              }}
            >
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          <div className="text-center mb-4">
            <h2 className="text-3xl font-bold text-white drop-shadow-lg">
              What would you like to do?
            </h2>
            <p className="text-white/80 mt-2 drop-shadow">
              Select an action below
            </p>
          </div>
          <div className="flex flex-col items-center gap-5 w-full max-w-sm">
            {/* Take Equipment */}
            <button
              type="button"
              data-ocid="home.checkout.button"
              onClick={onCheckOut}
              className="w-[60%] max-w-[260px] transition-transform active:scale-95 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500/50 rounded-2xl"
              aria-label="Take Equipment"
            >
              <img
                src={checkOutIcon}
                alt="Take Equipment"
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
            </button>
            {/* Return Equipment */}
            <button
              type="button"
              data-ocid="home.checkin.button"
              onClick={onCheckIn}
              className="w-[60%] max-w-[260px] transition-transform active:scale-95 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-500/50 rounded-2xl"
              aria-label="Return Equipment"
            >
              <img
                src={checkInIcon}
                alt="Return Equipment"
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
            </button>
            {/* Report Issue */}
            <button
              type="button"
              data-ocid="home.reportissue.button"
              onClick={onReportIssue}
              className="w-[60%] max-w-[260px] transition-transform active:scale-95 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-orange-500/50 rounded-2xl"
              aria-label="Report Issue"
            >
              <img
                src={reportIssueIcon}
                alt="Report Issue"
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
            </button>
          </div>
        </main>
        <footer className="py-6 text-center text-sm text-white/90 drop-shadow-lg">
          © Jayson James & Ramp Track Systems
        </footer>
      </div>

      {/* Manager notice modal — shown on top of everything, not dismissible */}
      {pendingMessages.length > 0 && (
        <ManagerNoticeModal
          message={pendingMessages[0]}
          currentUser={currentUser}
          onAcknowledge={handleAcknowledge}
        />
      )}
    </div>
  );
}
