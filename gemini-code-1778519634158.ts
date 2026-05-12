import React, { useState, useEffect } from "react";
// 1. XÓA BỎ IMPORT Internet Identity (Bên thứ ba)
// import { useInternetIdentity } from "@caffeineai/core-infrastructure"; 
import { ProfileSheet } from "./ProfileSheet"; 
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function App() {
  const [openProfile, setOpenProfile] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // 2. TỰ ĐỘNG KHÔI PHỤC PHIÊN ĐĂNG NHẬP KHI LOAD TRANG
  useEffect(() => {
    const savedUser = localStorage.getItem("matchup_user");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }
  }, []);

  // FORM ĐĂNG KÝ (Lưu thông tin vào LocalStorage thay vì bên thứ ba)
  const RegisterForm = () => {
    const [form, setForm] = useState({ name: "", email: "", password: "" });

    const handleRegister = (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.email || !form.password) return alert("Vui lòng nhập đầy đủ!");
      
      // Lưu vào danh sách người dùng giả lập trong web
      const users = JSON.parse(localStorage.getItem("db_users") || "[]");
      users.push(form);
      localStorage.setItem("db_users", JSON.stringify(users));
      
      alert("Đăng ký thành công! Giờ bạn có thể đăng nhập.");
    };

    return (
      <form onSubmit={handleRegister} className="space-y-4 border p-4 rounded-lg bg-gray-50">
        <h2 className="font-bold">Đăng ký tài khoản nội bộ</h2>
        <Input
          placeholder="Tên"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <Input
          type="email"
          placeholder="Email"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Input
          type="password"
          placeholder="Mật khẩu"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <Button type="submit" className="w-full bg-green-600">Đăng ký ngay trên web</Button>
      </form>
    );
  };

  // FORM ĐĂNG NHẬP NỘI BỘ
  const LoginForm = () => {
    const [loginData, setLoginData] = useState({ email: "", password: "" });

    const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      const users = JSON.parse(localStorage.getItem("db_users") || "[]");
      
      // Kiểm tra xem user có tồn tại trong dữ liệu mình vừa đăng ký không
      const user = users.find((u: any) => u.email === loginData.email && u.password === loginData.password);
      
      if (user) {
        localStorage.setItem("matchup_user", JSON.stringify(user));
        setCurrentUser(user);
        setIsLoggedIn(true);
        console.log("✅ Đăng nhập nội bộ thành công!");
      } else {
        alert("Sai email hoặc mật khẩu!");
      }
    };

    return (
      <form onSubmit={handleLogin} className="space-y-4 border p-4 rounded-lg bg-blue-50">
        <h2 className="font-bold">Đăng nhập</h2>
        <Input
          placeholder="Email"
          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
        />
        <Input
          type="password"
          placeholder="Mật khẩu"
          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
        />
        <Button type="submit" className="w-full bg-blue-600">Vào ứng dụng</Button>
      </form>
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("matchup_user");
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  return (
    <div className="p-6 max-w-md mx-auto space-y-6">
      <h1 className="text-3xl font-black text-orange-600 text-center italic">MatchUp</h1>

      {!isLoggedIn ? (
        <>
          <RegisterForm />
          <div className="relative py-2 text-center text-xs uppercase text-muted-foreground">
            <span className="bg-background px-2">Hoặc</span>
          </div>
          <LoginForm />
        </>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-green-100 rounded text-center">
            <p className="font-bold">Chào mừng, {currentUser?.name}!</p>
            <p className="text-sm text-gray-600">Bạn đang đăng nhập bằng hệ thống nội bộ.</p>
          </div>
          
          <Button onClick={() => setOpenProfile(true)} className="w-full bg-purple-500">
            Xem hồ sơ của tôi
          </Button>
          
          <Button onClick={handleLogout} variant="outline" className="w-full">
            Đăng xuất
          </Button>
        </div>
      )}

      {/* Hồ sơ cá nhân - Giả lập Identity để ProfileSheet không lỗi */}
      <ProfileSheet
        open={openProfile}
        onOpenChange={setOpenProfile}
        isLoggedIn={isLoggedIn}
        identity={{
          getPrincipal: () => ({ toString: () => currentUser?.email || "internal-user" }),
        }}
        login={() => {}}
      />
    </div>
  );
}