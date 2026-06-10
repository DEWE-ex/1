"use client";

import { useState } from "react";
import { Shield } from "lucide-react";

interface AdminLoginFormProps {
  onSuccess: () => void;
}

export default function AdminLoginForm({ onSuccess }: AdminLoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Đăng nhập thất bại");
        return;
      }
      onSuccess();
    } catch {
      setError("Không thể kết nối server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel mx-auto max-w-md">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Đăng nhập Admin</h2>
          <p className="text-sm text-stone-500 dark:text-slate-400">
            Duyệt câu hỏi Karuta
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="admin-user" className="block text-sm font-medium">
            Tài khoản
          </label>
          <input
            id="admin-user"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input-field mt-1"
            autoComplete="username"
            required
          />
        </div>
        <div>
          <label htmlFor="admin-pass" className="block text-sm font-medium">
            Mật khẩu
          </label>
          <input
            id="admin-pass"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field mt-1"
            autoComplete="current-password"
            required
          />
        </div>
        {error && (
          <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
            {error}
          </div>
        )}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}
