import AuthTypes "../types/auth";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Nat8 "mo:core/Nat8";
import Sha256 "mo:sha2/Sha256";

module {
  // ---------------------------------------------------------------------------
  // SHA-256 via IC low-level primitive
  // ---------------------------------------------------------------------------
  func sha256(data : Blob) : Blob {
    Sha256.fromBlob(#sha256, data);
  };

  // ---------------------------------------------------------------------------
  // Hex encoding
  // ---------------------------------------------------------------------------
  let HEX : [Char] = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];

  func byteToHex(b : Nat8) : Text {
    Text.fromChar(HEX[b.toNat() / 16]) # Text.fromChar(HEX[b.toNat() % 16]);
  };

  func blobToHex(blob : Blob) : Text {
    var result = "";
    for (byte in blob.values()) {
      result #= byteToHex(byte);
    };
    result;
  };

  // ---------------------------------------------------------------------------
  // Salt and password hashing
  // ---------------------------------------------------------------------------
  func makeSalt(username : Text, counter : Nat) : Text {
    let raw = username # "::" # counter.toText() # "::matchup";
    blobToHex(sha256(raw.encodeUtf8()));
  };

  func hashPassword(password : Text, salt : Text) : Text {
    blobToHex(sha256((salt # ":" # password).encodeUtf8()));
  };

  // Token: SHA-256 of (username:timestamp:counter)
  func makeToken(username : Text, ts : Int, counter : Nat) : Text {
    blobToHex(sha256((username # ":" # ts.toText() # ":" # counter.toText()).encodeUtf8()));
  };

  // SESSION_TTL: 30 days in nanoseconds
  let SESSION_TTL : Int = 2_592_000_000_000_000;

  // ---------------------------------------------------------------------------
  // Public functions
  // ---------------------------------------------------------------------------

  public func registerUser(
    accounts  : Map.Map<Text, AuthTypes.UserAccount>,
    sessions  : Map.Map<Text, AuthTypes.Session>,
    counter   : { var value : Nat },
    username  : Text,
    password  : Text,
  ) : AuthTypes.AuthResult {
    if (username.size() < 3) {
      return #err("Ten dang nhap phai co it nhat 3 ky tu");
    };
    if (password.size() < 6) {
      return #err("Mat khau phai co it nhat 6 ky tu");
    };
    if (accounts.containsKey(username)) {
      return #err("Ten dang nhap da ton tai");
    };
    counter.value += 1;
    let salt = makeSalt(username, counter.value);
    let passhash = hashPassword(password, salt);
    accounts.add(username, { username; passhash; salt; principal = "user:" # username });
    // Auto-login after register
    counter.value += 1;
    let now = Time.now();
    let token = makeToken(username, now, counter.value);
    sessions.add(token, { token; username; createdAt = now });
    #ok(token);
  };

  public func loginUser(
    accounts  : Map.Map<Text, AuthTypes.UserAccount>,
    sessions  : Map.Map<Text, AuthTypes.Session>,
    counter   : { var value : Nat },
    username  : Text,
    password  : Text,
  ) : AuthTypes.AuthResult {
    switch (accounts.get(username)) {
      case null {
        #err("Ten dang nhap hoac mat khau khong dung");
      };
      case (?acct) {
        if (hashPassword(password, acct.salt) != acct.passhash) {
          return #err("Ten dang nhap hoac mat khau khong dung");
        };
        counter.value += 1;
        let now = Time.now();
        let token = makeToken(username, now, counter.value);
        sessions.add(token, { token; username; createdAt = now });
        #ok(token);
      };
    };
  };

  public func validateSession(
    sessions : Map.Map<Text, AuthTypes.Session>,
    token    : Text,
  ) : ?Text {
    switch (sessions.get(token)) {
      case null { null };
      case (?s) {
        if (Time.now() - s.createdAt > SESSION_TTL) {
          sessions.remove(token);
          null;
        } else {
          ?s.username;
        };
      };
    };
  };

  public func logoutSession(
    sessions : Map.Map<Text, AuthTypes.Session>,
    token    : Text,
  ) : () {
    sessions.remove(token);
  };
};
