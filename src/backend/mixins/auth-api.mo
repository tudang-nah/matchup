import AuthTypes "../types/auth";
import AuthLib "../lib/auth";
import Map "mo:core/Map";

mixin (
  accounts  : Map.Map<Text, AuthTypes.UserAccount>,
  sessions  : Map.Map<Text, AuthTypes.Session>,
  idCounter : { var value : Nat },
) {

  /// Đăng ký tài khoản mới. Trả về session token khi thành công.
  public shared func registerUser(username : Text, password : Text) : async AuthTypes.AuthResult {
    AuthLib.registerUser(accounts, sessions, idCounter, username, password);
  };

  /// Đăng nhập. Trả về session token khi thành công.
  public shared func loginUser(username : Text, password : Text) : async AuthTypes.AuthResult {
    AuthLib.loginUser(accounts, sessions, idCounter, username, password);
  };

  /// Xác thực session token. Trả về username nếu hợp lệ.
  public query func validateSession(token : Text) : async ?Text {
    AuthLib.validateSession(sessions, token);
  };

  /// Đăng xuất — hủy session token.
  public shared func logoutUser(token : Text) : async () {
    AuthLib.logoutSession(sessions, token);
  };
};
