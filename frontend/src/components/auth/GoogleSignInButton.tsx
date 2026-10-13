import React from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

interface GoogleSignInButtonProps {
  onSuccess: (credential: string) => void;
  onError?: (error?: string) => void;
  text?: string;
  className?: string;
  isLoading?: boolean;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  className = '',
  isLoading = false,
}) => {
  const handleSuccess = (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      onSuccess(credentialResponse.credential);
    } else {
      onError?.('No credential returned by Google');
    }
  };

  const handleError = () => {
    console.error('Google Login Failed');
    onError?.('Google Login Failed');
  };

  return (
    <div className={`w-full flex justify-center ${className}`}>
      {isLoading ? (
        <div className="py-2.5 px-4 text-xs font-semibold text-zinc-500 animate-pulse">
          Verifying Google Identity...
        </div>
      ) : (
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          useOneTap={false}
          shape="rectangular"
          theme="filled_blue"
          width="100%"
        />
      )}
    </div>
  );
};
