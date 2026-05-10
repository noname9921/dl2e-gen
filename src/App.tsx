import { Routes, Route } from "react-router-dom"
import Config_UI from "./Config"
import Exam from "./Exam"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Config_UI />} />
      <Route path="/exam" element={<Exam />} />
    </Routes>
  )
}