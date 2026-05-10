import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "./supabaseClient.ts"

import './App.css'

type testDifficulty =
  | "prea1"
  | "prea1+"
  | "a1"
  | "a1+"
  | "a2"
  | "a2+"
  | "b1"
  | "b1+"
  | "b2"
  | "b2+"
  | "c1"
  | "c1+"
  | "c2"
  | "c2+"

type TestConfig = {
  questionAmount: number
  wrTaskAmount: number
  testDifficulty: testDifficulty
  testId: string
}

const testDiff: testDifficulty[] = [
  "prea1",
  "prea1+",
  "a1",
  "a1+",
  "a2",
  "a2+",
  "b1",
  "b1+",
  "b2",
  "b2+",
  "c1",
  "c1+",
  "c2",
  "c2+",
]

export default function Config_UI() {
  const navigate = useNavigate()

  const [testConfig, setTestConfig] = useState<TestConfig>({
    questionAmount: 40,
    wrTaskAmount: 3,
    testDifficulty: "prea1",
    testId: crypto.randomUUID(),
  })

  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle")
  const [result, setResult] = useState<any>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("loading")

    const finalConfig = {
      ...testConfig,
      testId: crypto.randomUUID(),
    }

    const { data, error } = await supabase.functions.invoke(
      "generate-exam",
      {
        body: finalConfig,
      }
    )

    if (error) {
      console.error(error)
      setStatus("idle")
      return
    }

    setResult(data)
    setStatus("done")
  }

  if (status === "loading") {
    return (
      <div className="fullscreen">
        <div className="spinner" />
        <h2>Generating exam...</h2>
      </div>
    )
  }

  if (status === "done") {
    return (
      <div className="fullscreen">
        <h2>All done!</h2>

        <button
          onClick={() => {
            sessionStorage.setItem("exam", JSON.stringify(result))
            navigate("/exam")
          }}
        >
          Continue to test →
        </button>
      </div>
    )
  }

  return (
    <>
      <h2>-- DL2E EXAMINATION GENERATOR --</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="number"
          defaultValue={40}
          onChange={(e) =>
            setTestConfig((p) => ({
              ...p,
              questionAmount: Number(e.target.value),
            }))
          }
        />

        <input
          type="number"
          defaultValue={3}
          onChange={(e) =>
            setTestConfig((p) => ({
              ...p,
              wrTaskAmount: Number(e.target.value),
            }))
          }
        />

        <select
          onChange={(e) =>
            setTestConfig((p) => ({
              ...p,
              testDifficulty: e.target.value as testDifficulty,
            }))
          }
        >
          {testDiff.map((t: testDifficulty) => (
            <option key={t} value={t}>{t == 'prea1' ? 'Pre-A1' : t == 'prea1+' ? 'Pre-A1+' : t.toUpperCase()}</option>
          ))}
        </select>

        <button type="submit">Generate</button>
      </form>
    </>
  )
}