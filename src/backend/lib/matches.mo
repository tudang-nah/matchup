import Types "../types/common";
import Map "mo:core/Map";
import Set "mo:core/Set";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

module {
  public func toPublicMatch(m : Types.Match) : Types.MatchPublic {
    {
      id           = m.id;
      sport        = m.sport;
      title        = m.title;
      time         = m.time;
      location     = m.location;
      missing      = m.missing;
      createdAt    = m.createdAt;
      requirements = m.requirements;
      creator      = m.creator;
      participants = m.participants.toArray();
    };
  };

  public func createMatch(
    matches      : Map.Map<Text, Types.Match>,
    profiles     : Map.Map<Principal, Types.UserProfile>,
    caller       : Principal,
    id           : Text,
    sport        : Text,
    title        : Text,
    time         : Text,
    location     : Text,
    missing      : Int,
    requirements : ?Text,
  ) : Text {
    // Auto-register caller if not yet in profiles
    if (profiles.get(caller) == null) {
      profiles.add(caller, { name = ""; bio = ""; avatarUrl = ""; skills = [] });
    };
    let participants = Set.empty<Principal>();
    participants.add(caller);
    let m : Types.Match = {
      id;
      sport;
      title;
      time;
      location;
      missing;
      createdAt    = Time.now();
      requirements;
      creator      = caller;
      participants;
    };
    matches.add(id, m);
    id;
  };

  public func deleteMatch(
    matches : Map.Map<Text, Types.Match>,
    caller  : Principal,
    id      : Text,
  ) : Types.MatchResult {
    switch (matches.get(id)) {
      case null { #err("Không tìm thấy trận") };
      case (?m) {
        if (not Principal.equal(m.creator, caller)) {
          #err("Không có quyền xóa trận này");
        } else {
          matches.remove(id);
          #ok;
        };
      };
    };
  };

  public func deleteExpiredMatches(
    matches : Map.Map<Text, Types.Match>,
    _caller  : Principal,
    ids     : [Text],
  ) : Nat {
    var count : Nat = 0;
    for (id in ids.values()) {
      matches.remove(id);
      count += 1;
    };
    count;
  };

  public func joinMatch(
    matches : Map.Map<Text, Types.Match>,
    caller  : Principal,
    id      : Text,
  ) : () {
    switch (matches.get(id)) {
      case null { };
      case (?m) {
        if (not m.participants.contains(caller)) {
          m.participants.add(caller);
        };
      };
    };
  };

  public func leaveMatch(
    matches : Map.Map<Text, Types.Match>,
    caller  : Principal,
    id      : Text,
  ) : () {
    switch (matches.get(id)) {
      case null { };
      case (?m) {
        m.participants.remove(caller);
      };
    };
  };

  public func getParticipants(
    matches : Map.Map<Text, Types.Match>,
    id      : Text,
  ) : [Principal] {
    switch (matches.get(id)) {
      case null { [] };
      case (?m) { m.participants.toArray() };
    };
  };

  public func isParticipant(
    matches : Map.Map<Text, Types.Match>,
    caller  : Principal,
    id      : Text,
  ) : Bool {
    switch (matches.get(id)) {
      case null { false };
      case (?m) { m.participants.contains(caller) };
    };
  };
};
