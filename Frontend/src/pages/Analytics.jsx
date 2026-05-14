import { useContext, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api/axios.js'
import MetricCard from '../components/charts/MetricCard.jsx'
import QuestionResults from '../components/charts/QuestionResults.jsx'
import { SocketContext } from '../context/SocketContext.jsx'
import { formatDate, getPublicPollUrl } from '../utils/format.js'

export default function Analytics() {
  const { pollId } = useParams()
  const socket = useContext(SocketContext)
  const [analytics, setAnalytics] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true

    api.get(`/polls/${pollId}/analytics`)
      .then(({ data }) => {
        if (!active) return
        setAnalytics(data.analytics)
        setError('')
      })
      .catch((err) => {
        if (active) setError(err.message)
      })

    return () => {
      active = false
    }
  }, [pollId])

  const loadAnalytics = async () => {
    try {
      const { data } = await api.get(`/polls/${pollId}/analytics`)
      setAnalytics(data.analytics)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    if (!socket || !analytics?.pollDetails?.id) return undefined

    socket.emit('join-poll', analytics.pollDetails.id)
    socket.on('response-update', (payload) => setAnalytics(payload.analytics))
    socket.on('poll-published', (payload) => setAnalytics(payload.analytics))

    return () => {
      socket.emit('leave-poll', analytics.pollDetails.id)
      socket.off('response-update')
      socket.off('poll-published')
    }
  }, [socket, analytics?.pollDetails?.id])

  const publishResults = async () => {
    await api.post(`/polls/${pollId}/publish`)
    setNotice('Results are now public on the poll link.')
    loadAnalytics()
  }

  const copyPublicLink = async () => {
    await navigator.clipboard.writeText(getPublicPollUrl(analytics.pollDetails.slug))
    setNotice('Public link copied.')
  }

  if (error) {
    return (
      <section className="mx-auto mt-24 max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-950">{error}</h1>
      </section>
    )
  }

  if (!analytics) {
    return (
      <section className="mx-auto mt-24 max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-500">Loading analytics...</p>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Live analytics</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{analytics.pollDetails.title}</h1>
          <p className="mt-2 max-w-2xl text-slate-600">{analytics.pollDetails.description}</p>
          <p className="mt-3 text-sm text-slate-500">Expires: {formatDate(analytics.pollDetails.expiresAt)}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={copyPublicLink} className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
            Copy link
          </button>
          <Link to={`/poll/${analytics.pollDetails.slug}`} className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
            Open poll
          </Link>
          {!analytics.pollDetails.isPublished && (
            <button onClick={publishResults} className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500">
              Publish results
            </button>
          )}
        </div>
      </div>

      {notice && <p className="mt-5 rounded-md bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{notice}</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total responses" value={analytics.totalResponses} />
        <MetricCard label="Completion" value={`${analytics.participation.averageCompletionRate}%`} />
        <MetricCard label="Anonymous" value={analytics.participation.anonymousResponses} />
        <MetricCard label="Authenticated" value={analytics.participation.authenticatedResponses} />
      </div>

      <div className="mt-6">
        <QuestionResults questions={analytics.questions} />
      </div>
    </section>
  )
}
