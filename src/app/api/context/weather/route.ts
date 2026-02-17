import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

/**
 * Context API - Weather
 *
 * Server-side fetched weather data.
 * Caches responses for 30 minutes to reduce API calls.
 *
 * IMPORTANT: API keys are server-side only.
 * No client exposure of credentials.
 */

export interface WeatherData {
  location: string;
  temperature: number;
  temperatureUnit: "F" | "C";
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  windUnit: string;
  fetchedAt: string;
}

export interface WeatherResponse {
  lifecycle: "success" | "not_configured" | "failed";
  weather: WeatherData | null;
  message?: string;
}

// Cache weather for 30 minutes
export const revalidate = 1800;

export async function GET(
  request: Request,
): Promise<NextResponse<WeatherResponse>> {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      {
        lifecycle: "failed",
        weather: null,
        message: "Unauthorized",
      },
      { status: 401 },
    );
  }

  const apiKey = process.env.WEATHER_API_KEY;

  // Intentional empty state if not configured
  if (!apiKey) {
    return NextResponse.json({
      lifecycle: "not_configured",
      weather: null,
      message:
        "Weather not configured. Set WEATHER_API_KEY environment variable.",
    });
  }

  // Get location from query params or use default
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const location = searchParams.get("location") || "New York, NY";

  try {
    let weatherUrl: string;

    // Use OpenWeatherMap API (or similar)
    if (lat && lon) {
      weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`;
    } else {
      weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=imperial&appid=${apiKey}`;
    }

    const response = await fetch(weatherUrl, {
      next: { revalidate: 1800 }, // Cache for 30 minutes
    });

    if (!response.ok) {
      throw new Error(`Weather API returned ${response.status}`);
    }

    const data = await response.json();

    const weather: WeatherData = {
      location: data.name || location,
      temperature: Math.round(data.main?.temp || 0),
      temperatureUnit: "F",
      condition: data.weather?.[0]?.main || "Unknown",
      icon: data.weather?.[0]?.icon || "01d",
      humidity: data.main?.humidity || 0,
      windSpeed: Math.round(data.wind?.speed || 0),
      windUnit: "mph",
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      lifecycle: "success",
      weather,
    });
  } catch (error) {
    console.error("[Weather API Error]", error);
    return NextResponse.json({
      lifecycle: "failed",
      weather: null,
      message: "Failed to fetch weather. Please try again later.",
    });
  }
}
