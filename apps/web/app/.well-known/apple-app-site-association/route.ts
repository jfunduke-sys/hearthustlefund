import { NextResponse } from "next/server";

/** iOS Universal Links — replace team ID when you have App Store Connect access. */
export async function GET() {
  const body = {
    applinks: {
      apps: [],
      details: [
        {
          appID: "TEAMID.com.heartandhustle.app",
          paths: ["/join/*", "/donate/*"],
        },
      ],
    },
  };

  return NextResponse.json(body, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
