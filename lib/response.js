export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "*",
      "cache-control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}

export function error(msg, status = 500) {
  return json({ statusCode: status, statusMessage: "Error", message: msg, data: null }, status);
}
