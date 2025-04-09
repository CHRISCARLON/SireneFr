"use client";

import React, { useState } from "react";
import {
  searchInseeSiret,
  type SearchResult,
  type SimplifiedCompany,
} from "../actions/insee";

interface SearchBarProps {
  onSearchComplete?: (result: SearchResult) => void;
  placeholder?: string;
  title?: string;
  defaultValue?: string;
}

const SearchBar = ({
  onSearchComplete,
  placeholder = "Indiquez un code postal...",
  title = "Chercher le répertoire Sirene",
  defaultValue = "",
}: SearchBarProps) => {
  const [searchQuery, setSearchQuery] = useState(defaultValue);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);

  async function handleSearch(formData: FormData) {
    setLoading(true);
    try {
      const result = await searchInseeSiret(formData);
      setResult(result);
      onSearchComplete?.(result);
    } catch (error) {
      console.error("Search error:", error);
      const errorResult: SearchResult = {
        success: false,
        error: "Failed to perform search",
      };
      setResult(errorResult);
      onSearchComplete?.(errorResult);
    } finally {
      setLoading(false);
    }
  }

  const handleReset = () => {
    setSearchQuery("");
    setResult(null);
  };

  return (
    <div className="w-full max-w-4xl">
      <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 mb-6">
        <h2 className="text-2xl mb-4 text-white text-center">{title}</h2>
        <form action={handleSearch} className="flex flex-col items-center">
          <div className="w-full max-w-md mb-4">
            <input
              type="text"
              name="codePostal"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-md border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-3 focus:ring-blue-500"
              placeholder={placeholder}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-blue-700"
            >
              {loading ? "Recherche en cours..." : "Rechercher"}
            </button>
            {result && (
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </form>
      </div>

      {result && (
        <div className="mt-2">
          {result.success ? (
            <div className="p-4 rounded-md border border-gray-700 bg-gray-800 text-white">
              <h3 className="font-bold mb-2">
                Total: <span className="text-blue-400">{result.total}</span>
              </h3>

              {result.companies && result.companies.length > 0 ? (
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-300 mb-2">
                    Liste des établissements actifs (
                    {Math.min(result.companies.length, 20)} affichés):
                  </h4>
                  <div className="overflow-x-auto rounded-md">
                    <table className="w-full table-auto bg-gray-900">
                      <thead>
                        <tr className="bg-gray-800 text-gray-300 border-b border-gray-700">
                          <th className="py-2 px-4 text-left">SIRET</th>
                          <th className="py-2 px-4 text-left">Nom</th>
                          <th className="py-2 px-4 text-left">Adresse</th>
                          <th className="py-2 px-4 text-left">Activité</th>
                          <th className="py-2 px-4 text-left">Date création</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.companies.map((company: SimplifiedCompany) => (
                          <tr
                            key={company.siret}
                            className="border-b border-gray-700 hover:bg-gray-700"
                          >
                            <td className="py-2 px-4 text-gray-300">
                              {company.siret}
                            </td>
                            <td className="py-2 px-4 text-gray-300">
                              {company.nom}
                            </td>
                            <td className="py-2 px-4 text-gray-300">
                              {company.adresse}, {company.codePostal}{" "}
                              {company.ville}
                            </td>
                            <td className="py-2 px-4 text-gray-300">
                              {company.activite}
                            </td>
                            <td className="py-2 px-4 text-gray-300">
                              {new Date(
                                company.dateCreation
                              ).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">Aucun établissement trouvé.</p>
              )}
            </div>
          ) : (
            <div className="bg-red-900 p-4 rounded-md border border-red-700 text-red-100">
              <p>Erreur: {result.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
