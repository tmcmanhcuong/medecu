import React from 'react';

interface ChatModeCardProps {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  bgColor: string;
  active: boolean;
  status: string;
  onClick?: () => void;
}

const ChatModeCard: React.FC<ChatModeCardProps> = ({ title, description, icon: Icon, gradient, active, status, onClick }) => (
  <div
    onClick={active ? onClick : undefined}
    className={`group bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm transition-all duration-300 ${active ? 'hover:shadow-lg hover:shadow-blue-500/10 hover:scale-105 cursor-pointer' : 'opacity-70 cursor-not-allowed'}`}
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center shadow-lg ${active && 'group-hover:scale-110'} transition-transform duration-300`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${active ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'}`}>{status}</span>
    </div>
    <h3 className={`text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 ${active && 'group-hover:text-blue-600 dark:group-hover:text-blue-400'} transition-colors`}>
      {title}
    </h3>
    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">{description}</p>
    {active ? (
      <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
        <span>Bắt đầu trò chuyện</span>
        <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    ) : (
      <div className="flex items-center text-gray-400 dark:text-gray-500 text-sm font-medium">
        <span>Xem chi tiết</span>
        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    )}
  </div>
);

export default ChatModeCard;
