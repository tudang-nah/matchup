import Types "../types/common";
import RatingTypes "../types/ratings";
import RatingsLib "../lib/ratings";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

mixin (
  ratings  : Map.Map<Text, RatingTypes.PlayerRating>,
  matches  : Map.Map<Text, Types.Match>,
  profiles : Map.Map<Principal, Types.UserProfile>,
) {

  public shared ({ caller }) func ratePlayer(
    matchId        : Text,
    ratedPrincipal : Principal,
    score          : Nat,
    comment        : Text,
  ) : async { #ok; #err : Text } {
    RatingsLib.ratePlayer(ratings, matches, caller, matchId, ratedPrincipal, score, comment);
  };

  public query func getPlayerRank(user : Principal) : async ?RatingTypes.PlayerRank {
    RatingsLib.getPlayerRank(ratings, matches, user);
  };

  public query func getAllRankings() : async [RatingTypes.PlayerRank] {
    RatingsLib.getAllRankings(ratings, matches, profiles);
  };

  public query func getRatingsForPlayer(user : Principal) : async [RatingTypes.PlayerRating] {
    RatingsLib.getRatingsForPlayer(ratings, user);
  };
};
