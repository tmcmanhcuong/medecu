import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Brain,
  Sparkles,
  ArrowRight,
  GraduationCap,
  FileText,
  MessageCircle,
  Layers,
  CheckCircle2,
  Zap,
  Shield,
  Users,
  ChevronRight,
} from 'lucide-react';

/* ─── tiny hook: animate a number from 0 → target ─── */
function useCountUp(target, duration = 2000, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf;
    const t0 = performance.now();
    const step = (now) => {
      const progress = Math.min((now - t0) / duration, 1);
      // ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [start, target, duration]);
  return value;
}

/* ─── Floating particle dots (decorative) ─── */
function FloatingParticles() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    size: 3 + Math.random() * 5,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 6,
    dur: 8 + Math.random() * 12,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full opacity-30 dark:opacity-20"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            background: `linear-gradient(135deg, #3b82f6, #06b6d4)`,
            animation: `floatParticle ${p.dur}s ease-in-out ${p.delay}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Feature card component ─── */
function FeatureCard({ icon: Icon, title, description, gradient, delay }) {
  return (
    <div
      className="group relative bg-white/70 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl p-7 border border-gray-200/50 dark:border-slate-700/50 hover:border-transparent transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 dark:hover:shadow-cyan-500/20 hover:-translate-y-1"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* subtle gradient glow on hover */}
      <div
        className={`absolute -inset-px rounded-2xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-sm`}
      />
      <div
        className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} text-white mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}
      >
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}

/* ─── Stat card ─── */
function StatCard({ value, suffix, label, started }) {
  const count = useCountUp(value, 2200, started);
  return (
    <div className="text-center">
      <p className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
        {count}
        {suffix}
      </p>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

/* ═══════════════ MAIN COMPONENT ═══════════════ */
export default function LandingPage() {
  const navigate = useNavigate();
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);

  // Intersection observer for stats count-up
  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStatsVisible(true);
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const features = [
    {
      icon: Layers,
      title: 'Notebook thông minh',
      description:
        'Tổ chức tài liệu, ghi chú và hoạt động học tập theo từng ngữ cảnh notebook riêng biệt.',
      gradient: 'from-blue-500 to-cyan-400',
    },
    {
      icon: Brain,
      title: 'AI hỗ trợ học tập',
      description:
        'Trò chuyện với AI dựa trên nguồn tài liệu thực, nhận câu trả lời có trích dẫn chính xác.',
      gradient: 'from-blue-600 to-indigo-500',
    },
    {
      icon: FileText,
      title: 'Quản lý tài liệu PDF',
      description:
        'Tải lên và phân tích tài liệu PDF tự động, trích xuất nội dung để AI hiểu ngữ cảnh.',
      gradient: 'from-cyan-500 to-blue-500',
    },
    {
      icon: MessageCircle,
      title: 'Chat trích dẫn',
      description:
        'Mỗi câu trả lời đều đi kèm trích dẫn trang, đoạn cụ thể — dễ dàng xác minh thông tin.',
      gradient: 'from-sky-400 to-blue-500',
    },
    {
      icon: GraduationCap,
      title: 'Bài tập cá nhân hoá',
      description:
        'Tạo câu hỏi trắc nghiệm, tự luận từ tài liệu để luyện tập và đánh giá kiến thức.',
      gradient: 'from-blue-500 to-sky-400',
    },
    {
      icon: Sparkles,
      title: 'Ghi chú & tóm tắt',
      description:
        'Tạo ghi chú trực tiếp từ tài liệu, AI tự động tóm tắt nội dung giúp ôn bài hiệu quả.',
      gradient: 'from-indigo-400 to-cyan-400',
    },
  ];

  const benefits = [
    'Hỗ trợ đa ngôn ngữ Việt – Anh',
    'Không giới hạn số lượng notebook',
    'Trích dẫn nguồn chính xác từ PDF',
    'Bảo mật dữ liệu người dùng',
    'Tích hợp AI tiên tiến (GPT, Gemini)',
    'Giao diện thân thiện, dễ sử dụng',
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* ─── HERO SECTION ─── */}
      <section className="relative overflow-hidden pt-24">
        {/* background decoration */}
        <FloatingParticles />

        <div className="relative z-10 max-w-6xl mx-auto text-center px-4 pt-8 pb-20 sm:pt-14 sm:pb-28">
          {/* badge */}
          {/* <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-8 animate-fadeDown">
            <Zap className="w-3.5 h-3.5" />
            Nền tảng học tập AI hàng đầu Việt Nam
          </div> */}

          {/* heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-[1.1] animate-fadeUp">
            Học thông minh hơn
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-500 bg-clip-text text-transparent">
              cùng EduMate
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed animate-fadeUp animation-delay-150">
            Nền tảng hỗ trợ học tập theo mô hình <strong className="text-gray-900 dark:text-white">notebook</strong>: quản lý
            nguồn tài liệu, ghi chú và hoạt động học tập theo từng ngữ cảnh — được hỗ trợ bởi&nbsp;
            <strong className="text-gray-900 dark:text-white">AI</strong>.
          </p>

          {/* decorative hero glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-400/20 via-cyan-400/20 to-indigo-400/20 dark:from-blue-600/10 dark:via-cyan-600/10 dark:to-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section
        ref={statsRef}
        className="relative -mt-6 max-w-4xl mx-auto px-4"
      >
        <div className="bg-white/80 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-gray-200/60 dark:border-slate-700/60 shadow-xl shadow-gray-200/40 dark:shadow-blue-900/20 py-10 px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatCard value={500} suffix="+" label="Người dùng" started={statsVisible} />
          <StatCard value={1200} suffix="+" label="Tài liệu" started={statsVisible} />
          <StatCard value={50} suffix="k" label="Câu hỏi AI" started={statsVisible} />
          <StatCard value={99} suffix="%" label="Độ chính xác" started={statsVisible} />
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="mt-24 max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 tracking-wide uppercase mb-3">
            Tính năng nổi bật
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
            Mọi thứ bạn cần để{' '}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              học hiệu quả
            </span>
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <FeatureCard key={f.title} {...f} delay={i * 80} />
          ))}
        </div>
      </section>

      {/* ─── WHY EDUMATE ─── */}
      <section className="mt-28 max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* left – gradient card */}
          <div className="relative">
            <div className="aspect-square max-w-md mx-auto rounded-3xl bg-gradient-to-br from-blue-600/90 to-cyan-600/90 p-10 flex flex-col justify-center shadow-2xl shadow-blue-500/20">
              <div className="space-y-5">
                {[
                  { icon: Shield, text: 'Bảo mật & riêng tư' },
                  { icon: Zap, text: 'Phản hồi tức thì' },
                  { icon: Users, text: 'Cộng đồng hỗ trợ' },
                ].map(({ icon: Ic, text }) => (
                  <div key={text} className="flex items-center gap-4 bg-white/15 backdrop-blur rounded-xl px-5 py-4 hover:bg-white/25 transition-colors cursor-pointer">
                    <Ic className="w-6 h-6 text-white flex-shrink-0" />
                    <span className="text-white font-medium text-lg">{text}</span>
                  </div>
                ))}
              </div>
              {/* floating accent */}
              <div className="absolute -top-6 -right-6 w-28 h-28 bg-indigo-400/30 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
            </div>
          </div>

          {/* right – text */}
          <div>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 tracking-wide uppercase mb-3">
              Tại sao chọn EduMate?
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6">
              Nền tảng học tập
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                được thiết kế cho bạn
              </span>
            </h2>
            <ul className="space-y-3">
              {benefits.map((b) => (
                <li key={b} className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => navigate('/signup')}
              className="mt-8 group inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold hover:gap-3 transition-all duration-300 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Bắt đầu ngay
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ─── BOTTOM CTA ─── */}
      <section className="mt-28 mb-8 max-w-4xl mx-auto px-4 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-600 px-8 py-16 text-center shadow-2xl shadow-blue-500/20">
          {/* decorative rings */}
          <div className="absolute -top-20 -right-20 w-64 h-64 border border-white/10 rounded-full pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 border border-white/10 rounded-full pointer-events-none" />

          <Sparkles className="w-10 h-10 text-white/80 mx-auto mb-5" />
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-4">
            Sẵn sàng trải nghiệm?
          </h2>
          <p className="text-white/80 text-base sm:text-lg max-w-lg mx-auto mb-8">
            Tham gia cùng hàng trăm người dùng đang sử dụng EduMate để nâng cao hiệu quả học tập mỗi ngày.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="landing-bottom-signup"
              onClick={() => navigate('/signup')}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-white text-blue-700 font-bold text-base shadow-lg hover:shadow-xl hover:scale-105 active:scale-100 transition-all duration-300"
            >
              Đăng ký miễn phí
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              id="landing-bottom-signin"
              onClick={() => navigate('/signin')}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl border-2 border-white/40 text-white font-semibold text-base hover:bg-white/10 hover:border-white/70 transition-all duration-300"
            >
              Đã có tài khoản? Đăng nhập
            </button>
          </div>
        </div>
      </section>

      {/* ─── INLINE KEYFRAME ANIMATIONS ─── */}
      <style>{`
        @keyframes floatParticle {
          0%   { transform: translateY(0) scale(1); }
          100% { transform: translateY(-30px) scale(1.3); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeUp {
          animation: fadeUp 0.7s ease-out both;
        }
        .animate-fadeDown {
          animation: fadeDown 0.6s ease-out both;
        }
        .animation-delay-150 {
          animation-delay: 150ms;
        }
        .animation-delay-300 {
          animation-delay: 300ms;
        }
      `}</style>
    </div>
  );
}
