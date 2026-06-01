import React from 'react';

interface ToolCardProps {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  bgColor: string;
  active: boolean;
  status?: string;
  path: string;
  onClick?: () => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ title, description, icon: Icon, gradient, active, status, onClick }) => (
  <div
    onClick={active ? onClick : undefined}
    className={`group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm transition-all duration-300 ${active ? 'hover:shadow-lg hover:scale-105 cursor-pointer' : 'opacity-70 cursor-not-allowed'}`}
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center shadow-lg ${active && 'group-hover:scale-110'} transition-transform duration-300`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      {!active && (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">{status}</span>
      )}
    </div>
    <h3 className={`text-lg font-semibold text-gray-900 mb-2 ${active && 'group-hover:text-blue-600'} transition-colors`}>
      {title}
    </h3>
    <p className="text-gray-600 text-sm leading-relaxed mb-4">{description}</p>
    <div className={`flex items-center text-sm font-medium ${active ? 'text-blue-600' : 'text-gray-400'}`}>
      <span>{active ? 'Khám phá ngay' : 'Xem chi tiết'}</span>
      <svg className={`w-4 h-4 ml-2 ${active && 'group-hover:translate-x-1'} transition-transform`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </div>
);

export default ToolCard;
