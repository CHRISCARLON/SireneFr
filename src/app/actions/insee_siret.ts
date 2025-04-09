"use server";
import { z } from "zod";

const searchSchema = z.object({
  address: z.string().min(1, "Une adresse est requise"),
});

// Define interface for the INSEE API response
interface InseeApiResponse {
  header: {
    statut: number;
    message: string;
    total: number;
    debut: number;
    nombre: number;
  };
  etablissements: {
    siren: string;
    nic: string;
    siret: string;
    dateCreationEtablissement: string;
    uniteLegale: {
      denominationUniteLegale?: string;
      nomUniteLegale?: string;
      prenom1UniteLegale?: string;
      activitePrincipaleUniteLegale?: string;
    };
    adresseEtablissement: {
      numeroVoieEtablissement?: string;
      typeVoieEtablissement?: string;
      libelleVoieEtablissement?: string;
      codePostalEtablissement?: string;
      libelleCommuneEtablissement?: string;
    };
  }[];
}

export type SimplifiedCompany = {
  siret: string;
  nom: string;
  adresse: string;
  codePostal: string;
  ville: string;
  activite: string;
  dateCreation: string;
};

export type SearchResult = {
  success: boolean;
  total?: number;
  companies?: SimplifiedCompany[];
  error?: string;
};

export async function searchInseeSiret(
  formData: FormData
): Promise<SearchResult> {
  try {
    const address = formData.get("address") as string;
    const validation = searchSchema.safeParse({ address });

    if (!validation.success) {
      return {
        success: false,
        error: "Adresse invalide",
      };
    }

    const apiKey = process.env.INSEE_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: "API key not configured",
      };
    }

    const query = encodeURIComponent(
      `identifiantAdresseEtablissement:${address}_B AND periode(etatAdministratifEtablissement:A AND caractereEmployeurEtablissement: O)`
    );

    const url = `https://api.insee.fr/api-sirene/3.11/siret?q=${query}`;
    console.log(url);

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

    const rawData = (await response.json()) as InseeApiResponse;

    // Extract only the data we need
    const total = rawData.header?.total || 0;
    const companies = (rawData.etablissements || []).map((etab) => {
      // Extract company information into simplified format
      return {
        siret: etab.siret,
        nom:
          etab.uniteLegale?.denominationUniteLegale ||
          `${etab.uniteLegale?.nomUniteLegale || ""} ${
            etab.uniteLegale?.prenom1UniteLegale || ""
          }`,
        adresse: [
          etab.adresseEtablissement?.numeroVoieEtablissement,
          etab.adresseEtablissement?.typeVoieEtablissement,
          etab.adresseEtablissement?.libelleVoieEtablissement,
        ]
          .filter(Boolean)
          .join(" "),
        codePostal: etab.adresseEtablissement?.codePostalEtablissement || "",
        ville: etab.adresseEtablissement?.libelleCommuneEtablissement || "",
        activite: etab.uniteLegale?.activitePrincipaleUniteLegale || "",
        dateCreation: etab.dateCreationEtablissement,
      };
    });

    return {
      success: true,
      total,
      companies,
    };
  } catch (error) {
    console.error("INSEE API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
