import React from "react";

interface SidebarProps {
  onSubmit: (item: string) => void;
}

const Sidebar = ({ onSubmit }: SidebarProps) => {
  return (
    <div className="w-28 h-screen fixed left-0 top-0 p-4">
      <nav>
        <ul className="space-y-4">
          <li>
            <button
              onClick={() => onSubmit("home")}
              className="w-full text-sm px-3 py-2 text-white rounded-md focus:ring-2 focus:ring-blue-500 "
            >
              Home
            </button>
          </li>
          <li>
            <button
              onClick={() => onSubmit("search")}
              className="w-full text-sm px-3 py-2 text-white rounded-md focus:ring-2 focus:ring-blue-500"
            >
              Naf
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
