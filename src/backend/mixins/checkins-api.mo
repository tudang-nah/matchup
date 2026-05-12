import Map "mo:core/Map";
import Types "../types/common";
import CheckInTypes "../types/checkins";
import CheckInsLib "../lib/checkins";

mixin (
  checkIns : Map.Map<Text, Map.Map<Text, Int>>,
  matches  : Map.Map<Text, Types.Match>,
) {
  /// Record that the calling principal has checked in to a match via QR code.
  /// The QR payload is simply the matchId; the frontend generates the QR image.
  public shared ({ caller }) func checkIn(matchId : Text) : async { #ok : Text; #err : Text } {
    CheckInsLib.checkIn(checkIns, matches, matchId, caller);
  };

  /// Returns all check-in records for a match.
  public query func getCheckIns(matchId : Text) : async [CheckInTypes.CheckInPublic] {
    CheckInsLib.getCheckIns(checkIns, matchId);
  };

  /// Returns whether the calling principal has already checked in to a match.
  public shared query ({ caller }) func hasCheckedIn(matchId : Text) : async Bool {
    CheckInsLib.hasCheckedIn(checkIns, matchId, caller);
  };
};
