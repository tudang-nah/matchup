import Types "../types/common";
import MatchLib "../lib/matches";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

mixin (
  matches   : Map.Map<Text, Types.Match>,
  profiles  : Map.Map<Principal, Types.UserProfile>,
  idCounter : { var value : Nat },
) {

  public shared ({ caller }) func createMatch(
    sport        : Text,
    title        : Text,
    time         : Text,
    location     : Text,
    missing      : Int,
    requirements : ?Text,
  ) : async Text {
    idCounter.value += 1;
    let id = idCounter.value.toText();
    MatchLib.createMatch(matches, profiles, caller, id, sport, title, time, location, missing, requirements);
  };

  public query func getAllMatches() : async [Types.MatchPublic] {
    matches.values().map<Types.Match, Types.MatchPublic>(func(m) { MatchLib.toPublicMatch(m) }).toArray();
  };

  public shared ({ caller }) func deleteMatch(id : Text) : async Types.MatchResult {
    MatchLib.deleteMatch(matches, caller, id);
  };

  public shared ({ caller }) func deleteExpiredMatches(ids : [Text]) : async Nat {
    MatchLib.deleteExpiredMatches(matches, caller, ids);
  };

  public query func searchMatchesBySport(sport : Text) : async [Types.MatchPublic] {
    matches.values().filter(func(m) { m.sport == sport }).map<Types.Match, Types.MatchPublic>(func(m) { MatchLib.toPublicMatch(m) }).toArray();
  };

  public query func searchMatchesByLocation(location : Text) : async [Types.MatchPublic] {
    let loc = location.toLower();
    matches.values().filter(func(m) {
      m.location.toLower().contains(#text (loc))
    }).map<Types.Match, Types.MatchPublic>(func(m) { MatchLib.toPublicMatch(m) }).toArray();
  };

  public shared ({ caller }) func joinMatch(id : Text) : async () {
    MatchLib.joinMatch(matches, caller, id);
  };

  public shared ({ caller }) func leaveMatch(id : Text) : async () {
    MatchLib.leaveMatch(matches, caller, id);
  };

  public query func getMatchParticipants(id : Text) : async [Principal] {
    MatchLib.getParticipants(matches, id);
  };

  public query ({ caller }) func isMatchParticipant(id : Text) : async Bool {
    MatchLib.isParticipant(matches, caller, id);
  };
};
