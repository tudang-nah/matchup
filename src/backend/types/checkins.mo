import Principal "mo:core/Principal";

module {
  // Internal check-in record
  public type CheckIn = {
    matchId   : Text;
    participant : Principal;
    timestamp : Int;
  };

  // Shared-safe check-in for API boundary
  public type CheckInPublic = {
    matchId     : Text;
    participant : Text;   // Principal serialized to Text
    timestamp   : Int;
  };
};
