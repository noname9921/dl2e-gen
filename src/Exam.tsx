import { useEffect, useState } from "react"
import "./Exam.css"

type ExamData = {
  readingQuestions: {
    questionId: number
    questionContent: string
    answers: string[]
    correctAnswer: string
  }[]

  listeningQuestions: {
    questionId: number
    questionContent: string
    answers: string[]
    correctAnswer: string
    ttsText: string
  }[]

  writingTasks: {
    taskId: number
    taskContent: string
  }[]
}

type Answers = {
  reading: Record<number, string>
  listening: Record<number, string>
  writing: Record<number, string>
}

export default function Exam() {
  // @ts-ignore
  const [exam, setExam] = useState<ExamData | null>(null)

  const [answers, setAnswers] = useState<Answers>({
    reading: {},
    listening: {},
    writing: {},
  })

  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [writingScore, setWritingScore] = useState(0)

  useEffect(() => {
    const stored = sessionStorage.getItem("exam")
    if (stored) {
      try {
        setExam(JSON.parse(stored))
      } catch {
        // @ts-ignore
        setExam(null)
      }
    }
  }, [])

  if (!exam) return <h2>No exam loaded 💀</h2>

  function selectAnswer(
    section: "reading" | "listening",
    qid: number,
    value: string
  ) {
    setAnswers((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [qid]: value,
      },
    }))
  }

  function setWriting(qid: number, value: string) {
    setAnswers((prev) => ({
      ...prev,
      writing: {
        ...prev.writing,
        [qid]: value,
      },
    }))
  }

  // tier 2 grading
  async function gradeExam() {
  const res = await fetch(
    "https://drznwpmdmzofezbcpamx.functions.supabase.co/grade-writing",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        exam,
        answers,
      }),
    }
  )

  const data = await res.json()

  setScore(data.mcqScore)
  setWritingScore(data.writingScore)
  setSubmitted(true)
}

  if (submitted) {
    const totalMCQ =
      exam.readingQuestions.length + exam.listeningQuestions.length

    const totalWriting = exam.writingTasks.length * 5

    return (
      <div className="exam-result">
        <h1>Done.</h1>

        <h2>
          MCQ: {score} / {totalMCQ}
        </h2>

        <h2>
          Writing: {writingScore} / {totalWriting}
        </h2>

        <p>
          {(score + writingScore) / (totalMCQ + totalWriting) > 0.7
            ? "you passed (barely carrying the writing section)"
            : "yeah nah… try again 💀"}
        </p>
      </div>
    )
  }

  return (
    <div className="exam-container">
      <h1>DL2E Exam</h1>

      <section>
        <h2>Reading</h2>

        {exam.readingQuestions.map((q) => (
          <div key={q.questionId} className="question-card">
            <p>{q.questionContent}</p>

            {q.answers.map((opt) => (
              <label key={opt} className="option">
                <input
                  type="radio"
                  name={`r-${q.questionId}`}
                  checked={answers.reading[q.questionId] === opt}
                  onChange={() =>
                    selectAnswer("reading", q.questionId, opt)
                  }
                />
                {opt}
              </label>
            ))}
          </div>
        ))}
      </section>

      <section>
        <h2>Listening</h2>

        {exam.listeningQuestions.map((q) => (
          <div key={q.questionId} className="question-card">
            <p>{q.questionContent}</p>
            <p className="tts">{q.ttsText}</p>

            <button
              onClick={() =>
                speechSynthesis.speak(
                  new SpeechSynthesisUtterance(q.ttsText)
                )
              }
            >
              Play audio 🔊
            </button>

            {q.answers.map((opt) => (
              <label key={opt} className="option">
                <input
                  type="radio"
                  name={`l-${q.questionId}`}
                  checked={
                    answers.listening[q.questionId] === opt
                  }
                  onChange={() =>
                    selectAnswer("listening", q.questionId, opt)
                  }
                />
                {opt}
              </label>
            ))}
          </div>
        ))}
      </section>

      <section>
        <h2>Writing</h2>

        {exam.writingTasks.map((t) => (
          <div key={t.taskId} className="question-card">
            <p>{t.taskContent}</p>

            <textarea
              value={answers.writing[t.taskId] || ""}
              onChange={(e) => setWriting(t.taskId, e.target.value)}
              placeholder="write your answer..."
            />
          </div>
        ))}
      </section>

      <button className="submit-btn" onClick={gradeExam}>
        Submit Exam
      </button>
    </div>
  )
}