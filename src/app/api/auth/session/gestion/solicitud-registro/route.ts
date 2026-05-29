import { NextResponse } from "next/server";

function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    ""
  ).replace(/\/$/, "");
}

export async function GET() {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    return NextResponse.json(
      { message: "No está configurada la URL del backend." },
      { status: 500 },
    );
  }

  const url = `${apiBaseUrl}/api/gestion/solicitud-registro`;

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const data = await response.json();

      return NextResponse.json(data, {
        status: response.status,
      });
    }

    const text = await response.text();

    return new NextResponse(text, {
      status: response.status,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } catch (error) {
    console.error("Error proxy GET solicitudes:", error);

    return NextResponse.json(
      {
        message: "No se pudo conectar con el backend desde el proxy de Next.",
      },
      { status: 502 },
    );
  }
}