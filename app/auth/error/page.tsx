"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-600">
            Authentication Error
          </h1>
          <p className="mt-4 text-gray-600">
            {error === "OAuthSignin"
              ? "Error in constructing an authorization URL."
              : error === "OAuthCallback"
              ? "Error in handling the response from an OAuth provider."
              : error === "OAuthCreateAccount"
              ? "Could not create OAuth provider user in the database."
              : error === "EmailCreateAccount"
              ? "Could not create email provider user in the database."
              : error === "Callback"
              ? "Error in the OAuth callback handler route."
              : error === "OAuthAccountNotLinked"
              ? "Email already associated with another account."
              : error === "EmailSignin"
              ? "Sending the e-mail with the verification token failed."
              : error === "CredentialsSignin"
              ? "Sign in with credentials failed."
              : error === "SessionRequired"
              ? "This page requires authentication."
              : "An error occurred during authentication."}
          </p>
        </div>

        <div className="mt-8">
          <Link
            href="/auth/signin"
            className="flex w-full justify-center rounded-md border border-transparent bg-primary-600 px-4 py-3 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Try Again
          </Link>
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm text-primary-600 hover:text-primary-700">
            Go back home
          </Link>
        </div>
      </div>
    </div>
  );
}
