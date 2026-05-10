import { useEffect, useState } from "react"
import "./Exam.css"

export default function Exam() {
  const [exam, setExam] = useState<any>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem("exam")

    if (stored) {
      try {
        setExam(JSON.parse(stored))
      } catch (err) {
        console.error("Failed to parse exam:", err)
      }
    }
  }, [])

  if (!exam) {
    return (
      <div className="fullscreen">
        <h2>No exam loaded 💀</h2>
      </div>
    )
  }

  return (
    <div className="exam-container">
      <h1>DL2E Examination</h1>

      {/* READING */}

      <h2>Reading Section</h2>

      {exam.readingQuestions.map((q: any) => (
        <div key={q.questionId} className="question-card">
          <p className="question">
            {q.questionId}. {q.questionContent}
          </p>

          <p className="translation">
            {q.questionVNMContent}
          </p>

          <div className="options">
            {q.answers.map((opt: string) => (
              <label key={opt} className="option">
                <input
                  type="radio"
                  name={`reading-${q.questionId}`}
                />

                {opt}
              </label>
            ))}
          </div>
        </div>
      ))}

      {/* LISTENING */}

      <h2>Listening Section</h2>

      {exam.listeningQuestions.map((q: any) => (
        <div key={q.questionId} className="question-card">
          <p className="question">
            {q.questionId}. {q.questionContent}
          </p>

          <p className="translation">
            {q.questionVNMContent}
          </p>

          <button
            className="audio-btn"
            onClick={() => {
              speechSynthesis.cancel()

              const utterance =
                new SpeechSynthesisUtterance(q.ttsText)

              utterance.lang = "en-US"
              utterance.rate = 0.95
              utterance.pitch = 1

              speechSynthesis.speak(utterance)
            }}
          >
            🔊 Play Audio
          </button>

          <div className="options">
            {q.answers.map((opt: string) => (
              <label key={opt} className="option">
                <input
                  type="radio"
                  name={`listening-${q.questionId}`}
                />

                {opt}
              </label>
            ))}
          </div>
        </div>
      ))}

      {/* WRITING */}

      <h2>Writing Section</h2>

      {exam.writingTasks.map((t: any) => (
        <div key={t.taskId} className="question-card">
          <p className="question">
            Task {t.taskId}
          </p>

          <p>{t.taskContent}</p>

          <p className="translation">
            {t.taskVNMContent}
          </p>

          <textarea
            className="writing-box"
            placeholder="Write your answer here..."
          />
        </div>
      ))}
    </div>
  )
}