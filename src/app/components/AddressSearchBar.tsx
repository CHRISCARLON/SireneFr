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
  title?: string;
  defaultValue?: string;
}

const AddressSearchBar = ({
  onSearchComplete,
  placeholder = "Rechercher une adresse...",
  title = "Recherche d'adresse",
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

  // Fetch suggestions as user types
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

  const handleReset = () => {
    setSearchQuery("");
    setResult(null);
    setSuggestions([]);
    setInseeResult(null);
  };

  return (
    <div
      className={`w-full ${
        result || inseeResult ? "max-w-6xl" : "max-w-2xl"
      } mx-auto transition-all duration-300`}
    >
      <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 mb-6">
        <h2 className="text-2xl mb-4 text-white text-center">{title}</h2>
        <div className="flex flex-col items-center">
          <div className="w-full max-w-md mb-4 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-md border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-3 focus:ring-blue-500"
              placeholder={placeholder}
              autoComplete="off"
            />

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-10 w-full bg-gray-800 border border-gray-700 rounded-md mt-1 max-h-60 overflow-y-auto"
              >
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 hover:bg-gray-700 cursor-pointer text-white"
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
              <div className="px-4 py-2 bg-blue-700 text-white rounded-md">
                Recherche en cours...
              </div>
            )}
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
        </div>
      </div>

      {result && (
        <div className="mt-2">
          {result.success && result.address ? (
            <div className="p-4 rounded-md border border-gray-700 bg-gray-800 text-white">
              <h3 className="font-bold mb-2 text-green-400">Adresse trouvée</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Left column - Main address info */}
                <div>
                  <h4 className="text-blue-400 text-sm uppercase font-bold mb-2">
                    Adresse principale
                  </h4>
                  <p className="mb-1">
                    <span className="text-gray-400">Adresse:</span>{" "}
                    {result.address.label}
                  </p>
                  {result.address.housenumber && (
                    <p className="mb-1">
                      <span className="text-gray-400">Numéro:</span>{" "}
                      {result.address.housenumber}
                    </p>
                  )}
                  {result.address.street && (
                    <p className="mb-1">
                      <span className="text-gray-400">Rue:</span>{" "}
                      {result.address.street}
                    </p>
                  )}
                  <p className="mb-1">
                    <span className="text-gray-400">Type:</span>{" "}
                    {result.address.type || "Non spécifié"}
                  </p>
                </div>

                {/* Middle column - Administrative info */}
                <div>
                  <h4 className="text-blue-400 text-sm uppercase font-bold mb-2">
                    Informations administratives
                  </h4>
                  <p className="mb-1">
                    <span className="text-gray-400">Code postal:</span>{" "}
                    {result.address.postcode}
                  </p>
                  <p className="mb-1">
                    <span className="text-gray-400">Ville:</span>{" "}
                    {result.address.city}
                  </p>
                  <p className="mb-1">
                    <span className="text-gray-400">Code INSEE:</span>{" "}
                    {result.address.citycode}
                  </p>
                  <p className="mb-1">
                    <span className="text-gray-400">Contexte:</span>{" "}
                    {result.address.context || "Non disponible"}
                  </p>
                  <p className="mb-1">
                    <span className="text-gray-400">ID:</span>{" "}
                    {result.address.id}
                  </p>
                </div>

                {/* Right column - Spatial info */}
                <div>
                  <h4 className="text-blue-400 text-sm uppercase font-bold mb-2">
                    Données spatiales
                  </h4>
                  <p className="mb-1">
                    <span className="text-gray-400">Importance:</span>{" "}
                    {result.address.importance || "Non spécifié"}
                  </p>
                  <p className="mb-1">
                    <span className="text-gray-400">Score:</span>{" "}
                    {result.address.score || "Non spécifié"}
                  </p>
                  <p className="mb-1">
                    <span className="text-gray-400">Coordonnées GPS:</span>{" "}
                    {result.address.coordinates[1]},{" "}
                    {result.address.coordinates[0]}
                  </p>
                  <p className="mb-1">
                    <span className="text-gray-400">X:</span>{" "}
                    {result.address.x || "Non disponible"}
                  </p>
                  <p className="mb-1">
                    <span className="text-gray-400">Y:</span>{" "}
                    {result.address.y || "Non disponible"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-900 p-4 rounded-md border border-red-700 text-red-100">
              <p>Erreur: {result.error}</p>
            </div>
          )}
        </div>
      )}

      {/* INSEE company information section */}
      {inseeLoading && (
        <div className="mt-4 p-4 bg-blue-900 rounded-md border border-blue-700 text-white">
          <p>Recherche des entreprises en cours...</p>
        </div>
      )}

      {inseeResult && (
        <div className="mt-4">
          {inseeResult.success &&
          inseeResult.companies &&
          inseeResult.companies.length > 0 ? (
            <div className="p-4 rounded-md border border-gray-700 bg-gray-800 text-white">
              <h3 className="font-bold mb-2">
                Liste des établissements actifs et employeurs (
                {inseeResult.total} au total et{" "}
                {Math.min(inseeResult.companies.length, 20)} affichés)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-700 text-left">
                      <th className="p-2 text-blue-400">Nom</th>
                      <th className="p-2 text-blue-400">SIRET</th>
                      <th className="p-2 text-blue-400">Adresse</th>
                      <th className="p-2 text-blue-400">Activité</th>
                      <th className="p-2 text-blue-400">Date création</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inseeResult.companies.map((company, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-700 hover:bg-gray-700"
                      >
                        <td className="p-2">{company.nom}</td>
                        <td className="p-2">{company.siret}</td>
                        <td className="p-2">
                          {company.adresse}, {company.codePostal}{" "}
                          {company.ville}
                        </td>
                        <td className="p-2">{company.activite}</td>
                        <td className="p-2">
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
            <div className="mt-4 p-4 bg-yellow-900 rounded-md border border-yellow-700 text-yellow-100">
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
