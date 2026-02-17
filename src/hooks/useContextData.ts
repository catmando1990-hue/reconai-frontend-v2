"use client";

import { useState, useCallback, useEffect } from "react";
import { useApi } from "@/lib/useApi";
import { useOrg } from "@/lib/org-context";
import type { NewsResponse, NewsArticle } from "@/app/api/context/news/route";
import type {
  WeatherResponse,
  WeatherData,
} from "@/app/api/context/weather/route";

/**
 * useContextData - Hook for welcome/context page data
 *
 * Fetches news and weather for the executive context dashboard.
 * No financial data - this is purely contextual information.
 *
 * CANONICAL LAWS:
 * - Manual refresh only (no polling)
 * - Server-side API key protection
 * - Intentional empty states for unconfigured APIs
 */

interface ContextDataState {
  // News
  news: NewsArticle[];
  newsLoading: boolean;
  newsError: string | null;
  newsConfigured: boolean;

  // Weather
  weather: WeatherData | null;
  weatherLoading: boolean;
  weatherError: string | null;
  weatherConfigured: boolean;

  // Actions
  refreshNews: () => Promise<void>;
  refreshWeather: () => Promise<void>;
  refreshAll: () => Promise<void>;

  // State
  isLoading: boolean;
}

export function useContextData(): ContextDataState {
  const { apiFetch } = useApi();
  const { isLoaded: authReady } = useOrg();

  // News state
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [newsConfigured, setNewsConfigured] = useState(true);

  // Weather state
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [weatherConfigured, setWeatherConfigured] = useState(true);

  // Fetch news
  const fetchNews = useCallback(async () => {
    try {
      setNewsLoading(true);
      setNewsError(null);

      const response = await apiFetch<NewsResponse>("/api/context/news");

      if (response?.lifecycle === "success") {
        setNews(response.articles);
        setNewsConfigured(true);
        setNewsError(null);
      } else if (response?.lifecycle === "not_configured") {
        // Intentional empty state - NOT an error
        setNews([]);
        setNewsConfigured(false);
        setNewsError(null);
      } else {
        setNews([]);
        setNewsConfigured(true);
        setNewsError(response?.message || "Failed to fetch news");
      }
    } catch {
      setNews([]);
      setNewsError("Failed to fetch news");
    } finally {
      setNewsLoading(false);
    }
  }, [apiFetch]);

  // Fetch weather
  const fetchWeather = useCallback(async () => {
    try {
      setWeatherLoading(true);
      setWeatherError(null);

      const response = await apiFetch<WeatherResponse>("/api/context/weather");

      if (response?.lifecycle === "success" && response.weather) {
        setWeather(response.weather);
        setWeatherConfigured(true);
        setWeatherError(null);
      } else if (response?.lifecycle === "not_configured") {
        // Intentional empty state - NOT an error
        setWeather(null);
        setWeatherConfigured(false);
        setWeatherError(null);
      } else {
        setWeather(null);
        setWeatherConfigured(true);
        setWeatherError(response?.message || "Failed to fetch weather");
      }
    } catch {
      setWeather(null);
      setWeatherError("Failed to fetch weather");
    } finally {
      setWeatherLoading(false);
    }
  }, [apiFetch]);

  // Refresh all
  const refreshAll = useCallback(async () => {
    await Promise.all([fetchNews(), fetchWeather()]);
  }, [fetchNews, fetchWeather]);

  // Initial fetch
  useEffect(() => {
    if (!authReady) return;
    void refreshAll();
  }, [authReady, refreshAll]);

  const isLoading = newsLoading || weatherLoading;

  return {
    news,
    newsLoading,
    newsError,
    newsConfigured,
    weather,
    weatherLoading,
    weatherError,
    weatherConfigured,
    refreshNews: fetchNews,
    refreshWeather: fetchWeather,
    refreshAll,
    isLoading,
  };
}
