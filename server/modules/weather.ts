import type {
  ClaimInput,
  ModuleFinding,
  ModuleResult,
} from "../types.js";

const OPEN_METEO_URL = "https://archive-api.open-meteo.com/v1/archive";

interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  timezone?: string;
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    relative_humidity_2m?: number[];
    precipitation?: number[];
    rain?: number[];
    weather_code?: number[];
    wind_speed_10m?: number[];
    surface_pressure?: number[];
  };
}

interface Coordinates {
  latitude: number;
  longitude: number;
  resolvedLocation: string;
}

/**
 * Convert a user-provided location into coordinates.
 *
 * Open-Meteo's weather archive works with latitude/longitude,
 * so we first resolve the location through Open-Meteo's
 * geocoding service.
 */
async function geocodeLocation(
  location: string
): Promise<Coordinates> {
  const url = new URL(
    "https://geocoding-api.open-meteo.com/v1/search"
  );

  url.searchParams.set("name", location);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Weather geocoding failed with status ${response.status}`
    );
  }

  const data = (await response.json()) as {
    results?: Array<{
      latitude: number;
      longitude: number;
      name: string;
      country?: string;
      admin1?: string;
    }>;
  };

  const result = data.results?.[0];

  if (!result) {
    throw new Error(`Could not locate "${location}"`);
  }

  const resolvedLocation = [
    result.name,
    result.admin1,
    result.country,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    latitude: result.latitude,
    longitude: result.longitude,
    resolvedLocation,
  };
}

/**
 * Convert Open-Meteo weather codes into human-readable
 * descriptions.
 */
function weatherCodeDescription(code: number): string {
  if (code === 0) return "Clear sky";

  if ([1, 2, 3].includes(code)) {
    return "Cloudy or partly cloudy";
  }

  if ([45, 48].includes(code)) {
    return "Fog";
  }

  if ([51, 53, 55].includes(code)) {
    return "Drizzle";
  }

  if ([56, 57].includes(code)) {
    return "Freezing drizzle";
  }

  if ([61, 63, 65].includes(code)) {
    return "Rain";
  }

  if ([66, 67].includes(code)) {
    return "Freezing rain";
  }

  if ([71, 73, 75, 77].includes(code)) {
    return "Snow or snow grains";
  }

  if ([80, 81, 82].includes(code)) {
    return "Rain showers";
  }

  if ([85, 86].includes(code)) {
    return "Snow showers";
  }

  if (code === 95) {
    return "Thunderstorm";
  }

  if ([96, 99].includes(code)) {
    return "Thunderstorm with hail";
  }

  return "Unknown weather condition";
}

/**
 * Calculate an average while safely ignoring missing values.
 */
function average(values: number[]): number | null {
  const valid = values.filter(
    (value) => typeof value === "number" && Number.isFinite(value)
  );

  if (valid.length === 0) {
    return null;
  }

  return (
    valid.reduce((sum, value) => sum + value, 0) /
    valid.length
  );
}

/**
 * Calculate the maximum value while safely ignoring missing values.
 */
function maximum(values: number[]): number | null {
  const valid = values.filter(
    (value) => typeof value === "number" && Number.isFinite(value)
  );

  if (valid.length === 0) {
    return null;
  }

  return Math.max(...valid);
}

/**
 * Fetch historical weather for a location and date.
 */
async function fetchHistoricalWeather(
  coordinates: Coordinates,
  date: string
): Promise<OpenMeteoResponse> {
  const url = new URL(OPEN_METEO_URL);

  url.searchParams.set(
    "latitude",
    coordinates.latitude.toString()
  );

  url.searchParams.set(
    "longitude",
    coordinates.longitude.toString()
  );

  url.searchParams.set("start_date", date);
  url.searchParams.set("end_date", date);

  url.searchParams.set(
    "hourly",
    [
      "temperature_2m",
      "relative_humidity_2m",
      "precipitation",
      "rain",
      "weather_code",
      "wind_speed_10m",
      "surface_pressure",
    ].join(",")
  );

  url.searchParams.set("timezone", "auto");

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Open-Meteo request failed with status ${response.status}`
    );
  }

  return (await response.json()) as OpenMeteoResponse;
}

/**
 * Main weather verification module.
 *
 * IMPORTANT:
 * This module does NOT decide whether the claim is true.
 * It only determines whether historical weather conditions
 * are consistent with the supplied location/date and produces
 * structured evidence for scoring.ts.
 */
export async function analyzeWeather(
  claim: ClaimInput
): Promise<ModuleResult> {
  const findings: ModuleFinding[] = [];
  const missing: string[] = [];
  const warnings: string[] = [];

  if (!claim.location) {
    return {
      score: 0,
      maxScore: 25,
      summary:
        "Weather verification could not be performed because no location was provided.",
      findings: [
        {
          label: "Location",
          value: "Not provided",
          tone: "bad",
        },
      ],
      missing: [
        "Claim location is required for historical weather verification",
      ],
      warnings: [],
      data: {},
    };
  }

  if (!claim.date) {
    return {
      score: 0,
      maxScore: 25,
      summary:
        "Weather verification could not be performed because no date was provided.",
      findings: [
        {
          label: "Claim date",
          value: "Not provided",
          tone: "bad",
        },
      ],
      missing: [
        "Claim date is required for historical weather verification",
      ],
      warnings: [],
      data: {},
    };
  }

  try {
    const coordinates = await geocodeLocation(claim.location);

    const weather = await fetchHistoricalWeather(
      coordinates,
      claim.date
    );

    const hourly = weather.hourly;

    if (!hourly) {
      return {
        score: 0,
        maxScore: 25,
        summary:
          "Weather data was unavailable for the claimed location and date.",
        findings: [
          {
            label: "Historical weather",
            value: "No hourly data returned",
            tone: "warn",
          },
        ],
        missing: [
          "Historical weather observations for the claimed date",
        ],
        warnings: [],
        data: {
          coordinates,
          date: claim.date,
        },
      };
    }

    const temperatures = hourly.temperature_2m ?? [];
    const humidity = hourly.relative_humidity_2m ?? [];
    const precipitation = hourly.precipitation ?? [];
    const rain = hourly.rain ?? [];
    const wind = hourly.wind_speed_10m ?? [];
    const pressure = hourly.surface_pressure ?? [];
    const weatherCodes = hourly.weather_code ?? [];

    const averageTemperature = average(temperatures);
    const averageHumidity = average(humidity);
    const totalPrecipitation = precipitation.reduce(
      (sum, value) =>
        Number.isFinite(value) ? sum + value : sum,
      0
    );

    const totalRain = rain.reduce(
      (sum, value) =>
        Number.isFinite(value) ? sum + value : sum,
      0
    );

    const maximumWind = maximum(wind);
    const averagePressure = average(pressure);

    const conditions = [
      ...new Set(
        weatherCodes
          .filter(
            (code): code is number =>
              typeof code === "number" &&
              Number.isFinite(code)
          )
          .map(weatherCodeDescription)
      ),
    ];

    /**
     * We deliberately give a neutral/supporting score here.
     *
     * Weather consistency is evidence, not proof.
     *
     * The scoring engine can later combine this with:
     * metadata + vision + evidence.
     */
    let score = 15;

    if (totalPrecipitation > 0) {
      score += 4;

      findings.push({
        label: "Precipitation",
        value: `${totalPrecipitation.toFixed(1)} mm recorded`,
        tone: "good",
      });
    } else {
      findings.push({
        label: "Precipitation",
        value: "No measurable precipitation recorded",
        tone: "neutral",
      });
    }

    if (conditions.length > 0) {
      findings.push({
        label: "Weather conditions",
        value: conditions.join(", "),
        tone: "good",
      });
    } else {
      missing.push(
        "Hourly weather condition codes were unavailable"
      );
    }

    if (averageTemperature !== null) {
      findings.push({
        label: "Average temperature",
        value: `${averageTemperature.toFixed(1)} °C`,
        tone: "neutral",
      });
    } else {
      missing.push(
        "Temperature data was unavailable"
      );
    }

    if (averageHumidity !== null) {
      findings.push({
        label: "Average humidity",
        value: `${averageHumidity.toFixed(0)}%`,
        tone: "neutral",
      });
    } else {
      missing.push(
        "Humidity data was unavailable"
      );
    }

    if (maximumWind !== null) {
      findings.push({
        label: "Maximum wind",
        value: `${maximumWind.toFixed(1)} km/h`,
        tone: "neutral",
      });
    } else {
      missing.push(
        "Wind data was unavailable"
      );
    }

    if (averagePressure !== null) {
      findings.push({
        label: "Surface pressure",
        value: `${averagePressure.toFixed(0)} hPa`,
        tone: "neutral",}
      );
    } else {
      missing.push(
        "Surface pressure data was unavailable"
      );
    }

    /**
     * The module cannot determine from weather alone
     * whether the claimed event actually happened.
     */
    missing.push(
      "Weather data cannot independently confirm that the claimed event occurred"
    );

    warnings.push(
      "Historical weather data represents modeled/reanalysis conditions and may differ from conditions at the exact capture point."
    );

    const summary =
      conditions.length > 0
        ? `Historical weather for ${coordinates.resolvedLocation} on ${claim.date} shows ${conditions.join(
            ", "
          ).toLowerCase()}, with approximately ${totalPrecipitation.toFixed(
            1
          )} mm of precipitation. These conditions can be used as supporting evidence for the claim, but weather alone cannot establish that the event occurred.`
        : `Historical weather data was retrieved for ${coordinates.resolvedLocation} on ${claim.date}. The available weather evidence can be used as supporting context, but it cannot independently establish that the claimed event occurred.`;

    return {
      score: Math.min(score, 25),
      maxScore: 25,
      summary,
      findings,
      missing,
      warnings,
      data: {
        provider: "Open-Meteo",
        location: coordinates.resolvedLocation,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        date: claim.date,
        timezone: weather.timezone ?? null,
        conditions,
        averageTemperature,
        averageHumidity,
        totalPrecipitation,
        totalRain,
        maximumWind,
        averagePressure,
      },
    };
  } catch (error) {
    console.error("Weather module error:", error);

    return {
      score: 0,
      maxScore: 25,
      summary:
        "Weather verification could not be completed because the historical weather service was unavailable.",
      findings: [
        {
          label: "Weather verification",
          value: "Unable to retrieve historical data",
          tone: "warn",
        },
      ],
      missing: [
        "Historical weather data for the claimed location/date",
      ],
      warnings: [
        "Weather verification failed and should not be interpreted as evidence against the claim.",
      ],
      data: {
        provider: "Open-Meteo",
        error:
          error instanceof Error
            ? error.message
            : "Unknown weather error",
      },
    };
  }
}

export default analyzeWeather;