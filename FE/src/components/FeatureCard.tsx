import React from 'react';

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  desc: string;
  color: string;
  bgColor: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, desc, color, bgColor }) => (
  <div className={`${bgColor} dark:bg-slate-800 rounded-2xl p-6 border border-white dark:border-slate-700 shadow-sm hover:shadow-lg hover:shadow-blue-500/10 hover:scale-105 transition-all duration-300`}>
    <div className={`w-12 h-12 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center mb-4 shadow-sm`}>
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">{desc}</p>
  </div>
);

export default FeatureCard;
