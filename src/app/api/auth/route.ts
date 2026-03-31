import { NextRequest } from "next/server";
import { getAuthUrl, exchangeCodeForTokens } from "@/lib/google-calendar";

// GET /api/auth?action=start  → redirect to Google consent page
// GET /api/auth?code=...      → exchange code, display refresh token
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const code = searchParams.get("code");

  if (action === "start") {
    const url = getAuthUrl();
    return Response.redirect(url);
  }

  if (code) {
    const tokens = await exchangeCodeForTokens(code);
    return new Response(
      `<html><body style="font-family:monospace;padding:2rem;">
        <h2>Google OAuth Complete</h2>
        <p>Copy this refresh token into your <code>.env</code> as <code>GOOGLE_REFRESH_TOKEN</code>:</p>
        <textarea rows="4" cols="80" style="font-size:12px;">${tokens.refresh_token}</textarea>
        <p>Then restart the app.</p>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  return Response.json({ error: "Use ?action=start to begin OAuth flow" }, { status: 400 });
}
