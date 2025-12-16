/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
/** biome-ignore-all lint/correctness/noUnusedFunctionParameters: <explanation> */
import fs from "fs";
import { type NextRequest, NextResponse } from "next/server";
import path from "path";

// GET /api/registry/button
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ component: string }> }
) {
  // Await params in Next.js 16+
  const { component } = await params;

  try {
    // Read registry index
    const registryPath = path.join(process.cwd(), "src", "registry", "index.json");
    const registry = JSON.parse(fs.readFileSync(registryPath, "utf-8"));

    // Find component
    const componentData = registry.components.find(
      (c: any) => c.name === component
    );

    if (!componentData) {
      return NextResponse.json(
        { error: "Component not found" },
        { status: 404 }
      );
    }

    // Read component file(s)
    const files = componentData.files.map((file: string) => {
      const filePath = path.join(process.cwd(), "src", "registry", file);
      const content = fs.readFileSync(filePath, "utf-8");
      return {
        name: path.basename(file),
        content,
      };
    });

    return NextResponse.json({
      name: componentData.name,
      dependencies: componentData.dependencies,
      devDependencies: componentData.devDependencies,
      registryDependencies: componentData.registryDependencies,
      files,
    });
  } catch (error) {
    console.error("Registry error:", error);
    return NextResponse.json(
      { error: "Failed to fetch component" },
      { status: 500 }
    );
  }
}
