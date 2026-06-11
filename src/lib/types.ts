export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  bio: string | null
  is_developer: boolean
  is_early_access?: boolean
  created_at: string
}

export interface CarSpot {
  id: string
  user_id: string
  make: string
  model: string
  year: number | null
  color: string | null
  location_name: string
  lat: number | null
  lng: number | null
  estimated_worth: number | null
  photo_url: string | null
  notes: string | null
  spotted_at: string
  created_at: string
  profiles?: Profile
}

export interface FeedPost {
  id: string
  user_id: string
  content: string
  type: 'post' | 'poll'
  created_at: string
  profiles?: Profile
  feed_poll_options?: PollOption[]
  feed_replies?: { count: number }[]
  feed_reactions?: { id: string; reaction: string; user_id: string }[]
}

export interface PollOption {
  id: string
  post_id: string
  text: string
  position: number
  feed_poll_votes?: { count: number }[]
}

export interface FeedReply {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  profiles?: Profile
  feed_reactions?: { id: string; reaction: string; user_id: string }[]
}

export interface CarEvent {
  id: string
  user_id: string
  title: string
  description: string | null
  location_name: string
  lat: number | null
  lng: number | null
  start_time: string
  end_time: string | null
  is_recurring: boolean
  recurrence_rule: string | null
  cover_image_url: string | null
  is_verified: boolean
  organizer_contact: string | null
  max_capacity: number | null
  min_rating_required: number | null
  requires_payment: boolean
  created_at: string
  profiles?: Profile
  attendee_count?: number
  user_attending?: boolean
}

export interface ProfileReview {
  id: string
  reviewer_id: string
  reviewee_id: string
  event_id: string
  rating: number
  comment: string | null
  created_at: string
  profiles?: Profile
}
