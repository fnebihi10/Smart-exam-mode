export const normalizeAnswerText = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')

const answerTokens = (value: string) => normalizeAnswerText(value).split(' ').filter(Boolean)

const shortAnswerMatches = (userAnswer: string, expectedAnswer: string) => {
  const normalizedUserAnswer = normalizeAnswerText(userAnswer)
  const normalizedExpectedAnswer = normalizeAnswerText(expectedAnswer)

  if (!normalizedUserAnswer || !normalizedExpectedAnswer) {
    return false
  }

  if (normalizedUserAnswer === normalizedExpectedAnswer) {
    return true
  }

  const expectedTokens = answerTokens(normalizedExpectedAnswer)
  const userTokens = answerTokens(normalizedUserAnswer)

  if (expectedTokens.length === 1) {
    return userTokens.includes(expectedTokens[0])
  }

  return expectedTokens.every((token) => userTokens.includes(token))
}

export const isFillInAnswerCorrect = (userAnswer: string, acceptedAnswers: string[]) =>
  acceptedAnswers.some((acceptedAnswer) => shortAnswerMatches(userAnswer, acceptedAnswer))
