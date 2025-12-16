import fs from "fs";
import { NextResponse } from "next/server";
import path from "path";

export async function GET() {
  try {
    const registryPath = path.join(process.cwd(), "registry", "index.json");
    const registry = JSON.parse(fs.readFileSync(registryPath, "utf-8"));

    return NextResponse.json(registry);
  } catch (error) {
    console.error("Registry error:", error);
    return NextResponse.json(
      { error: "Failed to fetch registry" },
      { status: 500 }
    );
  }
}
