import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Layers, CheckCircle2, MessageSquare, ArrowRight, UploadCloud, Clock, FileText } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const userName = localStorage.getItem('user_username') || 'Bạn';

  // Mock data cho Recent Activity
  const recentFiles = [
    { id: 1, name: 'Chương 1_Tổng quan mạng máy tính.pdf', progress: 85, time: '2 giờ trước' },
    { id: 2, name: 'Bài giảng AI & Machine Learning.pdf', progress: 40, time: 'Hôm qua' },
    { id: 3, name: 'Tài liệu hướng dẫn ReactJS 2024.pdf', progress: 100, time: '3 ngày trước' },
  ];

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 overflow-y-auto overflow-x-hidden custom-scrollbar relative">
      {/* Background Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 dark:bg-blue-600/20 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/20 dark:bg-purple-600/20 blur-[150px] pointer-events-none" />

      <main className="max-w-7xl mx-auto px-6 py-12 lg:px-8 relative z-10 space-y-24 flex-1">

        {/* 1. Hero Section */}
        <section className="text-center space-y-8 mt-10" style={{ animation: 'fadeInUp 0.8s ease-out forwards' }}>
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">Chào mừng trở lại, {userName} 👋</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
            Biến slide bài giảng thành <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-purple-600">điểm A trong 30 giây</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">
            Tải lên PDF. EduMate sẽ tự động tóm tắt, tạo Flashcard và thiết kế bài Quiz giúp bạn ôn thi hiệu quả nhất.
          </p>
          <div className="pt-4">
            <button
              onClick={() => navigate('/workspace')}
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-2xl font-bold text-lg transition-all hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(168,85,247,0.8)]"
            >
              <UploadCloud className="w-6 h-6" />
              Tải Slide Lên & Học Ngay
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </section>

        {/* 2. Khu vực "Tài liệu đang học" (Recent Activity) */}
        <section style={{ animation: 'fadeInUp 0.8s ease-out 0.2s forwards', opacity: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Clock className="w-6 h-6 text-purple-500" />
              Tiếp tục việc học của bạn
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentFiles.map((file) => (
              <div
                key={file.id}
                onClick={() => navigate('/workspace')}
                className="group cursor-pointer bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-6 rounded-3xl hover:border-purple-500/50 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-lg mb-2 line-clamp-1 group-hover:text-purple-500 transition-colors">{file.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{file.time}</p>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-slate-600 dark:text-slate-300">Tiến độ ôn tập</span>
                    <span className="text-purple-600 dark:text-purple-400">{file.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-purple-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${file.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Khu vực "How it works" - 4 Core Features */}
        <section style={{ animation: 'fadeInUp 0.8s ease-out 0.4s forwards', opacity: 0 }}>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Hệ thống AI Study Buddy của riêng bạn</h2>
            <p className="text-slate-600 dark:text-slate-400">4 tính năng cốt lõi giúp bạn làm chủ mọi kiến thức</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-slate-200 dark:border-slate-700/50 p-8 rounded-3xl hover:-translate-y-2 transition-transform duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Tóm tắt AI</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Trích xuất khái niệm cốt lõi. Không cần đọc toàn bộ hàng trăm trang slide.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-slate-200 dark:border-slate-700/50 p-8 rounded-3xl hover:-translate-y-2 transition-transform duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30">
                <Layers className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Smart Flashcards</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Tự động tạo thẻ lật ghi nhớ thuật ngữ, định nghĩa chuẩn xác từ tài liệu.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-slate-200 dark:border-slate-700/50 p-8 rounded-3xl hover:-translate-y-2 transition-transform duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-green-500/30">
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Auto Quiz</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Tự kiểm tra kiến thức bằng các bài trắc nghiệm sinh ra từ chính tài liệu của bạn.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-slate-200 dark:border-slate-700/50 p-8 rounded-3xl hover:-translate-y-2 transition-transform duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-rose-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-pink-500/30">
                <MessageSquare className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Chat Q&A (RAG)</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Hỏi đáp trực tiếp với AI. Mọi câu trả lời đều được trích dẫn nguồn rõ ràng, chống bịa đặt.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Khu vực CTA cuối cùng */}
        <section className="py-20 text-center" style={{ animation: 'fadeInUp 0.8s ease-out 0.6s forwards', opacity: 0 }}>
          <div className="max-w-3xl mx-auto bg-gradient-to-r from-blue-900 to-purple-900 rounded-[3rem] p-12 relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-white/5 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
            <div className="relative z-10">
              <h2 className="text-4xl font-bold text-white mb-6">Sẵn sàng để tối ưu hóa thời gian học tập?</h2>
              <p className="text-blue-100 text-lg mb-10">Gia nhập cùng hàng ngàn sinh viên đang học tập thông minh hơn mỗi ngày cùng EduMate.</p>
              <button
                onClick={() => navigate('/workspace')}
                className="px-10 py-4 bg-white text-purple-700 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-xl"
              >
                Bắt đầu miễn phí
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* 5. Footer Hackathon Style */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-lg py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <div className="flex gap-0.5">
                <div className="w-1 h-3 bg-white rounded-full"></div>
                <div className="w-1 h-4 bg-white rounded-full"></div>
                <div className="w-1 h-2.5 bg-white rounded-full"></div>
              </div>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-purple-600">
              EduMate AI
            </span>
          </div>

          <div className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 text-sm md:text-base">
            Engineered in 48h by <span className="text-cyan-600 dark:text-cyan-400 font-bold tracking-wide">Team Water</span> 🩵
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}} />
    </div>
  );
}
