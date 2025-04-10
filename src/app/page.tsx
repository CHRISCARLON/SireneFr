"use client";

import React, { useState } from "react";
import AddressSearchBar from "./components/AddressSearchBar";

export default function Home() {
  const [showExplanation, setShowExplanation] = useState(true);

  return (
    <div className="flex bg-white" style={{ background: "white" }}>
      <main className="w-full p-4">
        <div className="min-h-screen flex flex-col items-center">
          <div className="mt-16 mb-12 text-center">
            <h1 className="text-3xl font-bold text-black">
              Une application simple pour vérifier le répertoire Sirene 🇫🇷
            </h1>
          </div>

          <div className="w-full">
            {showExplanation ? (
              <div className="mb-6">
                <p className="text-center mb-6 text-gray-600 max-w-3xl mx-auto">
                  Trouvez facilement des informations sur les entreprises
                  françaises.
                </p>
                <p className="text-center mb-6 text-gray-600 max-w-3xl mx-auto">
                  Avec une adresse vous pouvez trouver des informations
                  administratives détaillées (code postal, ville, coordonnées
                  GPS).
                </p>
                <p className="text-center mb-6 text-gray-600 max-w-3xl mx-auto">
                  Vous pouvez également accéder aux données sur les entreprises
                  actives avec au moins un employé situé à cette adresse.
                </p>
                <div className="text-center mt-8">
                  <button
                    onClick={() => setShowExplanation(false)}
                    className="px-6 py-2 bg-blue-400 text-white rounded-md hover:bg-blue-500 transition-colors"
                  >
                    Rechercher
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <button
                    onClick={() => setShowExplanation(true)}
                    className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-md border border-gray-300 hover:bg-gray-200 transition-colors text-sm"
                  >
                    ← Retour aux informations
                  </button>
                </div>
                <AddressSearchBar onSearchComplete={() => {}} />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
