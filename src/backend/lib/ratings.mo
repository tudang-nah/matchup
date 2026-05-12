import Types "../types/common";
import RatingTypes "../types/ratings";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Float "mo:core/Float";
import Array "mo:core/Array";

module {
  // Composite key: "raterPrincipal_ratedPrincipal_matchId"
  public func ratingKey(rater : Principal, rated : Principal, matchId : Text) : Text {
    rater.toText() # "_" # rated.toText() # "_" # matchId;
  };

  public func ratePlayer(
    ratings        : Map.Map<Text, RatingTypes.PlayerRating>,
    matches        : Map.Map<Text, Types.Match>,
    caller         : Principal,
    matchId        : Text,
    ratedPrincipal : Principal,
    score          : Nat,
    comment        : Text,
  ) : { #ok; #err : Text } {
    // Validate score range
    if (score < 1 or score > 5) {
      return #err("Điểm đánh giá phải từ 1 đến 5");
    };
    // Cannot rate yourself
    if (Principal.equal(caller, ratedPrincipal)) {
      return #err("Không thể tự đánh giá bản thân");
    };
    // Caller must be participant
    switch (matches.get(matchId)) {
      case null { return #err("Không tìm thấy trận") };
      case (?m) {
        if (not m.participants.contains(caller)) {
          return #err("Bạn không tham gia trận này");
        };
        if (not m.participants.contains(ratedPrincipal)) {
          return #err("Người được đánh giá không tham gia trận này");
        };
      };
    };
    // One rating per rater per match per player
    let key = ratingKey(caller, ratedPrincipal, matchId);
    if (ratings.get(key) != null) {
      return #err("Bạn đã đánh giá người này trong trận này rồi");
    };
    let rating : RatingTypes.PlayerRating = {
      raterPrincipal = caller;
      ratedPrincipal;
      matchId;
      score;
      comment;
      createdAt = Time.now();
    };
    ratings.add(key, rating);
    #ok;
  };

  public func getPlayerRank(
    ratings : Map.Map<Text, RatingTypes.PlayerRating>,
    matches : Map.Map<Text, Types.Match>,
    user    : Principal,
  ) : ?RatingTypes.PlayerRank {
    // Count matches participated
    var totalMatches : Nat = 0;
    var lastActive   : Int = 0;
    for ((_, m) in matches.entries()) {
      if (m.participants.contains(user)) {
        totalMatches += 1;
        if (m.createdAt > lastActive) {
          lastActive := m.createdAt;
        };
      };
    };
    // We only return a rank if the user has participated in at least one match
    // (or has received ratings)
    var totalScore  : Nat = 0;
    var totalRatings : Nat = 0;
    for ((_, r) in ratings.entries()) {
      if (Principal.equal(r.ratedPrincipal, user)) {
        totalScore  += r.score;
        totalRatings += 1;
      };
    };
    if (totalMatches == 0 and totalRatings == 0) {
      return null;
    };
    let avgRating : Float =
      if (totalRatings == 0) { 0.0 }
      else { totalScore.toFloat() / totalRatings.toFloat() };
    ?{
      userPrincipal = user;
      totalMatches;
      showUpCount   = totalMatches; // showUpCount == totalMatches (joined = showed up)
      avgRating;
      totalRatings;
      lastActive;
    };
  };

  public func getAllRankings(
    ratings  : Map.Map<Text, RatingTypes.PlayerRating>,
    matches  : Map.Map<Text, Types.Match>,
    profiles : Map.Map<Principal, Types.UserProfile>,
  ) : [RatingTypes.PlayerRank] {
    // Collect all known principals from profiles
    let ranks = profiles.keys().filterMap(
      func(p) { getPlayerRank(ratings, matches, p) }
    ).toArray();
    // Sort by totalMatches desc, then avgRating desc
    ranks.sort<RatingTypes.PlayerRank>(
      func(a, b) {
        if (a.totalMatches > b.totalMatches) { #less }
        else if (a.totalMatches < b.totalMatches) { #greater }
        else if (a.avgRating > b.avgRating) { #less }
        else if (a.avgRating < b.avgRating) { #greater }
        else { #equal };
      }
    );
  };

  public func getRatingsForPlayer(
    ratings : Map.Map<Text, RatingTypes.PlayerRating>,
    user    : Principal,
  ) : [RatingTypes.PlayerRating] {
    ratings.values().filter(
      func(r) { Principal.equal(r.ratedPrincipal, user) }
    ).toArray();
  };
};
