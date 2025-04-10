"use server";
import { z } from "zod";
import pino from "pino";

// Schema for input validation
const searchSchema = z.object({
  text: z.string().min(1, "Un texte de recherche est requis"),
});

const logger = pino({
  name: "address-actions",
  level: "info",
});

// Define interfaces for API responses
interface GeoplatformeResponse {
  results: {
    fulltext: string;
    classification: number;
    type: string;
    city?: string;
    zipcode?: string;
    street?: string;
    kind?: string;
  }[];
}

interface BanApiResponse {
  type: string;
  version: string;
  features: {
    type: string;
    geometry: {
      type: string;
      coordinates: [number, number];
    };
    properties: {
      label: string;
      score: number;
      housenumber?: string;
      id: string;
      type: string;
      name: string;
      postcode: string;
      citycode: string;
      x: number;
      y: number;
      city: string;
      context: string;
      importance: number;
      street?: string;
    };
  }[];
  attribution: string;
  licence: string;
  query: string;
  limit: number;
}

// Type for suggested addresses
export type AddressSuggestion = {
  label: string;
  city?: string;
  zipcode?: string;
  type: string;
};

// Type for address details after selection
export type AddressDetails = {
  label: string;
  coordinates: [number, number];
  housenumber?: string;
  street?: string;
  postcode: string;
  city: string;
  citycode: string;
  id: string;
  type?: string;
  name?: string;
  x?: number;
  y?: number;
  context?: string;
  importance?: number;
  score?: number;
};

export type AutocompleteResult = {
  success: boolean;
  suggestions?: AddressSuggestion[];
  error?: string;
};

export type AddressSearchResult = {
  success: boolean;
  address?: AddressDetails;
  error?: string;
};

// Function for autocomplete suggestions
export async function getAddressSuggestions(
  formData: FormData,
): Promise<AutocompleteResult> {
  try {
    const text = formData.get("text") as string;
    const validation = searchSchema.safeParse({ text });

    if (!validation.success) {
      return {
        success: false,
        error: "Un texte de recherche est requis",
      };
    }

    // Call the Géoplateforme autocomplete API
    const url = `https://data.geopf.fr/geocodage/completion?text=${encodeURIComponent(
      text,
    )}`;

    const response = await fetch(url, {
      headers: {
        accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        success: false,
        error: `API request failed with status: ${response.status}`,
      };
    }

    const data = (await response.json()) as GeoplatformeResponse;

    // Transform response
    const suggestions = data.results.map((result) => ({
      label: result.fulltext,
      city: result.city,
      zipcode: result.zipcode,
      type: result.type,
    }));

    return {
      success: true,
      suggestions,
    };
  } catch (error) {
    console.error("Autocomplete API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Function to search full address details after selection
export async function searchAddress(
  formData: FormData,
): Promise<AddressSearchResult> {
  logger.info("searchAddress called with query: %s", formData.get("query"));
  try {
    const query = formData.get("query") as string;
    const validation = searchSchema.safeParse({ text: query });

    if (!validation.success) {
      return {
        success: false,
        error: "Une adresse est requise",
      };
    }

    // Call the BAN API
    const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
      query,
    )}&limit=1`;

    const response = await fetch(url, {
      headers: {
        accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        success: false,
        error: `API request failed with status: ${response.status}`,
      };
    }

    const data = (await response.json()) as BanApiResponse;

    if (!data.features || data.features.length === 0) {
      return {
        success: false,
        error: "Aucune adresse trouvée",
      };
    }

    const feature = data.features[0];

    return {
      success: true,
      address: {
        label: feature.properties.label,
        coordinates: feature.geometry.coordinates,
        housenumber: feature.properties.housenumber,
        street: feature.properties.street,
        postcode: feature.properties.postcode,
        city: feature.properties.city,
        citycode: feature.properties.citycode,
        id: feature.properties.id,
        type: feature.properties.type,
        name: feature.properties.name,
        x: feature.properties.x,
        y: feature.properties.y,
        context: feature.properties.context,
        importance: feature.properties.importance,
        score: feature.properties.score,
      },
    };
  } catch (error) {
    console.error("Address search API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
