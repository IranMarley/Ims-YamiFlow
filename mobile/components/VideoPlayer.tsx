import React, { useRef } from 'react'
import { View, StyleSheet } from 'react-native'
import { VideoView, useVideoPlayer } from 'expo-video'
import { useAuthStore } from '../store/authStore'
import { BASE_URL } from '../lib/axios'
import { colors, radius } from '../lib/theme'

interface VideoPlayerProps {
  lessonId: string
}

export default function VideoPlayer({ lessonId }: VideoPlayerProps) {
  const { accessToken } = useAuthStore()
  const manifestUrl = `${BASE_URL}/api/lessons/${lessonId}/video/manifest`
  const ref = useRef<VideoView>(null)

  const player = useVideoPlayer(
    {
      uri: manifestUrl,
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    },
    (p) => {
      p.loop = false
    },
  )

  return (
    <View style={styles.container}>
      <VideoView
        ref={ref}
        player={player}
        style={styles.video}
        nativeControls
        allowsPictureInPicture
        contentFit="contain"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    aspectRatio: 16 / 9,
    backgroundColor: colors.black,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  video: {
    flex: 1,
  },
})
