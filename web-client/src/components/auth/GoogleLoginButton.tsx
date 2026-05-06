'use client'
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google'
import Spinner from '../ui/Spinner'
import { useGoogleAuth } from '../../hooks/useAuth'

export default function GoogleLoginButton({ redirectTo }: { redirectTo?: string }) {
  const googleAuth = useGoogleAuth(redirectTo)

  const handleSuccess = (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      googleAuth.mutate(credentialResponse.credential)
    }
  }

  return (
    <div className="flex justify-center relative">
      {googleAuth.isPending && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/70">
          <Spinner size="sm" />
        </div>
      )}
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => {}}
        theme="outline"
        size="large"
        text="signin_with"
        shape="rectangular"
        width="368"
        useOneTap={false}
      />
    </div>
  )
}
