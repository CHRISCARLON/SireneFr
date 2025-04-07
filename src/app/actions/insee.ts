"use server";
import { z } from "zod";

const searchSchema = z.object({
  communeCode: z.string().min(1, "Un code postal est requis"),
});

export type SearchResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

export async function searchInseeSiret(
  formData: FormData
): Promise<SearchResult> {
  try {
    const communeCode = formData.get("communeCode") as string;
    const validation = searchSchema.safeParse({ communeCode });

    if (!validation.success) {
      return {
        success: false,
        error: "Code postal invalide",
      };
    }

    const apiKey = process.env.INSEE_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: "API key not configured",
      };
    }

    const url = `https://api.insee.fr/api-sirene/3.11/siret?q=codeCommuneEtablissement%3A${communeCode}`;

    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "X-INSEE-Api-Key-Integration": apiKey,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        success: false,
        error: `API request failed with status: ${response.status}`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("INSEE API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
