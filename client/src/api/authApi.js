export async function signupUser(name, email, password) {
  const response = await fetch("/api/auth/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name, email, password })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || "Sign up failed.");
  }
  return payload;
}

export async function loginUser(email, password) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || "Login failed.");
  }
  return payload;
}

export async function googleLoginUser(token) {
  const response = await fetch("/api/auth/google", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ token })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || "Google Authentication failed.");
  }
  return payload;
}

export async function forgotPasswordRequest(email) {
  const response = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || "Password reset request failed.");
  }
  return payload;
}

export async function resetPasswordRequest(token, password) {
  const response = await fetch(`/api/auth/reset-password/${token}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ password })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || "Password reset update failed.");
  }
  return payload;
}

export async function getCurrentUser() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  const response = await fetch("/api/auth/me", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || "Failed to fetch user profiles.");
  }
  return payload;
}
