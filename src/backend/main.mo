import Principal "mo:base/Principal";

actor {
  public func _initializeAccessControlWithSecret(_token : Text) : async () {
    // No-op: authorization is handled on the frontend via localStorage
  };
}
