"use client";

import React, { useState } from "react";
import { searchInseeSiret, type SearchResult } from "../actions/insee";

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);

  async function handleSearch(formData: FormData) {
    setLoading(true);
    try {
      const result = await searchInseeSiret(formData);
      setResult(result);
    } catch (error) {
      console.error("Search error:", error);
      setResult({
        success: false,
        error: "Failed to perform search",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleReset = () => {
    setSearchQuery("");
    setResult(null);
  };

  return (
    <div className="w-full max-w-md -mt-32">
      <form action={handleSearch} className="flex flex-col items-center">
        <h2 className="text-2xl mb-4">Chercher le répertoire Sirene</h2>
        <div className="w-full mb-4">
          <input
            type="text"
            name="communeCode"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-3 focus:ring-blue-600"
            placeholder="Indiquez un code postal"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            {loading ? "Recherche en cours..." : "Rechercher"}
          </button>
          {result && (
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </form>

      {result && (
        <div className="mt-6">
          {result.success ? (
            <div className="p-4 rounded-md border bg-green-50 border-green-200">
              <h3 className="font-bold mb-2 text-black">Résultats:</h3>
              <pre className="text-sm overflow-auto max-h-96 text-black">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-800">
              <p>Erreur: {result.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
