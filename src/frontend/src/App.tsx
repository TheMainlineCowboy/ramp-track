import { useEffect, useRef, useState } from "react";
import { Toaster } from "sonner";
import ErrorBoundary from "./components/ErrorBoundary";
import RTSIntroScreen from "./components/RTSIntroScreen";
import SignOnScreen from "./components/SignOnScreen";
import SplashScreen from "./components/SplashScreen";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AdminMenuScreen from "./pages/AdminMenuScreen";
import CheckInScreen from "./pages/CheckInScreen";
import CheckOutScreen from "./pages/CheckOutScreen";
import EquipmentDetailScreen from "./pages/EquipmentDetailScreen";
import EquipmentMapScreen from "./pages/EquipmentMapScreen";
import LandingScreen from "./pages/LandingScreen";
import ManageEquipmentScreen from "./pages/ManageEquipmentScreen";
import OperatorHomeScreen from "./pages/OperatorHomeScreen";
import ReportIssueScreen from "./pages/ReportIssueScreen";
import SignInScreen from "./pages/SignInScreen";
import UserMessagesScreen from "./pages/UserMessagesScreen";

type View =
  | "rts-intro"
  | "splash"
  | "landing"
  | "signin"
  | "signon"
  | "operator-home"
  | "checkout"
  | "checkin"
  | "report-issue"
  | "admin-menu"
  | "manage-equipment"
  | "equipment-detail"
  | "equipment-map"
  | "user-messages";

function AppContent() {
  const { auth, logout } = useAuth();
  const [view, setView] = useState<View>("rts-intro");
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(
    null,
  );
  // Target equipment to center on when opening the Equipment Map
  const [equipmentMapTarget, setEquipmentMapTarget] = useState<
    string | undefined
  >(undefined);
  const authRef = useRef(auth);
  authRef.current = auth;

  useEffect(() => {
    // Skip the splash timer if we're still on the RTS intro — intro handles the transition
    if (view !== "splash") return;
    const t = setTimeout(() => {
      const currentAuth = authRef.current;
      if (currentAuth) {
        setView(
          currentAuth.roles?.includes("admin") ? "admin-menu" : "operator-home",
        );
      } else {
        setView("landing");
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [view]);

  // Skip redirect to signin when on intro, splash or landing
  useEffect(() => {
    if (view === "rts-intro" || view === "splash" || view === "landing") return;
    if (!auth) {
      setView("signin");
    }
  }, [auth, view]);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "") as View;
      if (hash && hash !== view) setView(hash);
    };
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, [view]);

  const navigate = (v: View) => {
    window.location.hash = v;
    setView(v);
  };

  const handleLogout = () => {
    logout();
    navigate("signin");
  };

  // Navigate to equipment map, optionally centering on a specific equipment
  const handleViewMap = (equipmentId?: string) => {
    setEquipmentMapTarget(equipmentId);
    navigate("equipment-map");
  };

  // RTS intro and splash/landing never get page transitions — they are part of the launch sequence
  if (view === "rts-intro") {
    return (
      <RTSIntroScreen
        onComplete={() => {
          if (authRef.current) {
            setView(
              authRef.current.roles?.includes("admin")
                ? "admin-menu"
                : "operator-home",
            );
          } else {
            setView("landing");
          }
        }}
      />
    );
  }

  if (view === "splash") return <SplashScreen />;

  if (view === "landing") {
    return <LandingScreen onLogin={() => navigate("signin")} />;
  }

  if (!auth) {
    return (
      <SignInScreen
        onLoginSuccess={() => {
          navigate("signon");
        }}
      />
    );
  }

  const renderView = () => {
    switch (view) {
      case "signon":
        return (
          <SignOnScreen
            currentUser={auth}
            onAgentLogin={() => navigate("operator-home")}
            onAdminLogin={() => navigate("admin-menu")}
            onBack={() => navigate("signin")}
          />
        );
      case "operator-home":
        return (
          <OperatorHomeScreen
            currentUser={auth}
            onCheckOut={() => navigate("checkout")}
            onCheckIn={() => navigate("checkin")}
            onReportIssue={() => navigate("report-issue")}
            onLogout={handleLogout}
            onBack={() => navigate("signon")}
          />
        );
      case "checkout":
        return (
          <CheckOutScreen
            currentUser={auth}
            onBack={() => navigate("operator-home")}
          />
        );
      case "checkin":
        return (
          <CheckInScreen
            currentUser={auth}
            onBack={() => navigate("operator-home")}
          />
        );
      case "report-issue":
        return (
          <ReportIssueScreen
            currentUser={auth}
            onBack={() => navigate("operator-home")}
          />
        );
      case "admin-menu":
        return (
          <AdminMenuScreen
            currentUser={auth}
            onManageEquipment={() => navigate("manage-equipment")}
            onViewEquipment={(id) => {
              setSelectedEquipmentId(id);
              navigate("equipment-detail");
            }}
            onViewMap={handleViewMap}
            onUserMessages={() => navigate("user-messages")}
            onBack={() => navigate("signon")}
            onLogout={handleLogout}
          />
        );
      case "manage-equipment":
        return <ManageEquipmentScreen onBack={() => navigate("admin-menu")} />;
      case "equipment-detail":
        return (
          <EquipmentDetailScreen
            equipmentId={selectedEquipmentId || ""}
            onBack={() => navigate("admin-menu")}
            onViewEquipmentMap={(equipmentId) => handleViewMap(equipmentId)}
          />
        );
      case "equipment-map":
        if (!auth.roles?.includes("admin")) {
          navigate("admin-menu");
          return null;
        }
        return (
          <EquipmentMapScreen
            currentUser={auth}
            onBack={() => {
              setEquipmentMapTarget(undefined);
              navigate("admin-menu");
            }}
            onViewEquipmentDetail={(id) => {
              setSelectedEquipmentId(id);
              navigate("equipment-detail");
            }}
            initialEquipmentId={equipmentMapTarget}
          />
        );
      case "user-messages":
        if (!auth.roles?.includes("admin")) {
          navigate("admin-menu");
          return null;
        }
        return (
          <UserMessagesScreen
            currentUser={auth}
            onBack={() => navigate("admin-menu")}
          />
        );
      default:
        return null;
    }
  };

  return <>{renderView()}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
        <Toaster
          position="bottom-center"
          theme="dark"
          richColors
          toastOptions={{ duration: 3000 }}
        />
      </AuthProvider>
    </ErrorBoundary>
  );
}
