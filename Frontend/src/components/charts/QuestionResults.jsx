import ResultBar from './ResultBar.jsx'

export default function QuestionResults({ questions }) {
  return (
    <div className="space-y-4">
      {questions.map((question) => (
        <article key={question.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-950">{question.text}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {question.totalAnswers} answers
                {question.skipped > 0 ? `, ${question.skipped} skipped` : ''}
              </p>
            </div>
            {question.isMandatory && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                Mandatory
              </span>
            )}
          </div>
          <div className="space-y-4">
            {question.options.map((option) => (
              <ResultBar
                key={option.id}
                label={option.text}
                count={option.count}
                percentage={option.percentage}
              />
            ))}
          </div>
        </article>
      ))}
    </div>
  )
}
