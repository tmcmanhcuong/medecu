import React from 'react';

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  desc: string;
  color: string;
  bgColor: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, desc, color, bgColor }) => (
  <div className={`${bgColor} rounded-2xl p-6 border border-white shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300`}>
    <div className={`w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm`}>
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 text-sm leading-relaxed mb-4">{desc}</p>
  </div>
);

export default FeatureCard;
