import { useState } from "react";
import { User, BookOpen, Mail, Lock, UserCircle, Save } from "lucide-react";

export default function Settings() {
    const [activeTab, setActiveTab] = useState("preferences");

    // Learning Preferences State
    const [selectedLearningStyle, setSelectedLearningStyle] = useState("visual");
    const [selectedSubjects, setSelectedSubjects] = useState(["Toán học", "Vật lý"]);
    const [selectedInterests, setSelectedInterests] = useState(["Công nghệ", "Đọc sách"]);
    const [selectedFormats, setSelectedFormats] = useState(["video", "quiz"]);
    const [selectedStudyTimes, setSelectedStudyTimes] = useState(["morning", "evening"]);

    // Basic Information State
    const [userInfo, setUserInfo] = useState({
        name: "Nguyễn Văn A",
        email: "nguyenvana@example.com",
        role: "student",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const learningStyles = [
        { value: 'visual', label: 'Trực quan', icon: '👁️' },
        { value: 'auditory', label: 'Nghe giảng', icon: '👂' },
        { value: 'kinesthetic', label: 'Thực hành', icon: '✋' },
        { value: 'reading', label: 'Ghi chép', icon: '📝' }
    ];

    const subjects = [
        'Toán học', 'Vật lý', 'Hóa học', 'Sinh học',
        'Lịch sử', 'Địa lý', 'Kinh tế & pháp luật', 'Công nghệ',
        'Tin học', 'Tiếng Anh', 'Tiếng Nhật', 'Tiếng Pháp',
        'Hoạt động trải nghiệm', 'Giáo dục quốc phòng', 'Giáo dục thể chất'
    ];

    const interests = [
        'Công nghệ', 'Thể thao', 'Nghệ thuật', 'Âm nhạc',
        'Đọc sách', 'Thể thao điện tử', 'Nấu ăn',
        'Nhảy', 'Nhiếp ảnh', 'Mạng xã hội', 'Du lịch'
    ];

    const contentFormats = [
        { value: 'video', label: 'Videos', icon: '🎥' },
        { value: 'text', label: 'Sách & tài liệu', icon: '📄' },
        { value: 'interactive', label: 'Tương tác', icon: '🎮' },
        { value: 'quiz', label: 'Trắc nghiệm', icon: '✅' },
        { value: 'audio', label: 'Podcasts', icon: '🎧' }
    ];

    const studyTimes = [
        { value: 'morning', label: 'Buổi sáng (6AM - 12PM)', icon: '🌅' },
        { value: 'afternoon', label: 'Buổi chiều (12PM - 6PM)', icon: '☀️' },
        { value: 'evening', label: 'Buổi tối (6PM - 10PM)', icon: '🌆' },
        { value: 'night', label: 'Khuya (10PM - 12AM)', icon: '🌙' }
    ];

    const roles = [
        { value: 'student', label: 'Học sinh' },
        { value: 'teacher', label: 'Giáo viên' },
    ];

    const toggleSelection = (array, setArray, item) => {
        if (array.includes(item)) {
            setArray(array.filter(i => i !== item));
        } else {
            setArray([...array, item]);
        }
    };

    const handleSave = () => {
        console.log("Saving settings...", {
            preferences: {
                learningStyle: selectedLearningStyle,
                subjects: selectedSubjects,
                interests: selectedInterests,
                formats: selectedFormats,
                studyTimes: selectedStudyTimes
            },
            userInfo
        });
        alert("Đã lưu cài đặt thành công!");
    };

    return (
        <div className="w-full h-full bg-gray-50 dark:bg-slate-800 p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Cài đặt</h1>
                    <p className="text-gray-600 dark:text-gray-400">Quản lý tùy chỉnh học tập và thông tin cá nhân của bạn</p>
                </div>

                {/* Tabs */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                    <div className="flex border-b border-gray-200 dark:border-slate-700">
                        <button
                            onClick={() => setActiveTab("preferences")}
                            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${activeTab === "preferences"
                                ? "text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-slate-800"
                                }`}
                        >
                            <BookOpen className="w-5 h-5" />
                            <span>Tùy chọn học tập</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("account")}
                            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${activeTab === "account"
                                ? "text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-slate-800"
                                }`}
                        >
                            <User className="w-5 h-5" />
                            <span>Thông tin cá nhân</span>
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6 md:p-8">
                        {activeTab === "preferences" ? (
                            <div className="space-y-8">
                                {/* Learning Style */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                        Phong cách học tập
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {learningStyles.map((style) => (
                                            <button
                                                key={style.value}
                                                onClick={() => setSelectedLearningStyle(style.value)}
                                                className={`p-4 rounded-lg border-2 transition-all ${selectedLearningStyle === style.value
                                                    ? "border-purple-500 dark:border-purple-500 bg-purple-50 dark:bg-purple-900/30 shadow-sm"
                                                    : "border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-500 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800"
                                                    }`}
                                            >
                                                <div className="text-3xl mb-2">{style.icon}</div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {style.label}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Subjects */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                        Môn học yêu thích
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {subjects.map((subject) => (
                                            <button
                                                key={subject}
                                                onClick={() => toggleSelection(selectedSubjects, setSelectedSubjects, subject)}
                                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedSubjects.includes(subject)
                                                    ? "bg-purple-500 dark:bg-purple-600 text-white shadow-sm"
                                                    : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                                                    }`}
                                            >
                                                {subject}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Interests */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                        Sở thích cá nhân
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {interests.map((interest) => (
                                            <button
                                                key={interest}
                                                onClick={() => toggleSelection(selectedInterests, setSelectedInterests, interest)}
                                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedInterests.includes(interest)
                                                    ? "bg-pink-500 dark:bg-pink-600 text-white shadow-sm"
                                                    : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                                                    }`}
                                            >
                                                {interest}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Content Formats */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                        Định dạng nội dung ưa thích
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                        {contentFormats.map((format) => (
                                            <button
                                                key={format.value}
                                                onClick={() => toggleSelection(selectedFormats, setSelectedFormats, format.value)}
                                                className={`p-4 rounded-lg border-2 transition-all ${selectedFormats.includes(format.value)
                                                    ? "border-purple-500 dark:border-purple-500 bg-purple-50 dark:bg-purple-900/30 shadow-sm"
                                                    : "border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-500 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800"
                                                    }`}
                                            >
                                                <div className="text-2xl mb-2">{format.icon}</div>
                                                <div className="text-xs font-medium text-gray-900 dark:text-gray-100">
                                                    {format.label}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Study Times */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                        Thời gian học tập
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {studyTimes.map((time) => (
                                            <button
                                                key={time.value}
                                                onClick={() => toggleSelection(selectedStudyTimes, setSelectedStudyTimes, time.value)}
                                                className={`p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${selectedStudyTimes.includes(time.value)
                                                    ? "border-purple-500 dark:border-purple-500 bg-purple-50 dark:bg-purple-900/30 shadow-sm"
                                                    : "border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-500 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800"
                                                    }`}
                                            >
                                                <span className="text-2xl">{time.icon}</span>
                                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {time.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 max-w-2xl">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                                        <div className="flex items-center gap-2">
                                            <UserCircle className="w-4 h-4" />
                                            Họ và tên
                                        </div>
                                    </label>
                                    <input
                                        type="text"
                                        value={userInfo.name}
                                        onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
                                        placeholder="Nhập họ và tên"
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4" />
                                            Email
                                        </div>
                                    </label>
                                    <input
                                        type="email"
                                        value={userInfo.email}
                                        onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
                                        placeholder="email@example.com"
                                    />
                                </div>

                                {/* Role */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                                        Vai trò
                                    </label>
                                    <select
                                        value={userInfo.role}
                                        onChange={(e) => setUserInfo({ ...userInfo, role: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
                                    >
                                        {roles.map((role) => (
                                            <option key={role.value} value={role.value}>
                                                {role.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Password Section */}
                                <div className="pt-6 border-t border-gray-200 dark:border-slate-700">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                        <Lock className="w-5 h-5" />
                                        Đổi mật khẩu
                                    </h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Mật khẩu hiện tại
                                            </label>
                                            <input
                                                type="password"
                                                value={userInfo.currentPassword}
                                                onChange={(e) => setUserInfo({ ...userInfo, currentPassword: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
                                                placeholder="••••••••"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Mật khẩu mới
                                            </label>
                                            <input
                                                type="password"
                                                value={userInfo.newPassword}
                                                onChange={(e) => setUserInfo({ ...userInfo, newPassword: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
                                                placeholder="••••••••"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Xác nhận mật khẩu mới
                                            </label>
                                            <input
                                                type="password"
                                                value={userInfo.confirmPassword}
                                                onChange={(e) => setUserInfo({ ...userInfo, confirmPassword: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 md:px-8 py-4 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-3">
                        <button
                            className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            Lưu thay đổi
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}