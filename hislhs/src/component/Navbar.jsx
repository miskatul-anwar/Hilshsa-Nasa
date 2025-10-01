import React, { useState } from 'react';
import { Search, ZoomIn, ZoomOut, Square, X } from 'lucide-react';

const Navbar = ({ 
  onSearch, 
  onZoomIn, 
  onZoomOut, 
  onToggleDrawMode, 
  isDrawMode,
  onClearSelection 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(true);
      await onSearch(searchQuery);
      setIsSearching(false);
    }
  };

  return (
    <>
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-2xl">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <input
              type="search"
              name="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Planned Cities"
              className="w-full h-12 pl-5 pr-20 bg-white text-gray-900 placeholder:text-gray-500 rounded-full focus:outline-none transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)] focus:shadow-[0_4px_12px_rgba(0,0,0,0.25)] text-[15px] indent-5 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
              disabled={isSearching}
            />
            {searchQuery && !isSearching && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute top-1/2 -translate-y-1/2 right-12 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            )}
            {isSearching ? (
              <div className="absolute top-1/2 -translate-y-1/2 right-4 flex items-center">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <button
                type="submit"
                className="absolute top-1/2 -translate-y-1/2 right-4 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                disabled={!searchQuery.trim()}
              >
                <Search className="h-5 w-5" strokeWidth={2} />
              </button>
            )}
          </div>
        </form>
      </div>
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
        <div className="bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.15)] overflow-hidden">
          <button
            onClick={onZoomIn}
            className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors border-b border-gray-200"
            title="Zoom in"
          >
            <ZoomIn size={20} />
          </button>
          <button
            onClick={onZoomOut}
            className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
            title="Zoom out"
          >
            <ZoomOut size={20} />
          </button>
        </div>
        <button
          onClick={onToggleDrawMode}
          className={`w-10 h-10 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.15)] flex items-center justify-center transition-all duration-200 ${
            isDrawMode
              ? 'bg-blue-600 text-white shadow-[0_4px_12px_rgba(59,130,246,0.4)]'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          title={isDrawMode ? 'Drawing Mode Active' : 'Enable Drawing Mode'}
        >
          <Square size={20} />
        </button>
        <button
          onClick={onClearSelection}
          className="w-10 h-10 bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.15)] flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
          title="Clear Selection"
        >
          <X size={20} />
        </button>
      </div>
      {isDrawMode && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-md">
          <div className="bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.15)] px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse"></div>
              <p className="text-sm text-gray-800 font-medium">
                Click and drag to select area
              </p>
            </div>
            <button
              onClick={onToggleDrawMode}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
