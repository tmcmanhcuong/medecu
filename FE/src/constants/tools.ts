import { BookOpen, Presentation, ClipboardList, FileText, Brain, Target } from 'lucide-react';

export const tools = [
  {
    id: 'lesson-plan',
    title: 'Generate Lesson Plan',
    description: 'Tạo kế hoạch bài giảng chi tiết và chuyên nghiệp cho từng môn học',
    icon: BookOpen,
    gradient: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    path: '/lesson-plan',
    active: true
  },
  {
    id: 'slide-content',
    title: 'Generate Slide Content',
    description: 'Tạo slides thuyết trình PowerPoint với nội dung chi tiết và bố cục đẹp mắt',
    icon: Presentation,
    gradient: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    path: '/slide-content',
    active: true
  },
  {
    id: 'test-generator',
    title: 'Generate Quizzes',
    description: 'Tạo đề thi và bài kiểm tra tự động với nhiều mức độ khó khác nhau',
    icon: ClipboardList,
    gradient: 'from-indigo-500 to-indigo-600',
    bgColor: 'bg-indigo-50',
    path: '/quiz',
    active: true
  },
  {
    id: 'worksheet-generator',
    title: 'Generate worksheet',
    description: 'Tạo bài tập và worksheet tương tác cho học sinh với nhiều dạng câu hỏi',
    icon: FileText,
    gradient: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50',
    path: '/tools/worksheet-generator',
    active: false,
    status: 'Sắp ra mắt'
  },
  {
    id: 'mind-map',
    title:'Generate Mindmap',
    description: 'Tạo sơ đồ tư duy trực quan và logic cho các chủ đề bài học',
    icon: Brain,
    gradient: 'from-pink-500 to-rose-600',
    bgColor: 'bg-pink-50',
    path: '/tools/mind-map',
    active: false,
    status: 'Sắp ra mắt'
  },
  {
    id: 'lesson-evaluation',
    title: 'Evaluate Lesson Plan',
    description: 'Phân tích và đánh giá chất lượng kế hoạch giảng dạy một cách khoa học',
    icon: Target,
    gradient: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-50',
    path: '/tools/lesson-evaluation',
    active: false,
    status: 'Sắp ra mắt'
  }
];
