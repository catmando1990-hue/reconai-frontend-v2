import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

/**
 * Context API - News Feed
 *
 * Server-side fetched business/market news.
 * Caches responses for 15-30 minutes to reduce API calls.
 *
 * IMPORTANT: API keys are server-side only.
 * No client exposure of credentials.
 */

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  source: string;
  url: string;
  publishedAt: string;
  imageUrl?: string;
}

export interface NewsResponse {
  lifecycle: "success" | "not_configured" | "failed";
  articles: NewsArticle[];
  fetchedAt: string;
  message?: string;
}

// Cache news for 15 minutes
export const revalidate = 900;

export async function GET(): Promise<NextResponse<NewsResponse>> {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      {
        lifecycle: "failed",
        articles: [],
        fetchedAt: new Date().toISOString(),
        message: "Unauthorized",
      },
      { status: 401 },
    );
  }

  const apiKey = process.env.NEWS_API_KEY;

  // Intentional empty state if not configured
  if (!apiKey) {
    return NextResponse.json({
      lifecycle: "not_configured",
      articles: [],
      fetchedAt: new Date().toISOString(),
      message:
        "News feed not configured. Set NEWS_API_KEY environment variable.",
    });
  }

  try {
    // Fetch business news from NewsAPI or similar
    // Example using NewsAPI.org (replace with your preferred provider)
    const response = await fetch(
      `https://newsapi.org/v2/top-headlines?category=business&country=us&pageSize=5&apiKey=${apiKey}`,
      {
        next: { revalidate: 900 }, // Cache for 15 minutes
      },
    );

    if (!response.ok) {
      throw new Error(`News API returned ${response.status}`);
    }

    const data = await response.json();

    const articles: NewsArticle[] = (data.articles || []).map(
      (
        article: {
          title?: string;
          description?: string;
          source?: { name?: string };
          url?: string;
          publishedAt?: string;
          urlToImage?: string;
        },
        index: number,
      ) => ({
        id: `news-${index}`,
        title: article.title || "Untitled",
        description: article.description || "",
        source: article.source?.name || "Unknown",
        url: article.url || "#",
        publishedAt: article.publishedAt || new Date().toISOString(),
        imageUrl: article.urlToImage,
      }),
    );

    return NextResponse.json({
      lifecycle: "success",
      articles,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[News API Error]", error);
    return NextResponse.json({
      lifecycle: "failed",
      articles: [],
      fetchedAt: new Date().toISOString(),
      message: "Failed to fetch news. Please try again later.",
    });
  }
}
