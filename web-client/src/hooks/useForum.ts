import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { forumService } from '../services/forum.service'

export const forumKeys = {
  all: ['forum'] as const,
  posts: (params: object) => [...forumKeys.all, 'posts', params] as const,
  post: (id: string) => [...forumKeys.all, 'post', id] as const,
}

export function useForumPosts(params: { courseId?: string; page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: forumKeys.posts(params),
    queryFn: () => forumService.listPosts(params),
    placeholderData: (prev) => prev,
  })
}

export function usePostDetail(postId: string) {
  return useQuery({
    queryKey: forumKeys.post(postId),
    queryFn: () => forumService.getPostDetail(postId),
    enabled: !!postId,
  })
}

export function useCreatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { courseId?: string; title: string; body: string }) =>
      forumService.createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: forumKeys.all })
    },
  })
}

export function useReplyToPost(postId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: string) => forumService.replyToPost(postId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: forumKeys.post(postId) })
    },
  })
}
