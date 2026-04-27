export interface ManagerMessage {
  id: string;
  sentBy: string;
  sentByName: string;
  sentTo: string;
  sentToName: string;
  equipmentId?: string;
  message: string;
  sentTimestamp: number;
  status: "AWAITING_ACK" | "ACKNOWLEDGED";
  acknowledgedTimestamp?: number;
  acknowledgedBy?: string;
  acknowledgedByName?: string;
}

const STORAGE_KEY = "ramptrack_manager_messages";

export function loadMessages(): ManagerMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveMessages(messages: ManagerMessage[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

export function sendMessage(
  msg: Omit<ManagerMessage, "id" | "status" | "sentTimestamp">,
): ManagerMessage {
  const newMsg: ManagerMessage = {
    ...msg,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    status: "AWAITING_ACK",
    sentTimestamp: Date.now(),
  };
  const existing = loadMessages();
  saveMessages([newMsg, ...existing]);
  return newMsg;
}

export function getPendingMessagesForUser(username: string): ManagerMessage[] {
  return loadMessages().filter(
    (m) => m.status === "AWAITING_ACK" && m.sentTo === username,
  );
}

export function acknowledgeMessage(
  id: string,
  acknowledgedBy: string,
  acknowledgedByName: string,
): void {
  const messages = loadMessages().map((m) => {
    if (m.id === id) {
      return {
        ...m,
        status: "ACKNOWLEDGED" as const,
        acknowledgedTimestamp: Date.now(),
        acknowledgedBy,
        acknowledgedByName,
      };
    }
    return m;
  });
  saveMessages(messages);
}
