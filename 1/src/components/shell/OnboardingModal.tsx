"use client";

import { useState } from "react";
import { BookOpen, Gamepad2, Heart, MessageSquare, Sparkles, Timer } from "lucide-react";
import { markOnboardingSeen } from "@/lib/onboarding";

const steps = [
  {
    icon: MessageSquare,
    title: "Trợ lý gợi ý sách AI",
    desc: "Chat với AI, gửi ảnh bìa sách để nhận gợi ý và link mua.",
    color: "from-violet-500 to-purple-600",
  },
  {
    icon: Heart,
    title: "Chia sẻ cộng đồng",
    desc: "Viết bài, tim và bình luận. Bài nhiều tim lên đầu bảng tin.",
    color: "from-rose-500 to-pink-600",
  },
  {
    icon: Timer,
    title: "Đồng hồ đọc sách",
    desc: "Khóa màn hình, tập trung đọc và mở khóa thành tựu để chia sẻ.",
    color: "from-emerald-500 to-teal-600",
  },
  {
    icon: Gamepad2,
    title: "Karuta 1 vs 1",
    desc: "Ghép ngẫu nhiên hoặc tạo phòng. Tùy chỉnh chủ đề văn thơ/sách.",
    color: "from-amber-500 to-orange-600",
  },
  {
    icon: Sparkles,
    title: "Sẵn sàng khám phá!",
    desc: "Đăng nhập Google để lưu lịch sử, hoặc dùng thử 1 giờ với tư cách khách.",
    color: "from-cyan-500 to-blue-600",
  },
];

export default function OnboardingModal({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const Icon = current.icon;

  const finish = () => {
    markOnboardingSeen();
    onDone();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="animate-scale-in glass-strong relative z-10 w-full max-w-md rounded-3xl p-8 text-center">
        <div
          className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${current.color} shadow-lg`}
        >
          <Icon className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900 dark:text-white">
          {current.title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-slate-300">
          {current.desc}
        </p>

        <div className="mt-6 flex justify-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === step
                  ? "w-6 bg-warm-500 dark:bg-cold-400"
                  : "w-2 bg-stone-300 dark:bg-slate-600"
              }`}
            />
          ))}
        </div>

        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="btn-secondary flex-1"
            >
              Quay lại
            </button>
          )}
          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="btn-primary flex-1"
            >
              Tiếp theo
            </button>
          ) : (
            <button type="button" onClick={finish} className="btn-primary flex-1">
              <BookOpen className="mr-2 inline h-4 w-4" />
              Bắt đầu
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
