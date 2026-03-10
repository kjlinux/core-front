export interface ReviewQuestion {
  id: string
  text: string
  orderIndex: number
}

export interface ReviewChannel {
  id: string
  name: string
}

export interface ReviewConfig {
  id: string
  token: string
  isActive: boolean
  questions: ReviewQuestion[]
  channels: ReviewChannel[]
  reviewUrl: string
}

export interface ReviewAnswer {
  questionId: string
  stars: number
}

export interface ReviewSubmitPayload {
  recommendations?: string
  channel?: string
  answers: ReviewAnswer[]
}

export interface ReviewStats {
  totalSubmissions: number
  averagePerQuestion: {
    questionId: string
    text: string
    average: number
  }[]
  channelDistribution: {
    channel: string
    count: number
  }[]
}

export interface SubmissionListItem {
  id: string
  channel?: string
  recommendations?: string
  answers: ReviewAnswer[]
  createdAt: string
}

export interface PublicReviewConfig {
  companyName: string
  questions: ReviewQuestion[]
  channels: ReviewChannel[]
}
