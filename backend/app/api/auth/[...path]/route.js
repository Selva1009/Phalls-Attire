const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const buildTargetUrl = (params) => {
  const segments = params?.path || [];
  const suffix = segments.length ? `/${segments.join("/")}` : "";
  return `${API_BASE_URL}/api/auth${suffix}`;
};

const proxyRequest = async (request, context) => {
  try {
    const targetUrl = buildTargetUrl(context.params);
    const headers = new Headers(request.headers);

    headers.delete("host");
    headers.delete("content-length");

    const options = {
      method: request.method,
      headers,
    };

    if (!["GET", "HEAD"].includes(request.method)) {
      options.body = await request.text();
    }

    const response = await fetch(targetUrl, options);
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
};

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
