import Types "types/common";
import AuthTypes "types/auth";
import RatingTypes "types/ratings";
import MatchesMixin "mixins/matches-api";
import ProfilesMixin "mixins/profiles-api";
import RatingsMixin "mixins/ratings-api";
import NewsMixin "mixins/news-api";
import AuthMixin "mixins/auth-api";

import Map "mo:core/Map";
import Principal "mo:core/Principal";
import CheckInsMixin "mixins/checkins-api";
import Set "mo:core/Set";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";


actor {
  // Stable state
  let matches   = Map.empty<Text, Types.Match>();
  let profiles  = Map.empty<Principal, Types.UserProfile>();
  let userMatches = Map.empty<Principal, Set.Set<Principal>>();
  let messages  = Map.empty<Text, Types.Message>();
  let ratings   = Map.empty<Text, RatingTypes.PlayerRating>();
  let checkIns  = Map.empty<Text, Map.Map<Text, Int>>();

  let idCounter = { var value : Nat = 0 };

  // News cache state
  let newsCache = { var items : [Types.NewsItem] = []; var fetchedAt : Int = 0 };

  // Auth state
  let accounts  = Map.empty<Text, AuthTypes.UserAccount>();
  let sessions  = Map.empty<Text, AuthTypes.Session>();
  let accessControlState = AccessControl.initState();

  // Compose mixins
  include MatchesMixin(matches, profiles, idCounter);
  include ProfilesMixin(profiles, userMatches, messages, idCounter);
  include RatingsMixin(ratings, matches, profiles);
  include NewsMixin(newsCache);
  include CheckInsMixin(checkIns, matches);
  include AuthMixin(accounts, sessions, idCounter);
  include MixinAuthorization(accessControlState);
};
