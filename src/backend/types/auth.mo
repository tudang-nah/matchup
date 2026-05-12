module {
  public type AuthResult = { #ok : Text; #err : Text };

  public type UserAccount = {
    username  : Text;
    // SHA-256 hash of (salt # password) stored as hex Text
    passhash  : Text;
    salt      : Text;
    principal : Text; // deterministic from username
  };

  public type Session = {
    token     : Text;
    username  : Text;
    createdAt : Int;
  };
};
