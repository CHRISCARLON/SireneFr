"use client";

import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import AddressSearchBar from "./components/AddressSearchBar";

export default function Home() {
  const [activeComponent, setActiveComponent] = useState<string>("home");

  return (
    <div className="flex">
      <Sidebar onSubmit={setActiveComponent} />
      <main className="ml-28 p-4 flex-grow">
        <div className="min-h-screen flex items-center justify-center">
          {activeComponent === "search" ? (
            <AddressSearchBar />
          ) : (
            <div className="-mt-32">
              <h1 className="text-2xl font-bold">
                Une application simple pour vérifier le répertoire Sirene
              </h1>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
