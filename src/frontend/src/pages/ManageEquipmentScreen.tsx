import { AlertCircle, CheckCircle2, Loader2, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
const homescreenBackground =
  "/assets/homescreenbackground-019d2e4a-c901-72bd-837b-8409f84ded93.jpg";
import { StatusBadge } from "../components/StatusBadge";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useAuth } from "../contexts/AuthContext";
import { ensureUserContext } from "../lib/ensureUserContext";
import {
  type EquipmentRecord,
  type EquipmentStatus,
  type EquipmentType,
  addEquipment,
  getAllEquipment,
  updateEquipment,
} from "../lib/equipmentRegistry";

const formatEquipmentType = (type: string): string => {
  switch (type) {
    case "DIESEL_TUG":
      return "DIESEL TUG";
    case "ELECTRIC_TUG":
      return "ELECTRIC TUG";
    case "STANDUP_PUSHBACK":
      return "STANDUP PUSHBACK";
    case "SITDOWN_PUSHBACK":
      return "SITDOWN PUSHBACK";
    default:
      return type.replace(/_/g, " ");
  }
};

export default function ManageEquipmentScreen({
  onBack,
}: { onBack: () => void }) {
  const { isRefreshing } = useAuth();
  const [equipmentList, setEquipmentList] = useState<EquipmentRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEquipment, setSelectedEquipment] =
    useState<EquipmentRecord | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newEquipmentType, setNewEquipmentType] =
    useState<EquipmentType>("DIESEL_TUG");
  const [newEquipmentId, setNewEquipmentId] = useState("");
  const [newEquipmentLabel, setNewEquipmentLabel] = useState("");
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState(false);
  const [editStatus, setEditStatus] = useState<EquipmentStatus>("AVAILABLE");
  const [editLabel, setEditLabel] = useState("");
  const [editError, setEditError] = useState("");

  const loadEquipment = useCallback(
    () => setEquipmentList(getAllEquipment()),
    [],
  );
  useEffect(() => {
    loadEquipment();
  }, [loadEquipment]);

  const filteredEquipment = equipmentList.filter(
    (eq) =>
      eq.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.label?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAddEquipment = async () => {
    const isValid = await ensureUserContext();
    if (!isValid) {
      toast.error("Session expired.");
      return;
    }
    setAddError("");
    setAddSuccess(false);
    setIsProcessing(true);
    try {
      if (!newEquipmentId.trim()) {
        setAddError("Equipment ID is required");
        return;
      }
      const result = addEquipment({
        id: newEquipmentId.trim().toUpperCase(),
        type: newEquipmentType,
        label: newEquipmentLabel.trim() || undefined,
      });
      if (result.success) {
        setAddSuccess(true);
        setNewEquipmentId("");
        setNewEquipmentLabel("");
        setNewEquipmentType("DIESEL_TUG");
        loadEquipment();
        toast.success("Equipment added successfully");
        setTimeout(() => setAddSuccess(false), 3000);
      } else {
        setAddError(result.error || "Failed to add");
        toast.error(result.error || "Failed to add");
      }
    } catch {
      setAddError("Failed to add equipment");
      toast.error("Failed to add equipment");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenEdit = (eq: EquipmentRecord) => {
    setSelectedEquipment(eq);
    setEditStatus(eq.status);
    setEditLabel(eq.label || "");
    setEditError("");
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedEquipment) return;
    const isValid = await ensureUserContext();
    if (!isValid) {
      toast.error("Session expired.");
      setShowEditDialog(false);
      return;
    }
    setEditError("");
    setIsProcessing(true);
    try {
      const result = updateEquipment(selectedEquipment.id, {
        status: editStatus,
        label: editLabel.trim() || undefined,
      });
      if (result.success) {
        setShowEditDialog(false);
        setSelectedEquipment(null);
        loadEquipment();
        toast.success("Equipment updated");
      } else {
        setEditError(result.error || "Failed to update");
      }
    } catch {
      setEditError("Failed to update equipment");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: `url(${homescreenBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/40 to-black/30 backdrop-blur-[1px]" />
      <div className="relative z-10">
        <header className="bg-card/95 backdrop-blur-sm border-b shadow-lg">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "#0078D2" }}>
                Manage Equipment
              </h1>
              <p className="text-sm text-muted-foreground">
                Add and manage equipment registry
              </p>
            </div>
            <div className="flex items-center gap-4">
              {isRefreshing && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Reconnecting…</span>
                </div>
              )}
              <Button
                variant="outline"
                onClick={onBack}
                data-ocid="manageequipment.back.button"
              >
                ← Back to Admin Menu
              </Button>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6 space-y-6">
          {isProcessing && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>Processing...</AlertDescription>
            </Alert>
          )}
          <Card
            className="border shadow-2xl"
            style={{
              background: "rgba(15,23,42,0.92)",
              borderColor: "rgba(255,255,255,0.18)",
              borderRadius: "16px",
              boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
            }}
          >
            <CardHeader>
              <CardTitle style={{ color: "#ffffff" }}>
                Add New Equipment
              </CardTitle>
              <CardDescription style={{ color: "#cbd5f5" }}>
                Register new equipment in the system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label style={{ color: "#cbd5f5" }}>Equipment Type *</Label>
                  <Select
                    value={newEquipmentType}
                    onValueChange={(v) =>
                      setNewEquipmentType(v as EquipmentType)
                    }
                  >
                    <SelectTrigger data-ocid="manageequipment.type.select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DIESEL_TUG">DIESEL TUG</SelectItem>
                      <SelectItem value="ELECTRIC_TUG">ELECTRIC TUG</SelectItem>
                      <SelectItem value="STANDUP_PUSHBACK">
                        STANDUP PUSHBACK
                      </SelectItem>
                      <SelectItem value="SITDOWN_PUSHBACK">
                        SITDOWN PUSHBACK
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="eq-id" style={{ color: "#cbd5f5" }}>
                    Equipment ID *
                  </Label>
                  <Input
                    data-ocid="manageequipment.id.input"
                    id="eq-id"
                    value={newEquipmentId}
                    onChange={(e) => setNewEquipmentId(e.target.value)}
                    placeholder="e.g., TV0637"
                    disabled={isProcessing}
                  />
                </div>
                <div>
                  <Label htmlFor="eq-label" style={{ color: "#cbd5f5" }}>
                    Label (Optional)
                  </Label>
                  <Input
                    data-ocid="manageequipment.label.input"
                    id="eq-label"
                    value={newEquipmentLabel}
                    onChange={(e) => setNewEquipmentLabel(e.target.value)}
                    placeholder="e.g., Diesel Tug TV0637"
                    disabled={isProcessing}
                  />
                </div>
              </div>
              {addError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{addError}</AlertDescription>
                </Alert>
              )}
              {addSuccess && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Equipment added successfully!
                  </AlertDescription>
                </Alert>
              )}
              <Button
                data-ocid="manageequipment.add.button"
                onClick={handleAddEquipment}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Equipment"
                )}
              </Button>
            </CardContent>
          </Card>
          <Card
            className="border shadow-2xl"
            style={{
              background: "rgba(15,23,42,0.92)",
              borderColor: "rgba(255,255,255,0.18)",
              borderRadius: "16px",
              boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
            }}
          >
            <CardHeader>
              <CardTitle style={{ color: "#ffffff" }}>
                Equipment Registry
              </CardTitle>
              <CardDescription style={{ color: "#cbd5f5" }}>
                {equipmentList.length} items registered
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  data-ocid="manageequipment.search_input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="pl-10"
                />
              </div>
              {filteredEquipment.length === 0 ? (
                <div
                  data-ocid="manageequipment.equipment.empty_state"
                  className="text-center py-12"
                  style={{ color: "#cbd5f5" }}
                >
                  <p>
                    {searchQuery
                      ? "No equipment found"
                      : "No equipment registered"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {filteredEquipment.map((eq, i) => (
                    <button
                      key={eq.id}
                      type="button"
                      data-ocid={`manageequipment.item.${i + 1}`}
                      className="w-full text-left flex items-center justify-between p-4 rounded-lg border hover:bg-white/5 transition-colors"
                      style={{
                        background: "rgba(30,41,59,0.5)",
                        borderColor: "rgba(255,255,255,0.1)",
                      }}
                      onClick={() => handleOpenEdit(eq)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p
                            className="font-semibold"
                            style={{ color: "#ffffff" }}
                          >
                            {eq.id}
                          </p>
                          <Badge variant="outline" style={{ color: "#cbd5f5" }}>
                            {formatEquipmentType(eq.type)}
                          </Badge>
                        </div>
                        {eq.label && (
                          <p className="text-sm" style={{ color: "#cbd5f5" }}>
                            {eq.label}
                          </p>
                        )}
                        <p
                          className="text-xs mt-1"
                          style={{ color: "#cbd5f5" }}
                        >
                          Added: {new Date(eq.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <StatusBadge status={eq.status} />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
        <footer className="py-6 text-center text-sm text-white/90 drop-shadow-lg">
          Built by Jayson James and Ramp Track Systems.
        </footer>
      </div>
      {selectedEquipment && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent
            className="max-w-md"
            style={{
              background: "rgba(15,23,42,0.98)",
              borderColor: "rgba(255,255,255,0.18)",
            }}
          >
            <DialogHeader>
              <DialogTitle style={{ color: "#ffffff" }}>
                Edit Equipment
              </DialogTitle>
              <DialogDescription style={{ color: "#cbd5f5" }}>
                Update details for {selectedEquipment.id}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label style={{ color: "#cbd5f5" }}>Equipment ID</Label>
                <p
                  className="text-lg font-semibold mt-1"
                  style={{ color: "#ffffff" }}
                >
                  {selectedEquipment.id}
                </p>
              </div>
              <div>
                <Label style={{ color: "#cbd5f5" }}>Type</Label>
                <p className="mt-1" style={{ color: "#ffffff" }}>
                  {formatEquipmentType(selectedEquipment.type)}
                </p>
              </div>
              <div>
                <Label htmlFor="edit-label" style={{ color: "#cbd5f5" }}>
                  Label
                </Label>
                <Input
                  data-ocid="manageequipment.edit.label.input"
                  id="edit-label"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  placeholder="Optional label"
                  disabled={isProcessing}
                />
              </div>
              <div>
                <Label style={{ color: "#cbd5f5" }}>Status</Label>
                <Select
                  value={editStatus}
                  onValueChange={(v) => setEditStatus(v as EquipmentStatus)}
                  disabled={isProcessing}
                >
                  <SelectTrigger data-ocid="manageequipment.edit.status.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AVAILABLE">AVAILABLE</SelectItem>
                    <SelectItem value="ASSIGNED">ASSIGNED</SelectItem>
                    <SelectItem value="MAINTENANCE">MAINTENANCE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{editError}</AlertDescription>
                </Alert>
              )}
              <div className="flex gap-2 pt-4">
                <Button
                  data-ocid="manageequipment.edit.cancel.button"
                  onClick={() => setShowEditDialog(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  data-ocid="manageequipment.edit.save.button"
                  onClick={handleSaveEdit}
                  className="flex-1"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
