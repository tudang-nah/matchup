import Types "../types/common";
import Map "mo:core/Map";
import Set "mo:core/Set";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

mixin (
  profiles    : Map.Map<Principal, Types.UserProfile>,
  userMatches : Map.Map<Principal, Set.Set<Principal>>,
  messages    : Map.Map<Text, Types.Message>,
  idCounter   : { var value : Nat },
) {

  public shared ({ caller }) func registerMe() : async () {
    if (profiles.get(caller) == null) {
      profiles.add(caller, { name = ""; bio = ""; avatarUrl = ""; skills = [] });
    };
  };

  public query ({ caller }) func getMyProfile() : async ?Types.UserProfile {
    profiles.get(caller);
  };

  public shared ({ caller }) func updateMyProfile(
    name      : Text,
    bio       : Text,
    avatarUrl : Text,
    skills    : [Text],
  ) : async () {
    // Auto-register if not yet registered
    let current = switch (profiles.get(caller)) {
      case (?p) { p };
      case null { { name = ""; bio = ""; avatarUrl = ""; skills = [] } };
    };
    profiles.add(caller, { current with name; bio; avatarUrl; skills });
  };

  public query func getAllProfiles() : async [Types.ProfileEntry] {
    profiles.entries().map<(Principal, Types.UserProfile), Types.ProfileEntry>(
      func((owner, profile)) { { owner; profile } }
    ).toArray();
  };

  public shared ({ caller }) func matchWithUser(target : Principal) : async () {
    // Add target to caller's match set
    switch (userMatches.get(caller)) {
      case null {
        let s = Set.empty<Principal>();
        s.add(target);
        userMatches.add(caller, s);
      };
      case (?s) { s.add(target) };
    };
  };

  public query ({ caller }) func getMyMatches() : async [Types.MatchEntry] {
    switch (userMatches.get(caller)) {
      case null { [] };
      case (?mySet) {
        mySet.values().filterMap<Principal, Types.MatchEntry>(
          func(matched) {
            switch (profiles.get(matched)) {
              case null { null };
              case (?profile) {
                let mutual : Bool = switch (userMatches.get(matched)) {
                  case null { false };
                  case (?theirSet) { theirSet.contains(caller) };
                };
                ?{ matched; profile; mutual };
              };
            };
          }
        ).toArray();
      };
    };
  };

  public shared ({ caller }) func sendMessage(to : Principal, text : Text) : async Text {
    idCounter.value += 1;
    let id = idCounter.value.toText();
    let msg : Types.Message = {
      id;
      from      = caller;
      to;
      text;
      createdAt = Time.now();
    };
    messages.add(id, msg);
    id;
  };

  public query ({ caller }) func getMessages(withUser : Principal) : async [Types.Message] {
    messages.values().filter(
      func(m) {
        (Principal.equal(m.from, caller) and Principal.equal(m.to, withUser))
        or (Principal.equal(m.from, withUser) and Principal.equal(m.to, caller))
      }
    ).toArray();
  };
};
