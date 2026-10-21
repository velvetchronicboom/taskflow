
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export async function apiRequest(path, { token, ...options } = {}) {
    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    })

    if (response.status === 204) return null

    const text = await response.text()
    let data = null

    try {
        data = text ? JSON.parse(text) : null
    } catch {
        data = text
    }

    if (!response.ok) {
        throw new Error(
            typeof data === 'string'
                ? data
                : data?.message || data?.error || `Request failed (${response.status})`,
        )
    }

    return data
}
