import { Link, Navigate } from 'react-router-dom'
import MetricCard from '../components/charts/MetricCard.jsx'
import ResultBar from '../components/charts/ResultBar.jsx'
import { useAuth } from '../hooks/useAuth.js'

export default function Home() {
  const { user } = useAuth()

  if (user) return <Navigate to="/dashboard" replace />

  return (
    <section className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_520px] lg:px-8">
      <div>
        <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
          Full-stack polling workspace
        </span>
        <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">
          Create polls, collect feedback, publish final results.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
          Build single-choice polls with mandatory questions, expiry windows, anonymous or authenticated
          responses, live analytics, and public result summaries.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/register" className="rounded-md bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800">
            Start creating
          </Link>
          <Link to="/login" className="rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
            Login
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70">
        <div className="grid grid-cols-3 gap-3">
          <MetricCard label="Responses" value="128" />
          <MetricCard label="Completion" value="94%" />
          <MetricCard label="Live" value="3" />
        </div>
        <div className="mt-6 rounded-lg border border-slate-200 p-5">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-950">Which feature should ship first?</h2>
            <p className="mt-1 text-sm text-slate-500">Live preview of final results</p>
          </div>
          <div className="space-y-4">
            <ResultBar label="Team analytics" count={64} percentage={50} />
            <ResultBar label="Public result page" count={41} percentage={32} />
            <ResultBar label="Expiry automation" count={23} percentage={18} />
          </div>
        </div>
      </div>
    </section>
  )
}
