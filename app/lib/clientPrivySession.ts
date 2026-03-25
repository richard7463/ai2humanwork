"use client";

type SessionSyncOptions = {
  authenticated: boolean;
  getAccessToken: () => Promise<string | null | undefined>;
  walletAddress?: string;
};

export async function refreshPrivyServerSession({
  authenticated,
  getAccessToken,
  walletAddress
}: SessionSyncOptions) {
  if (!authenticated) return false;

  try {
    const accessToken = await getAccessToken();
    if (!accessToken) return false;

    const response = await fetch("/api/auth/privy/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(
        walletAddress ? { accessToken, walletAddress } : { accessToken }
      )
    });

    return response.ok;
  } catch {
    return false;
  }
}

export async function fetchWithPrivySessionRetry(
  input: RequestInfo | URL,
  init: RequestInit,
  options: SessionSyncOptions
) {
  let response = await fetch(input, init);
  if (response.status !== 401) {
    return response;
  }

  const refreshed = await refreshPrivyServerSession(options);
  if (!refreshed) {
    return response;
  }

  response = await fetch(input, init);
  return response;
}

export async function loadAuthWithPrivySession<T>(
  options: SessionSyncOptions
) {
  const requestInit: RequestInit = {
    cache: "no-store",
    credentials: "same-origin"
  };

  let response = await fetch("/api/auth/me", requestInit);
  if (response.status === 401) {
    const refreshed = await refreshPrivyServerSession(options);
    if (refreshed) {
      response = await fetch("/api/auth/me", requestInit);
    }
  }

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
}
