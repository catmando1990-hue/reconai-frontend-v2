"use client";

import Link from "next/link";
import { RouteShell } from "@/components/dashboard/RouteShell";
import PageHelp from "@/components/dashboard/PageHelp";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Sun,
  Cloud,
  CloudRain,
  Snowflake,
  Wind,
  Newspaper,
  ExternalLink,
  Database,
  Briefcase,
  Wallet,
  Building,
  Sparkles,
  AlertCircle,
  Settings,
} from "lucide-react";
import { useContextData } from "@/hooks/useContextData";
import { useUserProfile } from "@/lib/user-profile-context";
import { useOrg } from "@/lib/org-context";
import {
  hasGovConEntitlement,
  hasPayrollEntitlement,
} from "@/lib/entitlements";

/**
 * Home - Executive Context Page
 *
 * Welcome + Context dashboard (NO FINANCIAL DATA)
 *
 * CANONICAL LAWS:
 * - NO financial KPIs, charts, or metrics
 * - Internet news + local weather (server-side fetched)
 * - Manual refresh only
 * - Intentional empty states for unconfigured APIs
 * - Token-only colors (no hardcoded hex/rgb)
 * - Desktop-first layout
 */

function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getWeatherIconName(
  condition: string,
): "rain" | "snow" | "cloud" | "wind" | "sun" {
  const cond = condition.toLowerCase();
  if (cond.includes("rain") || cond.includes("drizzle")) return "rain";
  if (cond.includes("snow")) return "snow";
  if (cond.includes("cloud") || cond.includes("overcast")) return "cloud";
  if (cond.includes("wind")) return "wind";
  return "sun";
}

function WeatherIcon({
  condition,
  className,
}: {
  condition?: string;
  className?: string;
}) {
  const iconName = condition ? getWeatherIconName(condition) : "sun";
  switch (iconName) {
    case "rain":
      return <CloudRain className={className} />;
    case "snow":
      return <Snowflake className={className} />;
    case "cloud":
      return <Cloud className={className} />;
    case "wind":
      return <Wind className={className} />;
    default:
      return <Sun className={className} />;
  }
}

export default function HomePage() {
  const {
    news,
    newsLoading,
    newsError,
    newsConfigured,
    weather,
    weatherLoading,
    weatherError,
    weatherConfigured,
    refreshAll,
    isLoading,
  } = useContextData();

  const { profile } = useUserProfile();
  const { org_name } = useOrg();
  const orgName = org_name || "your organization";

  const showGovCon = hasGovConEntitlement(profile?.tiers, profile?.role);
  const showPayroll = hasPayrollEntitlement(profile?.tiers, profile?.role);

  const greeting = getTimeOfDayGreeting();

  return (
    <RouteShell
      title={`${greeting}`}
      subtitle={`Welcome to ${orgName}`}
      right={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => void refreshAll()}
            disabled={isLoading}
            className="h-8 px-2"
          >
            <RefreshCw
              className={isLoading ? "h-4 w-4 animate-spin" : "h-4 w-4"}
            />
            <span className="ml-1.5 hidden sm:inline">Refresh</span>
          </Button>
          <PageHelp
            title="Home"
            description="Your executive context dashboard with news and weather."
          />
        </div>
      }
    >
      <div className="space-y-6">
        {/* Quick Access Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/core" className="group">
            <Card className="border-border bg-card hover:border-primary/50 transition-colors h-full">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <Database className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium text-foreground">Core</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Transactions & Accounts
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/cfo" className="group">
            <Card className="border-border bg-card hover:border-primary/50 transition-colors h-full">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium text-foreground">CFO</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Executive Oversight
                </p>
              </CardContent>
            </Card>
          </Link>

          {showPayroll && (
            <Link href="/payroll" className="group">
              <Card className="border-border bg-card hover:border-primary/50 transition-colors h-full">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <Wallet className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground">Payroll</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Workforce Management
                  </p>
                </CardContent>
              </Card>
            </Link>
          )}

          {showGovCon && (
            <Link href="/govcon" className="group">
              <Card className="border-border bg-card hover:border-primary/50 transition-colors h-full">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <Building className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground">GovCon</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    DCAA Compliance
                  </p>
                </CardContent>
              </Card>
            </Link>
          )}

          {!showPayroll && !showGovCon && (
            <Link href="/settings" className="group">
              <Card className="border-border bg-card hover:border-primary/50 transition-colors h-full">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3 group-hover:bg-muted/80 transition-colors">
                    <Settings className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-foreground">Settings</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Preferences
                  </p>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>

        {/* Intelligence Quick Links */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link href="/core/intelligence">
                <Button variant="outline" className="w-full justify-start">
                  <Database className="h-4 w-4 mr-2" />
                  Core
                </Button>
              </Link>
              <Link href="/cfo/intelligence">
                <Button variant="outline" className="w-full justify-start">
                  <Briefcase className="h-4 w-4 mr-2" />
                  CFO
                </Button>
              </Link>
              {showPayroll && (
                <Link href="/payroll/intelligence">
                  <Button variant="outline" className="w-full justify-start">
                    <Wallet className="h-4 w-4 mr-2" />
                    Payroll
                  </Button>
                </Link>
              )}
              {showGovCon && (
                <Link href="/govcon/intelligence">
                  <Button variant="outline" className="w-full justify-start">
                    <Building className="h-4 w-4 mr-2" />
                    GovCon
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Context Row: Weather + News */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weather Card */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <WeatherIcon
                  condition={weather?.condition}
                  className="h-4 w-4 text-muted-foreground"
                />
                Weather
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {weatherLoading && (
                <div className="animate-pulse space-y-2">
                  <div className="h-8 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              )}

              {!weatherLoading && !weatherConfigured && (
                <div className="text-center py-4">
                  <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Weather not configured.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Set WEATHER_API_KEY in environment.
                  </p>
                </div>
              )}

              {!weatherLoading && weatherError && weatherConfigured && (
                <div className="text-center py-4">
                  <AlertCircle className="h-8 w-8 mx-auto text-destructive mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {weatherError}
                  </p>
                </div>
              )}

              {!weatherLoading && weather && (
                <div className="flex items-center gap-4">
                  <div className="shrink-0">
                    <WeatherIcon
                      condition={weather?.condition}
                      className="h-12 w-12 text-primary"
                    />
                  </div>
                  <div>
                    <div className="text-3xl font-semibold tabular-nums">
                      {weather.temperature}°{weather.temperatureUnit}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {weather.condition}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {weather.location}
                    </div>
                  </div>
                  <div className="ml-auto text-right text-xs text-muted-foreground">
                    <div>Humidity: {weather.humidity}%</div>
                    <div>
                      Wind: {weather.windSpeed} {weather.windUnit}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* News Feed */}
          <Card className="border-border bg-card lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Newspaper className="h-4 w-4 text-muted-foreground" />
                Business News
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {newsLoading && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex gap-3">
                      <div className="h-4 bg-muted rounded flex-1" />
                    </div>
                  ))}
                </div>
              )}

              {!newsLoading && !newsConfigured && (
                <div className="text-center py-6">
                  <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    News feed not configured.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Set NEWS_API_KEY in environment.
                  </p>
                </div>
              )}

              {!newsLoading && newsError && newsConfigured && (
                <div className="text-center py-6">
                  <AlertCircle className="h-8 w-8 mx-auto text-destructive mb-2" />
                  <p className="text-sm text-muted-foreground">{newsError}</p>
                </div>
              )}

              {!newsLoading && news.length > 0 && (
                <div className="space-y-3">
                  {news.slice(0, 5).map((article) => (
                    <a
                      key={article.id}
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group"
                    >
                      <div className="flex items-start gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                            {article.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {article.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {article.source} •{" "}
                            {new Date(article.publishedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </a>
                  ))}
                </div>
              )}

              {!newsLoading &&
                newsConfigured &&
                news.length === 0 &&
                !newsError && (
                  <div className="text-center py-6">
                    <Newspaper className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No news articles available.
                    </p>
                  </div>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </RouteShell>
  );
}
