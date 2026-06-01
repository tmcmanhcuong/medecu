import { useState } from "react";
import { Menu, X, Trash2 } from "lucide-react";
import { getMockJob, submitMockAnswers, getMockAnalysis } from "../services/mock.jsx";

const BE_BASE = import.meta.env.VITE_BE_BASE_URL || "http://localhost:8000";

export default function PersonalizedExercises() {
  const [formData, setFormData] = useState({
    topic: "algorithms",
    difficulty: "medium",
    target_count: 5,
    exercise_type: "mcq",
    // Fixed for the new prompt contract
    grade_level: "university",
    language: "vi",
    subject: "computer_science",
    // Toggle to switch prompt mode
    exercise_mode: "theory",   // "theory" | "coding"
    python_version: "3.10"
  });

  const [studentContext, setStudentContext] = useState({
    student_id: "hs_001",
    recent_performance: { correct_ratio: 0.7 },
    known_misconceptions: ["quên quy đồng mẫu số"],
    learning_goals: ["chuẩn bị thi THPT Quốc gia"]
  });

  const [status, setStatus] = useState("");
  const [job, setJob] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Answer selection state
  const [answers, setAnswers] = useState({}); // { [exercise_id]: "A" | "B" | "C" | "D" }
  const [verdict, setVerdict] = useState(null); // response from submitAnswers
  const [revealed, setRevealed] = useState(false);

  // Analysis state
  const [analysisJob, setAnalysisJob] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState("");

  const difficultyOptions = [
    { value: "easy", label: "Dễ" },
    { value: "medium", label: "Trung bình" },
    { value: "hard", label: "Khó" },
    { value: "adaptive", label: "Tự động" }
  ];

  const exerciseTypeOptions = [
    { value: "mcq", label: "Trắc nghiệm" },
    { value: "fill_blank", label: "Điền trống" },
    { value: "true_false", label: "Đúng/Sai" }
  ];

  const onSubmit = async (e) => {
    e.preventDefault();
    // setStatus("Đang tạo bài tập...");
    setStatus("Đang tạo bài tập (mock)...");
    setSidebarOpen(false);

    try {
      //   const payload = {
      //   type: "personalized_exercises",
      //   payload: {
      //     form_data: formData,
      //     student_context: studentContext,
      //     model: "gemini-2.5-flash",
      //     temperature: 0.4
      //   }
      // };

      const created = await getMockJob();
      setJob(created);
      setStatus("Hoàn thành!");
    } catch (err) {
      setStatus("Lỗi khi tạo bài tập (mock)");
    }
  }

  const handleClear = () => {
    setFormData({
      topic: "algorithms",
      difficulty: "medium",
      target_count: 5,
      exercise_type: "mcq",
      grade_level: "university",
      language: "vi",
      subject: "computer_science",
      exercise_mode: "theory",
      python_version: "3.10"
    });
    setStudentContext({
      student_id: "hs_001",
      recent_performance: { correct_ratio: 0.7 },
      known_misconceptions: [],
      learning_goals: []
    });
    setStatus("");
    setJob(null);
    setAnswers({});
    setVerdict(null);
    setRevealed(false);
    setAnalysisJob(null);
    setAnalysisResult(null);
    setAnalysisStatus("");
  };

  const handleSubmitAnswers = async () => {
    if (!job?.id) return;

    try {
      // Chấm điểm bằng dữ liệu mock
      const res = await submitMockAnswers(answers);
      setVerdict(res);
      setRevealed(true);

      // Phân tích mock
      setAnalysisStatus("Đang phân tích kết quả (mock)...");
      const analysisResult = await getMockAnalysis(answers);
      setAnalysisResult(analysisResult);
      setAnalysisStatus("Phân tích hoàn thành!");
    } catch (error) {
      console.error("Submit error:", error);
      setStatus("Lỗi khi nộp bài (mock)");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-800 flex relative">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 transition-all duration-300 ease-in-out z-50 shadow-sm ${sidebarOpen ? 'w-96' : 'w-0 lg:w-0'
          } overflow-hidden flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <h2 className={`font-semibold text-gray-900 dark:text-gray-100 transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 lg:opacity-0'}`}>
            Cài đặt
          </h2>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Sidebar Content - No scroll, fixed height */}
        <div className={`flex-1 p-4 ${sidebarOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
          <div className="space-y-3">
            {/* Basic Settings */}
            <div>
              <label className="block text-xs font-medium text-gray-900 dark:text-gray-100 mb-1.5">
                Chủ đề
              </label>
              <input
                value={formData.topic}
                onChange={e => setFormData({ ...formData, topic: e.target.value })}
                className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-transparent"
                placeholder="Nhập chủ đề..."
              />
            </div>

            {/* Row 1: Số câu hỏi và Chế độ bài tập */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-900 dark:text-gray-100 mb-1.5">
                  Số câu hỏi
                </label>
                <input
                  type="number"
                  value={formData.target_count}
                  onChange={e => setFormData({ ...formData, target_count: parseInt(e.target.value || "1") })}
                  className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-transparent"
                  min="1"
                  max="10"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-900 dark:text-gray-100 mb-1.5">
                  Chế độ
                </label>
                <select
                  value={formData.exercise_mode}
                  onChange={e => setFormData({ ...formData, exercise_mode: e.target.value })}
                  className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-transparent appearance-none bg-white dark:bg-slate-900"
                >
                  <option value="theory">Lý thuyết / Phân tích</option>
                  <option value="coding">Bài tập lập trình (Python)</option>
                </select>
              </div>
            </div>

            {/* Row 2: Mức độ và Loại bài */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-900 dark:text-gray-100 mb-1.5">
                  Mức độ
                </label>
                <select
                  value={formData.difficulty}
                  onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-transparent appearance-none bg-white dark:bg-slate-900"
                >
                  {difficultyOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-900 dark:text-gray-100 mb-1.5">
                  Loại bài tập
                </label>
                <select
                  value={formData.exercise_type}
                  onChange={e => setFormData({ ...formData, exercise_type: e.target.value })}
                  className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-transparent appearance-none bg-white dark:bg-slate-900"
                >
                  {exerciseTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {formData.exercise_mode === "coding" && (
              <div>
                <label className="block text-xs font-medium text-gray-900 dark:text-gray-100 mb-1.5">
                  Phiên bản Python
                </label>
                <input
                  value={formData.python_version}
                  onChange={e => setFormData({ ...formData, python_version: e.target.value })}
                  className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-transparent"
                  placeholder="3.10"
                />
              </div>
            )}

            {/* Student Context */}
            <div className="pt-3 border-t border-gray-200 dark:border-slate-700">
              <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-3">Thông tin học sinh</h3>

              <div className="space-y-3">
                {/* Row 3: ID học sinh and Tỷ lệ đúng */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      ID học sinh
                    </label>
                    <input
                      value={studentContext.student_id}
                      onChange={e => setStudentContext({ ...studentContext, student_id: e.target.value })}
                      className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-transparent"
                      placeholder="hs_001"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Tỷ lệ đúng (0-1)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={studentContext.recent_performance.correct_ratio}
                      onChange={e => setStudentContext({
                        ...studentContext,
                        recent_performance: { ...studentContext.recent_performance, correct_ratio: parseFloat(e.target.value) }
                      })}
                      className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Lỗi thường gặp
                  </label>
                  <input
                    value={studentContext.known_misconceptions.join(", ")}
                    onChange={e => {
                      const value = e.target.value;
                      const items = value.includes(",")
                        ? value.split(",").map(s => s.trim()).filter(s => s)
                        : [value];
                      setStudentContext({
                        ...studentContext,
                        known_misconceptions: items
                      });
                    }}
                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-transparent"
                    placeholder="Nhập lỗi..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Mục tiêu
                  </label>
                  <input
                    value={studentContext.learning_goals.join(", ")}
                    onChange={e => {
                      const value = e.target.value;
                      const items = value.includes(",")
                        ? value.split(",").map(s => s.trim()).filter(s => s)
                        : [value];
                      setStudentContext({
                        ...studentContext,
                        learning_goals: items
                      });
                    }}
                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 flex:ring-gray-900 focus:border-transparent"
                    placeholder="Nhập mục tiêu..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className={`p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 shrink-0 ${sidebarOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
          <div className="flex gap-2">
            <button
              onClick={onSubmit}
              disabled={status.includes("Đang")}
              className="flex-[8] bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              {status.includes("Đang") ? "Đang tạo..." : "Tạo bài tập"}
            </button>
            <button
              onClick={handleClear}
              className="flex-[2] bg-gray-200 hover:bg-gray-300 text-gray-700 dark:text-gray-300 p-2.5 rounded-lg transition-colors flex items-center justify-center"
              title="Xóa tất cả"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Toggle button for mobile when sidebar is closed */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="fixed top-4 left-4 z-40 lg:hidden bg-white dark:bg-slate-900 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}

        {/* Split-screen layout when exercises are displayed */}
        {job?.result_payload?.exercises ? (
          <div className="flex h-screen">
            {/* Left side - Exercises */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700">
              <div className="max-w-4xl mx-auto p-6 lg:p-8">
                {/* Progress Header */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                      {formData.topic}
                    </h2>
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Đã trả lời: {Object.keys(answers).length}/{job.result_payload.exercises.length}
                      </div>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gray-900 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(Object.keys(answers).length / job.result_payload.exercises.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {status && (
                    <div className={`px-4 py-3 rounded-lg text-sm ${status === "Hoàn thành!" ? "bg-green-50 text-green-800 border border-green-200" :
                      status.includes("Đang") ? "bg-blue-50 text-blue-800 border border-blue-200" :
                        "bg-red-50 text-red-800 border border-red-200"
                      }`}>
                      {status}
                    </div>
                  )}
                </div>

                {/* Exercises */}
                <div className="space-y-6">
                  {job.result_payload.exercises.map((exercise, index) => (
                    <div key={exercise.id} className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 hover:border-gray-300 dark:border-slate-600 transition-all duration-200 hover:shadow-sm">
                      <div className="flex items-start justify-between mb-4">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Câu {index + 1}
                        </span>
                        <span className="text-xs text-gray-400">
                          {exercise.difficulty}
                        </span>
                      </div>

                      <p className="text-base text-gray-900 dark:text-gray-100 mb-4 leading-relaxed">
                        {exercise.prompt}
                      </p>

                      <div className="space-y-2 mb-4">
                        {exercise.options?.map((option, optionIndex) => {
                          const label = option.slice(0, 1); // "A" from "A. text"
                          const isSelected = answers[exercise.id] === label;
                          const isCorrect = revealed && verdict &&
                            verdict.results.find(r => r.exercise_id === exercise.id)?.correct_answer === label;
                          const isWrong = revealed && verdict &&
                            verdict.results.find(r => r.exercise_id === exercise.id)?.selected_answer === label &&
                            !verdict.results.find(r => r.exercise_id === exercise.id)?.is_correct;

                          return (
                            <label
                              key={optionIndex}
                              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-sm cursor-pointer ${isCorrect ? "border-green-500 bg-green-50" :
                                isWrong ? "border-red-500 bg-red-50" :
                                  isSelected ? "border-gray-900 bg-gray-50 dark:bg-slate-800" :
                                    "border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:border-slate-600"
                                }`}
                            >
                              <input
                                type="radio"
                                name={`ex-${exercise.id}`}
                                value={label}
                                checked={isSelected}
                                onChange={() => setAnswers({ ...answers, [exercise.id]: label })}
                                className="accent-gray-900"
                                disabled={revealed}
                              />
                              <span>{option}</span>
                            </label>
                          );
                        })}
                      </div>

                      {revealed && verdict && (
                        <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 border border-gray-100">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Kết quả</p>
                            <span className={`text-xs px-2 py-1 rounded ${verdict.results.find(r => r.exercise_id === exercise.id)?.is_correct
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                              }`}>
                              {verdict.results.find(r => r.exercise_id === exercise.id)?.is_correct ? "Đúng" : "Sai"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            Bạn chọn: {verdict.results.find(r => r.exercise_id === exercise.id)?.selected_answer} —
                            Đáp án đúng: {verdict.results.find(r => r.exercise_id === exercise.id)?.correct_answer}
                          </p>
                          {verdict.results.find(r => r.exercise_id === exercise.id)?.explanation && (
                            <>
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Giải thích</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                {verdict.results.find(r => r.exercise_id === exercise.id)?.explanation}
                              </p>
                            </>
                          )}
                        </div>
                      )}

                      {exercise.tags && exercise.tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {exercise.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 text-xs px-2 py-1 rounded-md"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Submit Button */}
                  {!revealed && (
                    <div className="text-center pt-6 border-t border-gray-200 dark:border-slate-700">
                      <button
                        onClick={handleSubmitAnswers}
                        disabled={Object.keys(answers).length !== job.result_payload.exercises.length}
                        className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg text-sm font-medium transition-colors shadow-sm"
                      >
                        Nộp bài ({Object.keys(answers).length}/{job.result_payload.exercises.length})
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right side - Analysis Panel */}
            <div className="w-96 bg-gray-50 dark:bg-slate-800 border-l border-gray-200 dark:border-slate-700 overflow-y-auto">
              <div className="p-6">
                {!revealed ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Phân tích kết quả</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Hoàn thành bài tập để xem phân tích chi tiết</p>
                  </div>
                ) : (
                  <div>
                    {/* Analysis Status */}
                    {analysisStatus && (
                      <div className={`px-4 py-3 rounded-lg mb-6 text-sm ${analysisStatus === "Phân tích hoàn thành!" ? "bg-green-50 text-green-800 border border-green-200" :
                        analysisStatus.includes("Đang") ? "bg-blue-50 text-blue-800 border border-blue-200" :
                          "bg-red-50 text-red-800 border border-red-200"
                        }`}>
                        {analysisStatus}
                      </div>
                    )}

                    {/* Quick Results Summary */}
                    {verdict && (
                      <div className="bg-white dark:bg-slate-900 rounded-lg p-4 mb-6 border border-gray-200 dark:border-slate-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Kết quả nhanh</h3>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            {verdict.summary.correct}/{verdict.summary.total}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            Tỷ lệ: {Math.round((verdict.summary.correct / verdict.summary.total) * 100)}%
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gray-900 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${(verdict.summary.correct / verdict.summary.total) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Detailed Analysis */}
                    {analysisResult && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Phân tích chi tiết</h3>

                        {/* Debug: Show raw data if available */}
                        {process.env.NODE_ENV === 'development' && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                            <h4 className="text-xs font-medium text-yellow-800 mb-2">Debug Info:</h4>
                            <pre className="text-xs text-yellow-700 overflow-auto max-h-32">
                              {JSON.stringify(analysisResult, null, 2)}
                            </pre>
                          </div>
                        )}

                        {analysisResult.analysis_summary && (
                          <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Tóm tắt</h4>
                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                              <p><strong>Hiệu suất:</strong> {analysisResult.analysis_summary.overall_performance}</p>
                              <p><strong>Độ tin cậy:</strong> {Math.round(analysisResult.analysis_summary.confidence_score * 100)}%</p>
                              {analysisResult.analysis_summary.key_insights && analysisResult.analysis_summary.key_insights.length > 0 && (
                                <div>
                                  <p><strong>Nhận xét chính:</strong></p>
                                  <ul className="list-disc list-inside space-y-1 mt-1">
                                    {analysisResult.analysis_summary.key_insights.map((insight, idx) => (
                                      <li key={idx}>{insight}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {analysisResult.detailed_analysis?.strengths && analysisResult.detailed_analysis.strengths.length > 0 && (
                          <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                            <h4 className="font-medium text-green-800 mb-2">Điểm mạnh</h4>
                            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                              {analysisResult.detailed_analysis.strengths.map((strength, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="text-green-600 mr-2">•</span>
                                  {strength}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {analysisResult.detailed_analysis?.weaknesses && analysisResult.detailed_analysis.weaknesses.length > 0 && (
                          <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                            <h4 className="font-medium text-red-800 mb-2">Cần cải thiện</h4>
                            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                              {analysisResult.detailed_analysis.weaknesses.map((weakness, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="text-red-600 mr-2">•</span>
                                  {weakness}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {analysisResult.detailed_analysis?.misconceptions && analysisResult.detailed_analysis.misconceptions.length > 0 && (
                          <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                            <h4 className="font-medium text-orange-800 mb-2">Hiểu sai cần sửa</h4>
                            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                              {analysisResult.detailed_analysis.misconceptions.map((misconception, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="text-orange-600 mr-2">•</span>
                                  {misconception}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {analysisResult.recommendations && (
                          <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                            <h4 className="font-medium text-blue-800 mb-2">Khuyến nghị</h4>
                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                              {analysisResult.recommendations.next_topics && analysisResult.recommendations.next_topics.length > 0 && (
                                <div>
                                  <p><strong>Chủ đề tiếp theo:</strong></p>
                                  <ul className="list-disc list-inside space-y-1 mt-1">
                                    {analysisResult.recommendations.next_topics.map((topic, idx) => (
                                      <li key={idx}>{topic}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              <p><strong>Độ khó:</strong> {analysisResult.recommendations.difficulty_adjustment}</p>
                              <p><strong>Số bài tập:</strong> {analysisResult.recommendations.practice_count}</p>
                              {analysisResult.recommendations.learning_strategies && analysisResult.recommendations.learning_strategies.length > 0 && (
                                <div>
                                  <p><strong>Chiến lược học tập:</strong></p>
                                  <ul className="list-disc list-inside space-y-1 mt-1">
                                    {analysisResult.recommendations.learning_strategies.map((strategy, idx) => (
                                      <li key={idx}>{strategy}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {analysisResult.recommendations.immediate_actions && analysisResult.recommendations.immediate_actions.length > 0 && (
                                <div>
                                  <p><strong>Hành động ngay:</strong></p>
                                  <ul className="list-disc list-inside space-y-1 mt-1">
                                    {analysisResult.recommendations.immediate_actions.map((action, idx) => (
                                      <li key={idx}>{action}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Additional Analysis Fields */}
                        {analysisResult.summary && (
                          <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                            <h4 className="font-medium text-purple-800 mb-2">Tổng kết</h4>
                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                              <p><strong>Điểm số:</strong> {analysisResult.summary.correct}/{analysisResult.summary.total} ({Math.round(analysisResult.summary.score_pct * 100)}%)</p>
                              <p><strong>Độ khó phù hợp:</strong> {
                                analysisResult.summary.difficulty_fit === 'too_easy' ? 'Quá dễ' :
                                  analysisResult.summary.difficulty_fit === 'just_right' ? 'Vừa phải' :
                                    analysisResult.summary.difficulty_fit === 'too_hard' ? 'Quá khó' :
                                      analysisResult.summary.difficulty_fit
                              }</p>
                              <p><strong>Tiềm năng cải thiện:</strong> {
                                analysisResult.summary.improvement_potential === 'high' ? 'Cao' :
                                  analysisResult.summary.improvement_potential === 'medium' ? 'Trung bình' :
                                    analysisResult.summary.improvement_potential === 'low' ? 'Thấp' :
                                      analysisResult.summary.improvement_potential
                              }</p>
                            </div>
                          </div>
                        )}

                        {analysisResult.adaptive_strategy && (
                          <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                            <h4 className="font-medium text-indigo-800 mb-2">Chiến lược thích ứng</h4>
                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                              <p><strong>Tiến độ độ khó:</strong> {
                                analysisResult.adaptive_strategy.difficulty_progression === 'gradual' ? 'Từ từ' :
                                  analysisResult.adaptive_strategy.difficulty_progression === 'moderate' ? 'Vừa phải' :
                                    analysisResult.adaptive_strategy.difficulty_progression === 'aggressive' ? 'Nhanh' :
                                      analysisResult.adaptive_strategy.difficulty_progression
                              }</p>
                              <p><strong>Chiến lược khoảng cách:</strong> {
                                analysisResult.adaptive_strategy.spacing_strategy === 'massed' ? 'Tập trung' :
                                  analysisResult.adaptive_strategy.spacing_strategy === 'distributed' ? 'Phân tán' :
                                    analysisResult.adaptive_strategy.spacing_strategy === 'interleaved' ? 'Xen kẽ' :
                                      analysisResult.adaptive_strategy.spacing_strategy
                              }</p>
                              <p><strong>Lịch ôn tập:</strong> {
                                analysisResult.adaptive_strategy.review_schedule === 'immediate' ? 'Ngay lập tức' :
                                  analysisResult.adaptive_strategy.review_schedule === 'delayed' ? 'Trì hoãn' :
                                    analysisResult.adaptive_strategy.review_schedule === 'spaced' ? 'Có khoảng cách' :
                                      analysisResult.adaptive_strategy.review_schedule
                              }</p>
                              <p><strong>Ngưỡng thành thạo:</strong> {Math.round(analysisResult.adaptive_strategy.mastery_threshold * 100)}%</p>
                            </div>
                          </div>
                        )}

                        <div className="pt-4">
                          <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                          >
                            Tạo bài tập mới
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Default layout when no exercises */
          <div className="max-w-4xl mx-auto p-6 lg:p-8">
            {status && (
              <div className={`px-4 py-3 rounded-lg mb-6 text-sm ${status === "Hoàn thành!" ? "bg-gray-900 text-white" :
                status.includes("Đang") ? "bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100" :
                  "bg-red-50 text-red-900"
                }`}>
                {status}
              </div>
            )}

            {!job?.result_payload?.exercises && !status && (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Chưa có bài tập nào</p>
                  <p className="text-gray-400 text-xs mt-1">Điền thông tin và nhấn "Tạo bài tập"</p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}