import Principal "mo:core/Principal";

module {
  // One rating from a player to another within a match
  public type PlayerRating = {
    raterPrincipal : Principal;
    ratedPrincipal : Principal;
    matchId : Text;
    score : Nat;          // 1–5
    comment : Text;
    createdAt : Int;
  };

  // Computed rank aggregate for a player
  public type PlayerRank = {
    userPrincipal : Principal;
    totalMatches : Nat;
    showUpCount : Nat;
    avgRating : Float;
    totalRatings : Nat;
    lastActive : Int;
  };
};
