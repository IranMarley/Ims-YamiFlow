'use client'
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google'
import { useGoogleAuth } from '../../hooks/useAuth'

export default function GoogleLoginButton() {
  const googleAuth = useGoogleAuth()

  const handleSuccess = (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      googleAuth.mutate(credentialResponse.credential)
    }
  }

  return (
    <div className="flex justify-center">
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
