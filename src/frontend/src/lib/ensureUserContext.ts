export async function ensureUserContext(): Promise<boolean> {
  return !!localStorage.getItem("ramptrack_auth_state");
}
