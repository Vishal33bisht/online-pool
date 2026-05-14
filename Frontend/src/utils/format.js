export const formatDate = (value) => {
  if (!value) return 'No expiry'

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export const getPollStatus = (poll) => {
  if (poll.isPublished) return 'Published'
  if (poll.expiresAt && new Date(poll.expiresAt) < new Date()) return 'Expired'
  return 'Collecting'
}

export const getPublicPollUrl = (slug) => `${window.location.origin}/poll/${slug}`
