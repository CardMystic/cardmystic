import { WordSearchSchema } from "@/models/searchModel";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const searchData = WordSearchSchema.parse(requestBody);

    // Validate that we have a query
    if (!searchData.query || !searchData.query.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Make the request to the backend API
    const response = await fetch(
      "https://cardmystic-backend-fbhtc0h2gzdfdhcs.eastus-01.azurewebsites.net/search/colbert",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchData),
      },
    );

    if (!response.ok) {
      console.error("Backend API error:", response.status, response.statusText);
      return NextResponse.json(
        {
          error: `Backend API error: ${response.status} ${response.statusText}`,
        },
        { status: response.status },
      );
    }

    const data = await response.json();

    // Return the data with proper headers
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store", // Disable caching for search results
      },
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
