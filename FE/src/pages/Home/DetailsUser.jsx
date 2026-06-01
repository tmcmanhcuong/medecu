import { useState } from 'react'
import { User, Target, Brain, Clock, Award, ChevronRight } from 'lucide-react'
import { useNavigate } from "react-router-dom"
import { message } from 'antd'

// ============================================
// MAIN COMPONENT
// ============================================
export default function DetailsUser() {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    // Basic Info
    fullName: '',
    age: 0,
    gradeLevel: '',

    // Learning Profile
    learningStyle: [],
    preferredSubjects: [],
    difficultSubjects: [],

    // Goals & Interests
    learningGoals: '',
    interests: [],
    careerAspirations: '',

    // Schedule & Preferences
    studyTimePreference: '',
    dailyStudyHours: 1,
    preferredContentFormat: [],

    // Performance & Baseline
    currentLevel: '',
    strengths: [],
    areasForImprovement: []
  })

  const totalSteps = 4

  // ============================================
  // FORM OPTIONS
  // ============================================
  const learningStyles = [
    { value: 'visual', label: 'Trực quan', icon: '👁️' },
    { value: 'auditory', label: 'Nghe giảng', icon: '👂' },
    { value: 'kinesthetic', label: 'Thực hành', icon: '✋' },
    { value: 'reading', label: 'Ghi chép', icon: '📝' }
  ]

  const subjects = [
    'Toán học', 'Vật lý', 'Hóa học', 'Sinh học', 'Ngữ văn',
    'Lịch sử', 'Địa lý', 'Tin học', 'Giáo dục thể chất',
    'Công nghệ', 'Hoạt động trải nghiệm', 'Giáo dục quốc phòng', 'Tiếng Anh', 'Tiếng Pháp', 'Tiếng Nhật', 'Giáo dục KTPL'
  ]

  const interests = [
    'Công nghệ', 'Thể thao', 'Nghệ thuật', 'Âm nhạc', 'Du lịch',
    'Đọc sách', 'Chơi game', 'Thí nghiệm khoa học', 'Nấu ăn',
    'Nhảy múa', 'Nhiếp ảnh', 'Viết lách', 'Mạng xã hội', 'Thiên nhiên'
  ]

  const contentFormats = [
    { value: 'video', label: 'Videos', icon: '🎥' },
    { value: 'text', label: 'Sách & tài liệu', icon: '📄' },
    { value: 'interactive', label: 'Tương tác', icon: '🎮' },
    { value: 'quiz', label: 'Trắc nghiệm', icon: '✅' },
    { value: 'audio', label: 'Podcasts', icon: '🎧' }
  ]

  const studyTimes = [
    { value: 'morning', label: 'Buổi sáng (6AM - 12PM)', icon: '🌅' },
    { value: 'afternoon', label: 'Buổi chiều (12PM - 6PM)', icon: '☀️' },
    { value: 'evening', label: 'Buổi tối (6PM - 10PM)', icon: '🌆' },
    { value: 'night', label: 'Khuya (10PM - 12AM)', icon: '🌙' }
  ]

  // ============================================
  // HANDLERS
  // ============================================
  const handleArrayToggle = (field, value) => {
    const currentArray = formData[field]
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value]

    setFormData({ ...formData, [field]: newArray })
  }

  const exercises = useNavigate()

  const handleNext = () => {
    const errors = validateStep(currentStep)
    if (errors.length > 0) {
      message.error(errors[0])
      return
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      handleSubmit()
      // exercises('/dashboard')
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)

    try {
      await submitStudentDetails(formData)

      alert('✅ Profile created successfully!')
      exercises('/dashboard')

    } catch (error) {
      console.error('Error submitting details:', error)
      alert('❌ Failed to save profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const validateStep = (step) => {
    const errors = []

    if (step === 1) {
      if (!formData.fullName.trim()) errors.push("Vui lòng nhập tên của bạn")
      if (!formData.age || formData.age <= 0) errors.push("Vui lòng nhập tuổi hợp lệ")
      if (!formData.gradeLevel) errors.push("Vui lòng chọn trình độ hiện tại")
      if (!formData.currentLevel) errors.push("Vui lòng chọn mức độ kiến thức")
    }

    if (step === 2) {
      if (formData.learningStyle.length === 0)
        errors.push("Vui lòng chọn ít nhất 1 kiểu học")
      if (formData.preferredSubjects.length === 0)
        errors.push("Vui lòng chọn môn học yêu thích")
      if (formData.difficultSubjects.length === 0)
        errors.push("Vui lòng chọn môn học bạn thấy khó")
    }

    if (step === 3) {
      if (!formData.learningGoals.trim())
        errors.push("Vui lòng nhập mục tiêu học tập")
      if (formData.interests.length === 0)
        errors.push("Vui lòng chọn ít nhất 1 sở thích")
    }

    if (step === 4) {
      if (!formData.studyTimePreference)
        errors.push("Vui lòng chọn giờ học yêu thích")
      if (!formData.dailyStudyHours)
        errors.push("Vui lòng chọn thời lượng học mỗi ngày")
      if (formData.preferredContentFormat.length === 0)
        errors.push("Vui lòng chọn hình thức học bạn thích")
    }

    return errors
  }


  // ============================================
  // RENDER STEPS
  // ============================================
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <User className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Thông tin cơ bản</h2>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Chúng mình có thể gọi bạn là *
        </label>
        <input
          type="text"
          value={formData.fullName}
          required
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Nhập tên đầy đủ hoặc tên bạn muốn gọi"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tuổi *
          </label>
          <input
            type="number"
            value={formData.age || ''}
            onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
            className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Tuổi của bạn"
            min="5"
            max="100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Trình độ *
          </label>
          <select
            value={formData.gradeLevel}
            onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="" disabled>Trình độ hiện tại</option>
            <option value="high10">Lớp 10 (THPT)</option>
            <option value="high11">Lớp 11 (THPT)</option>
            <option value="high12">Lớp 12 (THPT)</option>
            <option value="college">Cao đẳng/ Đại học</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Kiến thức *
        </label>
        <select
          value={formData.currentLevel}
          onChange={(e) => setFormData({ ...formData, currentLevel: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="" disabled>Chọn mức độ kiến thức hiện tại</option>
          <option value="beginner">Cơ bản – Chưa vững kiến thức</option>
          <option value="intermediate">Khá – Nắm được kiến thức nền tảng</option>
          <option value="advanced">Giỏi – Thành thạo và hiểu sâu</option>
        </select>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-6 h-6 text-purple-600" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Đi sâu hơn một chút nhé</h2>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Bạn tiếp thu kiến thức tốt nhất qua hình thức nào (Có thể chọn tất cả) *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {learningStyles.map((style) => (
            <button
              key={style.value}
              type="button"
              onClick={() => handleArrayToggle('learningStyle', style.value)}
              className={`p-4 border-2 rounded-lg text-left transition-all ${formData.learningStyle.includes(style.value)
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 dark:border-slate-700 hover:border-purple-300'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{style.icon}</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{style.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Môn học bạn yêu thích (Có thể chọn nhiều môn) *
        </label>
        <div className="flex flex-wrap gap-2">
          {subjects.map((subject) => (
            <button
              key={subject}
              type="button"
              onClick={() => handleArrayToggle('preferredSubjects', subject)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${formData.preferredSubjects.includes(subject)
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
            >
              {subject}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Môn học bạn cảm thấy khó khăn lúc học (Có thể chọn nhiều môn) *
        </label>
        <div className="flex flex-wrap gap-2">
          {subjects.map((subject) => (
            <button
              key={subject}
              type="button"
              onClick={() => handleArrayToggle('difficultSubjects', subject)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${formData.difficultSubjects.includes(subject)
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
            >
              {subject}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Target className="w-6 h-6 text-green-600" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mục tiêu & sở thích của bạn</h2>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Mục tiêu học tập của bạn là... *
        </label>
        <textarea
          value={formData.learningGoals}
          onChange={(e) => setFormData({ ...formData, learningGoals: e.target.value })}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="Cải thiện điểm, chuẩn bị cho bài kiểm tra 1 tiết, học thêm kĩ năng mới..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Sở thích của bạn *
        </label>
        <div className="flex flex-wrap gap-2">
          {interests.map((interest) => (
            <button
              key={interest}
              type="button"
              onClick={() => handleArrayToggle('interests', interest)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${formData.interests.includes(interest)
                  ? 'bg-blue-500 dark:bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
            >
              {interest}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Trong tương lai bạn muốn... (Tùy chọn)
        </label>
        <input
          type="text"
          value={formData.careerAspirations}
          onChange={(e) => setFormData({ ...formData, careerAspirations: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="Vào được môi trường mơ ước, công việc yêu thích,..."
        />
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Clock className="w-6 h-6 text-indigo-600" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Thói quen học tập của bạn</h2>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Giờ học yêu thích *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {studyTimes.map((time) => (
            <button
              key={time.value}
              type="button"
              onClick={() => setFormData({ ...formData, studyTimePreference: time.value })}
              className={`p-4 border-2 rounded-lg text-left transition-all ${formData.studyTimePreference === time.value
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 dark:border-slate-700 hover:border-indigo-300'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{time.icon}</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{time.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Một ngày bạn có thể học được... *
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0.5"
            max="8"
            step="0.5"
            value={formData.dailyStudyHours}
            onChange={(e) => setFormData({ ...formData, dailyStudyHours: parseFloat(e.target.value) })}
            className="flex-1"
          />
          <span className="text-2xl font-bold text-indigo-600 min-w-[80px]">
            {formData.dailyStudyHours}h
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Hình thức học *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {contentFormats.map((format) => (
            <button
              key={format.value}
              type="button"
              onClick={() => handleArrayToggle('preferredContentFormat', format.value)}
              className={`p-4 border-2 rounded-lg text-left transition-all ${formData.preferredContentFormat.includes(format.value)
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 dark:border-slate-700 hover:border-indigo-300'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{format.icon}</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{format.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Bước {currentStep} trên {totalSteps}
            </span>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {Math.round((currentStep / totalSteps) * 100)}% Hoàn thành
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blueish transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${currentStep === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-slate-800'
                }`}
            >
              ← Quay lại
            </button>

            <button
              onClick={handleNext}
              disabled={loading}
              className="px-8 py-3 bg-blueish text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                'Đang lưu...'
              ) : currentStep === totalSteps ? (
                <>
                  <Award className="w-5 h-5" />
                  Hoàn tất hồ sơ
                </>
              ) : (
                <>
                  Tiếp theo
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// API FUNCTIONS - TODO: Import và implement
// ============================================

/**
 * Submit student details to backend
 */
async function submitStudentDetails(data) {
  const SERVER_BACKEND = import.meta.env.VITE_SERVER_BACKEND || '/api/v1';
  const API_URL = `${SERVER_BACKEND}/learning-profile/`

  const token = localStorage.getItem('access_token')

  if (!token) {
    throw new Error('No authentication token found')
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to submit details')
  }

  return response.json()
}