import { cookies } from "next/headers";

export async function POST(request: Request) {
  const { password } = await request.json();

  if (password !== process.env.PARENT_PASSWORD) {
    return Response.json({ error: "Wrong password" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set("parent_auth", "ok", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return Response.json({ ok: true });
}
