import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios.js'
import QuestionCard from '../components/QuestionCard.jsx'

const emptyQuestion = () => ({
  text: '',
  isMandatory: true,
  options: [{ text: '' }, { text: '' }],
})

export default function CreatePoll() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [expiresAt, setExpiresAt] = useState('')
  const [questions, setQuestions] = useState([emptyQuestion()])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const updateQuestion = (questionIndex, patch) => {
    setQuestions((items) => items.map((question, index) => (index === questionIndex ? { ...question, ...patch } : question)))
  }

  const updateOption = (questionIndex, optionIndex, value) => {
    setQuestions((items) =>
      items.map((question, index) => {
        if (index !== questionIndex) return question
        return {
          ...question,
          options: question.options.map((option, innerIndex) => (innerIndex === optionIndex ? { text: value } : option)),
        }
      }),
    )
  }

  const addOption = (questionIndex) => {
    setQuestions((items) =>
      items.map((question, index) =>
        index === questionIndex ? { ...question, options: [...question.options, { text: '' }] } : question,
      ),
    )
  }

  const removeOption = (questionIndex, optionIndex) => {
    setQuestions((items) =>
      items.map((question, index) => {
        if (index !== questionIndex || question.options.length <= 2) return question
        return { ...question, options: question.options.filter((_, innerIndex) => innerIndex !== optionIndex) }
      }),
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const payload = {
        title,
        description: description || undefined,
        isAnonymous,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        questions,
      }

      const { data } = await api.post('/polls', payload)
      navigate(`/analytics/${data.poll.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Poll builder</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Create a shareable poll.</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <label className="block text-sm font-medium text-slate-700">
              Poll title
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                minLength={3}
                required
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <label className="mt-4 block text-sm font-medium text-slate-700">
              Description
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Expiry time
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(event) => setExpiresAt(event.target.value)}
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Response mode
                <select
                  value={isAnonymous ? 'anonymous' : 'authenticated'}
                  onChange={(event) => setIsAnonymous(event.target.value === 'anonymous')}
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="anonymous">Anonymous</option>
                  <option value="authenticated">Authenticated</option>
                </select>
              </label>
            </div>
          </section>

          {questions.map((question, questionIndex) => (
            <QuestionCard
              key={questionIndex}
              question={question}
              index={questionIndex}
              canRemove={questions.length > 1}
              onQuestionChange={(patch) => updateQuestion(questionIndex, patch)}
              onOptionChange={(optionIndex, value) => updateOption(questionIndex, optionIndex, value)}
              onAddOption={() => addOption(questionIndex)}
              onRemoveOption={(optionIndex) => removeOption(questionIndex, optionIndex)}
              onRemoveQuestion={() => setQuestions((items) => items.filter((_, index) => index !== questionIndex))}
            />
          ))}
        </div>

        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">Questions</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{questions.length}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">Mode</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{isAnonymous ? 'Anon' : 'Auth'}</p>
            </div>
          </div>
          {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
          <button
            type="button"
            onClick={() => setQuestions((items) => [...items, emptyQuestion()])}
            className="mt-5 w-full rounded-md border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Add question
          </button>
          <button disabled={loading} className="mt-3 w-full rounded-md bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800">
            {loading ? 'Creating...' : 'Create poll'}
          </button>
        </aside>
      </form>
    </section>
  )
}
