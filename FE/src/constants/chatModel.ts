import { GraduationCap, Search } from 'lucide-react';

export const chatModel = [
  {
    id: 'education-assistant',
    title: 'Education Assistant',
    description: 'Trợ lý giáo dục chuyên nghiệp, hỗ trợ tư vấn và giải đáp mọi vấn đề về giảng dạy',
    icon: GraduationCap,
    gradient: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
    active: true,
    status: 'Đang hoạt động'
  },
  {
    id: 'research-assistant',
    title: 'Research Assistant',
    description: 'Trợ lý nghiên cứu thông minh, giúp tìm kiếm và phân tích tài liệu học thuật',
    icon: Search,
    gradient: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50',
    active: false,
    status: 'Sắp ra mắt'
  }
];
