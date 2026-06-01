import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 dark:from-slate-900 via-blue-50/30 dark:via-slate-800/50 to-purple-50/30 dark:to-slate-900 bg-slate-50 dark:bg-slate-900">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="bg-gradient-to-r from-blue-50/50 dark:from-slate-800/50 to-purple-50/50 dark:to-slate-900/50 border-t border-gray-100 dark:border-slate-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center space-x-8 text-sm text-gray-500 dark:text-gray-400">
            <a href="#" className="hover:text-blue-600 transition-colors">Điều khoản dịch vụ</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Chính sách bảo mật</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Hỗ trợ</a>
            <span className="flex items-center">
              Được xây dựng với <span className="text-red-500 mx-1">❤️</span> cho giáo viên
            </span>
          </div>
          <div className="text-center mt-4">
            <p className="text-xs text-gray-400">© 2025 EduMate. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;