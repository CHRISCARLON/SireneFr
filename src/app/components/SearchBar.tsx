import React, { useState } from "react";

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showTick, setShowTick] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Searching for:", searchQuery);
    setShowTick(true);

    setTimeout(() => {
      setShowTick(false);
      setSearchQuery("");
    }, 300);
  };

  return (
    <div className="w-full max-w-md -mt-32">
      <form onSubmit={handleSearch} className="flex flex-col items-center">
        <h2 className="text-2xl mb-4">Chercher un code NAF</h2>
        <input
          type="text"
          value={showTick ? "✅" : searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 p-8 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Code NAF..."
        />
      </form>
    </div>
  );
};

export default SearchBar;
