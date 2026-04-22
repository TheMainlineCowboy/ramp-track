import { ScanLine } from "lucide-react";
import { useState } from "react";
const homescreenBackground =
  "/assets/homescreenbackground-019d2e4a-c901-72bd-837b-8409f84ded93.jpg";
import BarcodeScanner from "../components/BarcodeScanner";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuth } from "../contexts/AuthContext";

export default function SignInScreen({
  onLoginSuccess,
}: { onLoginSuccess?: (roles: string[]) => void }) {
  const { login, badgeLogin, auth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email/ID and password");
      return;
    }
    setIsLoggingIn(true);
    setError("");
    try {
      await login({ username: email, password, badge: email });
      // login() throws on failure; if we reach here, auth succeeded
      // roles are available from AuthContext after login resolves
      if (onLoginSuccess) {
        // We don't have the roles here directly, but App.tsx reads from auth state
        // Pass empty array — App.tsx ignores the argument and navigates based on auth
        onLoginSuccess([]);
      }
    } catch (err: unknown) {
      setError((err as Error).message || "Login failed.");
      setIsLoggingIn(false);
    }
  };

  const handleBadgeScan = async (badgeId: string) => {
    setScannerOpen(false);
    setIsLoggingIn(true);
    setError("");
    try {
      await badgeLogin(badgeId);
      const roles =
        badgeId === "970251" || badgeId === "97025101"
          ? ["admin", "agent"]
          : ["agent"];
      if (onLoginSuccess) {
        onLoginSuccess(roles);
      }
    } catch (err: unknown) {
      setError((err as Error).message || "Badge login failed.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (auth) return null;

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url(${homescreenBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      {scannerOpen && (
        <BarcodeScanner
          mode="badge"
          onResult={handleBadgeScan}
          onClose={() => setScannerOpen(false)}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/60 to-black/50 backdrop-blur-[2px]" />
      <div className="relative z-10 w-full max-w-md">
        <Card className="bg-card/95 backdrop-blur-xl shadow-2xl border-2">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                <div className="h-12 w-12 rounded-full bg-primary/40 flex items-center justify-center">
                  <div className="h-8 w-8 rounded-full bg-primary" />
                </div>
              </div>
            </div>
            <CardTitle
              className="text-3xl font-bold"
              style={{ color: "#0078D2" }}
            >
              Ramp Track
            </CardTitle>
            <CardDescription className="text-base">
              Airport Ground Equipment Tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Employee ID / Email</Label>
                <Input
                  data-ocid="signin.email.input"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoggingIn}
                  placeholder="Enter your ID or email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  data-ocid="signin.password.input"
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoggingIn}
                  placeholder="Enter your password"
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>
              {error && (
                <div
                  data-ocid="signin.error_state"
                  className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 p-3 rounded-lg"
                >
                  {error}
                </div>
              )}
              <Button
                data-ocid="signin.submit_button"
                className="w-full"
                size="lg"
                onClick={handleLogin}
                disabled={isLoggingIn || !email || !password}
              >
                {isLoggingIn ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Logging in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
              <Button
                data-ocid="signin.scan.button"
                variant="outline"
                className="w-full"
                size="lg"
                onClick={() => setScannerOpen(true)}
                disabled={isLoggingIn}
              >
                <ScanLine className="mr-2 h-5 w-5" />
                Scan Badge
              </Button>
            </div>
            <div className="text-center text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
              <p className="font-medium mb-1">Demo Credentials:</p>
              <p className="font-mono text-xs">
                Agent: agent@ramptrack.com / test123
              </p>
              <p className="font-mono text-xs mt-1">
                Management: Employee ID / admin123
              </p>
            </div>
          </CardContent>
        </Card>
        <div className="mt-6 text-center text-sm text-white/90 drop-shadow-lg">
          © Jayson James & Ramp Track Systems
        </div>
      </div>
    </div>
  );
}
