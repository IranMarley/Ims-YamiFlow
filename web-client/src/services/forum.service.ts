import { api } from '../lib/axios'

export interface PostItem {
  postId: string
  authorName: string
  courseId: string | null
  title: string
  bodyPreview: string
  replyCount: number
  createdAt: string
}

export interface ReplyItem {
  replyId: string
  authorName: string
  body: string
  createdAt: string
}

export interface PostDetail {
  postId: string
  authorName: string
  courseId: string | null
  title: string
  body: string
  replies: ReplyItem[]
  createdAt: string
}

export interface PostResponse {
  postId: string
  authorId: string
  courseId: string | null
  title: string
  body: string
  createdAt: string
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

export const forumService = {
  async listPosts(params: {
    courseId?: string
    page?: number
    pageSize?: number
  } = {}): Promise<PagedResult<PostItem>> {
    const response = await api.get<PagedResult<PostItem>>('/api/forum/posts', { params })
    return response.data
  },

  async getPostDetail(postId: string): Promise<PostDetail> {
    const response = await api.get<PostDetail>(`/api/forum/posts/${postId}`)
    return response.data
  },

  async createPost(data: {
    courseId?: string
    title: string
    body: string
  }): Promise<PostResponse> {
    const response = await api.post<PostResponse>('/api/forum/posts', data)
    return response.data
  },

  async replyToPost(postId: string, body: string): Promise<void> {
    await api.post(`/api/forum/posts/${postId}/replies`, { body })
  },

  async deletePost(postId: string): Promise<void> {
    await api.delete(`/api/forum/posts/${postId}`)
  },
}
