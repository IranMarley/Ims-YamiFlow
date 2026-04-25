import { api } from '../lib/axios'

export interface VideoJobStatus {
  jobId: string
  lessonId: string
  status: string
  retryCount: number
  errorMessage: string | null
  createdAt: string
  startedAt: string | null
  completedAt: string | null
}

export const videoService = {
  async uploadVideo(
    courseId: string,
    lessonId: string,
    file: File,
    onProgress?: (pct: number) => void,
  ): Promise<{ jobId: string; status: string }> {
    const form = new FormData()
    form.append('file', file)
    const response = await api.post(
      `/api/courses/${courseId}/lessons/${lessonId}/video`,
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 0,
        onUploadProgress: (e) => {
          if (onProgress && e.total) {
            onProgress(Math.round((e.loaded / e.total) * 100))
          }
        },
      },
    )
    return response.data
  },

  async getJobStatus(jobId: string): Promise<VideoJobStatus> {
    const response = await api.get<VideoJobStatus>(`/api/video-jobs/${jobId}`)
    return response.data
  },
}
