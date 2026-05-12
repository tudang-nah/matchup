import Principal "mo:core/Principal";
import Set "mo:core/Set";

module {
  // Shared-safe match for API boundary
  public type MatchPublic = {
    id : Text;
    sport : Text;
    title : Text;
    time : Text;
    location : Text;
    missing : Int;
    createdAt : Int;
    requirements : ?Text;
    creator : Principal;
    participants : [Principal];
  };

  // Internal match — Set<Principal> not shareable
  public type Match = {
    id : Text;
    sport : Text;
    title : Text;
    time : Text;
    location : Text;
    missing : Int;
    createdAt : Int;
    requirements : ?Text;
    creator : Principal;
    participants : Set.Set<Principal>;
  };

  public type UserProfile = {
    name : Text;
    bio : Text;
    avatarUrl : Text;
    skills : [Text];
  };

  public type ProfileEntry = {
    owner : Principal;
    profile : UserProfile;
  };

  public type MatchEntry = {
    matched : Principal;
    profile : UserProfile;
    mutual : Bool;
  };

  public type Message = {
    id : Text;
    from : Principal;
    to : Principal;
    text : Text;
    createdAt : Int;
  };

  public type MatchResult = { #ok; #err : Text };

  public type NewsItem = {
    id          : Text;
    title       : Text;
    description : Text;
    imageUrl    : Text;
    url         : Text;
    source      : Text;
    publishedAt : Text;
    sport       : Text;
  };

  public type NewsCache = {
    items       : [NewsItem];
    fetchedAt   : Int;
  };
};
