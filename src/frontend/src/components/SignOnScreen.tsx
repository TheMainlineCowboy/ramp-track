import { useEffect, useState } from "react";

const agentLogin =
  "/assets/agentlogin-019d2e49-69e7-73fe-8172-a52b87efe1eb.png";
const signInBackgroundLower =
  "/assets/signinbackgroundlower-019d2e4a-fc0d-77ac-8d6b-f27f72365149.jpg";
const managementLogin =
  "/assets/managementlogin-019d2e4a-4e21-770e-83b4-0b2873150efd.png";

interface CurrentUser {
  username: string;
  roles: string[];
}

interface SignOnScreenProps {
  currentUser: CurrentUser | null;
  onAgentLogin: () => void;
  onAdminLogin: () => void;
  onBack: () => void;
}

export default function SignOnScreen({
  currentUser,
  onAgentLogin,
  onAdminLogin,
  onBack,
}: SignOnScreenProps) {
  // Dark fallback is always shown immediately; bgReady controls when buttons become visible
  const [bgReady, setBgReady] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      onBack();
      return;
    }
    // Preload the background image so buttons only appear once layout is settled
    const img = new Image();
    img.src = signInBackgroundLower;
    img.onload = () => setBgReady(true);
    // If somehow image fails to load, still show buttons after a short delay
    img.onerror = () => setBgReady(true);
  }, [currentUser, onBack]);

  if (!currentUser) return null;

  const hasAdminRole = currentUser.roles.includes("admin");
  const isAgentOnly =
    currentUser.roles.length === 1 && currentUser.roles[0] === "agent";

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center p-6"
      style={{
        // Always-dark fallback — eliminates white flash before image loads
        backgroundColor: "#030816",
        backgroundImage: bgReady ? `url(${signInBackgroundLower})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Buttons are hidden until the background image is ready to prevent layout jump */}
      <div
        style={{
          opacity: bgReady ? 1 : 0,
          transition: bgReady ? "opacity 150ms ease-in" : "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
        }}
      >
        <button
          type="button"
          onClick={onAgentLogin}
          className="w-[60%] max-w-[260px] transition-transform active:scale-95 hover:scale-105 focus:outline-none"
          aria-label="Agent"
          data-ocid="signon.agent.button"
        >
          <img src={agentLogin} alt="Agent" className="w-full h-auto" />
        </button>

        {!isAgentOnly && hasAdminRole && (
          <button
            type="button"
            onClick={onAdminLogin}
            className="w-[60%] max-w-[260px] transition-transform active:scale-95 hover:scale-105 focus:outline-none"
            aria-label="Management"
            data-ocid="signon.management.button"
          >
            <img
              src={managementLogin}
              alt="Management"
              className="w-full h-auto"
            />
          </button>
        )}

        <button
          type="button"
          onClick={onBack}
          className="mt-4 px-6 py-3 rounded-lg border text-white transition-colors hover:bg-[rgba(0,120,210,0.25)]"
          style={{
            background: "rgba(10,20,50,0.75)",
            borderColor: "rgba(0,120,210,0.4)",
          }}
          data-ocid="signon.back.button"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
