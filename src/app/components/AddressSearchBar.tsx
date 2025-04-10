"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  getAddressSuggestions,
  searchAddress,
  type AddressSearchResult,
  type AddressSuggestion,
} from "../actions/address_autocomplete";
import {
  searchInseeSiret,
  type SearchResult as InseeSearchResult,
} from "../actions/insee_siret";

interface AddressSearchBarProps {
  onSearchComplete?: (result: AddressSearchResult) => void;
  placeholder?: string;
  defaultValue?: string;
}

const AddressSearchBar = ({
  onSearchComplete,
  placeholder = "Saisir une adresse...",
  defaultValue = "",
}: AddressSearchBarProps) => {
  const [searchQuery, setSearchQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AddressSearchResult | null>(null);
  const [inseeResult, setInseeResult] = useState<InseeSearchResult | null>(
    null
  );
  const [inseeLoading, setInseeLoading] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Handle outside clicks to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch suggestions as the user types
  async function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const formData = new FormData();
    formData.append("text", value);

    try {
      const result = await getAddressSuggestions(formData);
      if (result.success && result.suggestions) {
        setSuggestions(result.suggestions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error("Autocomplete error:", error);
      setSuggestions([]);
    }
  }

  // Fetch company data using INSEE API
  async function fetchInseeData(addressId: string) {
    setInseeLoading(true);
    setInseeResult(null);

    try {
      // Format the ID by removing the underscore
      const formattedId = addressId.replace("_", "");

      const formData = new FormData();
      formData.append("address", formattedId);

      const inseeResult = await searchInseeSiret(formData);
      setInseeResult(inseeResult);
    } catch (error) {
      console.error("INSEE API error:", error);
      setInseeResult({
        success: false,
        error: "Failed to fetch company data",
      });
    } finally {
      setInseeLoading(false);
    }
  }

  // Handle full address search when a suggestion is selected
  async function handleSelectSuggestion(suggestion: AddressSuggestion) {
    setSearchQuery(suggestion.label);
    setShowSuggestions(false);

    const formData = new FormData();
    formData.append("query", suggestion.label);

    setLoading(true);
    try {
      const result = await searchAddress(formData);
      setResult(result);
      onSearchComplete?.(result);

      // If address search was successful, fetch company data using the full address label
      if (result.success && result.address && result.address.id) {
        await fetchInseeData(result.address.id);
      }
    } catch (error) {
      console.error("Address search error:", error);
      const errorResult: AddressSearchResult = {
        success: false,
        error: "Failed to perform address search",
      };
      setResult(errorResult);
      onSearchComplete?.(errorResult);
    } finally {
      setLoading(false);
    }
  }

  // Reset the search bar back to normal
  const handleReset = () => {
    setSearchQuery("");
    setResult(null);
    setSuggestions([]);
    setInseeResult(null);
  };

  return (
    <div className={`w-full mx-auto transition-all duration-300`}>
      <div className="max-w-2xl mx-auto bg-blue-50 p-6 rounded-lg border border-blue-200 shadow-md">
        <h2 className="text-2xl mb-4 text-blue-800 text-center font-semibold"></h2>
        <div className="flex flex-col items-center">
          <div className="w-full max-w-xl mb-4 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-md border border-blue-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              placeholder={placeholder}
              autoComplete="off"
            />

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-10 w-full bg-white border border-blue-200 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg"
              >
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-gray-800"
                    onClick={() => handleSelectSuggestion(suggestion)}
                  >
                    {suggestion.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {loading && (
              <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md border border-blue-200">
                Recherche en cours...
              </div>
            )}
            {result && (
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md border border-gray-300 hover:bg-blue-400 transition-colors hover:text-white"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results sections */}
      {result && (
        <div className="mt-16 w-full max-w-6xl mx-auto">
          {result.success && result.address ? (
            <div className="p-4 rounded-md border border-blue-200 bg-white shadow-md text-gray-800">
              <h3 className="font-bold mb-2 text-green-600">Adresse trouvée</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Left column - Main address info */}
                <div>
                  <h4 className="text-blue-700 text-sm uppercase font-bold mb-2">
                    Adresse principale
                  </h4>
                  <p className="mb-1">
                    <span className="text-gray-600 font-medium">Adresse:</span>{" "}
                    {result.address.label}
                  </p>
                  {result.address.housenumber && (
                    <p className="mb-1">
                      <span className="text-gray-600 font-medium">Numéro:</span>{" "}
                      {result.address.housenumber}
                    </p>
                  )}
                  {result.address.street && (
                    <p className="mb-1">
                      <span className="text-gray-600 font-medium">Rue:</span>{" "}
                      {result.address.street}
                    </p>
                  )}
                  <p className="mb-1">
                    <span className="text-gray-600 font-medium">Type:</span>{" "}
                    {result.address.type || "Non spécifié"}
                  </p>
                </div>

                {/* Middle column - Administrative info */}
                <div>
                  <h4 className="text-blue-700 text-sm uppercase font-bold mb-2">
                    Informations administratives
                  </h4>
                  <p className="mb-1">
                    <span className="text-gray-600 font-medium">
                      Code postal:
                    </span>{" "}
                    {result.address.postcode}
                  </p>
                  <p className="mb-1">
                    <span className="text-gray-600 font-medium">Ville:</span>{" "}
                    {result.address.city}
                  </p>
                  <p className="mb-1">
                    <span className="text-gray-600 font-medium">
                      Code INSEE:
                    </span>{" "}
                    {result.address.citycode}
                  </p>
                  <p className="mb-1">
                    <span className="text-gray-600 font-medium">Contexte:</span>{" "}
                    {result.address.context || "Non disponible"}
                  </p>
                  <p className="mb-1">
                    <span className="text-gray-600 font-medium">ID:</span>{" "}
                    {result.address.id}
                  </p>
                </div>

                {/* Right column - Spatial info */}
                <div>
                  <h4 className="text-blue-700 text-sm uppercase font-bold mb-2">
                    Données spatiales
                  </h4>
                  <p className="mb-1">
                    <span className="text-gray-600 font-medium">
                      Importance:
                    </span>{" "}
                    {result.address.importance || "Non spécifié"}
                  </p>
                  <p className="mb-1">
                    <span className="text-gray-600 font-medium">Score:</span>{" "}
                    {result.address.score || "Non spécifié"}
                  </p>
                  <p className="mb-1">
                    <span className="text-gray-600 font-medium">
                      Coordonnées GPS:
                    </span>{" "}
                    {result.address.coordinates[1]},{" "}
                    {result.address.coordinates[0]}
                  </p>
                  <p className="mb-1">
                    <span className="text-gray-600 font-medium">X:</span>{" "}
                    {result.address.x || "Non disponible"}
                  </p>
                  <p className="mb-1">
                    <span className="text-gray-600 font-medium">Y:</span>{" "}
                    {result.address.y || "Non disponible"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-700">
              <p>Erreur: {result.error}</p>
            </div>
          )}
        </div>
      )}

      {/* INSEE company information */}
      {inseeLoading && (
        <div className="mt-16 max-w-6xl mx-auto p-4 bg-blue-50 rounded-md border border-blue-200 text-blue-700">
          <p>Recherche en cours...</p>
        </div>
      )}

      {inseeResult && (
        <div className="mt-16 w-full max-w-6xl mx-auto">
          {inseeResult.success &&
          inseeResult.companies &&
          inseeResult.companies.length > 0 ? (
            <div className="p-4 rounded-md border border-blue-200 bg-white shadow-md text-gray-800 w-full">
              <h3 className="font-bold mb-4 text-lg text-blue-800">
                Liste des établissements actifs et employeurs (
                {inseeResult.total} au total et{" "}
                {Math.min(inseeResult.companies.length, 20)} affichés)
              </h3>
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-full table-auto">
                  <thead>
                    <tr className="border-b-2 border-blue-200 text-left bg-blue-50">
                      <th className="p-3 text-blue-700 font-semibold">Nom</th>
                      <th className="p-3 text-blue-700 font-semibold">SIRET</th>
                      <th className="p-3 text-blue-700 font-semibold">
                        Adresse
                      </th>
                      <th className="p-3 text-blue-700 font-semibold">
                        Activité
                      </th>
                      <th className="p-3 text-blue-700 font-semibold">
                        Date création
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {inseeResult.companies.map((company, index) => (
                      <tr
                        key={index}
                        className="border-b border-blue-100 hover:bg-blue-50 transition-colors"
                      >
                        <td className="p-3 font-medium">{company.nom}</td>
                        <td className="p-3">{company.siret}</td>
                        <td className="p-3">
                          {company.adresse}, {company.codePostal}{" "}
                          {company.ville}
                        </td>
                        <td className="p-3">{company.activite}</td>
                        <td className="p-3">
                          {new Date(company.dateCreation).toLocaleDateString(
                            "fr-FR"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 rounded-md border border-yellow-200 text-yellow-700">
              <p>
                {inseeResult.error ||
                  "Aucune entreprise trouvée à cette adresse"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AddressSearchBar;
