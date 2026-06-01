import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, Wrench, BookOpen, FileText, ClipboardList, ChevronDown, Presentation, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext.jsx';
import logoImg from '../assets/logo.jpg';

const AiTechIcon = ({ className }) => (
  <svg
    className={className}
    version="1.0"
    xmlns="http://www.w3.org/2000/svg"
    width="30.000000pt"
    height="512.000000pt"
    viewBox="0 0 512.000000 512.000000"
    preserveAspectRatio="xMidYMid meet"
  >
    <g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)" fill="#ffffff" stroke="none">
      <path d="M2303 5110 c-82 -6 -114 -13 -165 -37 -72 -34 -137 -95 -176 -167 -27 -49 -28 -50 -112 -72 -214 -57 -442 -181 -621 -339 -297 -261 -495 -658 -524 -1050 -20 -282 -34 -744 -24 -833 16 -148 53 -273 119 -407 147 -300 390 -515 702 -621 89 -30 372 -88 530 -108 504 -65 1038 -35 1497 84 347 91 629 318 786 635 94 189 127 337 126 564 0 200 -19 639 -32 741 -39 324 -166 609 -384 862 -183 214 -494 407 -765 476 -73 19 -76 20 -102 68 -41 74 -101 132 -173 165 -55 26 -83 32 -187 39 -140 11 -346 10 -495 0z m560 -221 c50 -13 104 -62 117 -107 15 -56 13 -246 -4 -286 -28 -67 -22 -66 -416 -66 -313 0 -358 2 -379 16 -38 27 -51 74 -51 186 0 217 37 257 250 268 151 8 431 2 483 -11z m-795 -1249 c70 -37 100 -68 140 -144 27 -50 27 -54 27 -241 0 -188 0 -191 -28 -247 -30 -62 -83 -115 -149 -150 -39 -21 -56 -23 -188 -23 -133 0 -149 2 -194 24 -66 33 -122 91 -154 160 -23 50 -27 71 -30 194 -6 207 11 278 91 364 76 83 140 104 302 100 115 -3 123 -4 183 -37z m1370 11 c68 -31 144 -113 169 -183 15 -43 18 -84 18 -223 0 -164 -1 -172 -27 -227 -35 -76 -104 -141 -176 -168 -50 -19 -73 -21 -187 -18 -111 3 -136 7 -173 26 -66 35 -119 88 -149 150 -28 56 -28 59 -28 247 0 182 1 192 25 240 42 86 124 153 215 176 17 4 82 7 145 5 95 -2 124 -6 168 -25z" />
      <path d="M718 1314 c-76 -23 -167 -92 -215 -162 -71 -105 -73 -116 -73 -538 0 -247 4 -381 11 -397 25 -54 89 -67 234 -47 165 24 294 87 405 199 128 129 185 266 200 486 10 139 25 195 80 301 30 57 31 65 20 98 -6 20 -23 45 -37 56 -24 19 -40 20 -302 19 -211 0 -287 -4 -323 -15z" />
      <path d="M1760 1316 c-173 -48 -310 -186 -355 -357 -22 -81 -21 -515 1 -590 53 -179 204 -321 382 -358 74 -15 1471 -15 1544 0 180 38 329 178 382 358 21 72 23 509 2 586 -47 177 -184 314 -361 361 -70 19 -1527 19 -1595 0z" />
      <path d="M3778 1310 c-15 -11 -32 -36 -38 -56 -11 -33 -10 -41 20 -98 55 -106 70 -162 80 -301 15 -220 72 -357 200 -486 111 -112 240 -175 405 -199 147 -21 211 -7 235 50 7 18 10 152 8 416 l 3 389 -33 68 c-43 86 -113 156 -199 199 l-67 33 -291 3 c-281 3 -292 2 -317 -18z" />
    </g>
  </svg>
);

const Header = () => {
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const tools = [
    {
      id: 'lesson-plan',
      title: 'Sinh Kế Hoạch Giảng Dạy',
      description: 'Tạo kế hoạch bài giảng chi tiết và chuyên nghiệp cho từng môn học',
      icon: BookOpen,
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      path: '/lesson-plan'
    },
    {
      id: 'slide-content',
      title: 'Sinh Nội Dung Slides',
      description: 'Tạo slides thuyết trình PowerPoint với nội dung chi tiết và bố cục đẹp mắt',
      icon: Presentation,
      gradient: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      path: '/slide-content'
    },
    {
      id: 'test-generator',
      title: 'Sinh Đề Kiểm Tra',
      description: 'Tạo đề thi và bài kiểm tra tự động với nhiều mức độ khó khác nhau',
      icon: ClipboardList,
      gradient: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      path: '/quiz'
    }
  ];

  const handleChatClick = () => {
    navigate('/chat-overview');
  };

  return (
    <header className="fixed top-0 left-0 w-full bg-surface-canvas/80 dark:bg-surface-tile-1/80 backdrop-blur-md border-b border-divider-hairline dark:border-surface-tile-3 z-[100]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img src={logoImg} alt="EduMate Logo" className="w-9 h-9 object-contain -hue-rotate-60 brightness-110" />
            <div>
              <h1 className="text-[21px] font-display font-semibold tracking-[0.231px] text-ink dark:text-ink-on-dark leading-none">
                EduMate
              </h1>
              <p className="text-[12px] font-body text-ink-muted-48 dark:text-ink-muted-80 tracking-[-0.12px] mt-0.5">AI Education Assistant</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-1 relative z-50">
            <Link
              to="/signin"
              className="px-4 py-2 text-[14px] font-body font-normal text-ink dark:text-ink-on-dark hover:text-brand dark:hover:text-brand-on-dark transition-colors"
            >
              Đăng nhập
            </Link>

            <div className="h-4 w-px bg-divider-hairline dark:bg-surface-tile-3 mx-2"></div>

            <Link
              to="/signup"
              className="btn-primary text-[14px] px-[15px] py-[6px] ml-1"
            >
              Đăng ký
            </Link>

            <button
              onClick={toggleTheme}
              className="p-2 ml-4 rounded-full text-ink dark:text-ink-on-dark hover:bg-surface-parchment dark:hover:bg-surface-tile-2 transition-colors"
              title={theme === 'dark' ? 'Chuyển sang nền sáng' : 'Chuyển sang nền tối'}
            >
              {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;