const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function POST(request) {
  try {
    const payload = await request.json();

    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.text();
    const contentType = response.headers.get("content-type") || "application/json";

    return new Response(data, {
      status: response.status,
      headers: { "content-type": contentType },
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Unable to reach auth service." }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
}
