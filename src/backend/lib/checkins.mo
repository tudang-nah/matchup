import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Types "../types/common";
import CheckInTypes "../types/checkins";

module {
  // checkIns: matchId -> (principalText -> timestamp)

  /// Returns whether a principal has already checked in to a match.
  public func hasCheckedIn(
    checkIns : Map.Map<Text, Map.Map<Text, Int>>,
    matchId  : Text,
    caller   : Principal,
  ) : Bool {
    switch (checkIns.get(matchId)) {
      case null { false };
      case (?inner) { inner.containsKey(caller.toText()) };
    };
  };

  /// Records a check-in for caller on matchId.
  /// Returns #ok(Text) with confirmation message or #err(Text) on failure.
  public func checkIn(
    checkIns : Map.Map<Text, Map.Map<Text, Int>>,
    matches  : Map.Map<Text, Types.Match>,
    matchId  : Text,
    caller   : Principal,
  ) : { #ok : Text; #err : Text } {
    if (not matches.containsKey(matchId)) {
      return #err("Trận không tồn tại");
    };
    let callerText = caller.toText();
    let inner = switch (checkIns.get(matchId)) {
      case (?m) { m };
      case null {
        let m = Map.empty<Text, Int>();
        checkIns.add(matchId, m);
        m;
      };
    };
    if (inner.containsKey(callerText)) {
      return #err("Bạn đã check-in rồi");
    };
    inner.add(callerText, Time.now());
    #ok("Check-in thành công");
  };

  /// Returns all check-in records for a match as shared-safe public types.
  public func getCheckIns(
    checkIns : Map.Map<Text, Map.Map<Text, Int>>,
    matchId  : Text,
  ) : [CheckInTypes.CheckInPublic] {
    switch (checkIns.get(matchId)) {
      case null { [] };
      case (?inner) {
        inner.entries()
          .map(func((p, ts)) {
            { matchId; participant = p; timestamp = ts };
          })
          |> _.toArray();
      };
    };
  };
};
