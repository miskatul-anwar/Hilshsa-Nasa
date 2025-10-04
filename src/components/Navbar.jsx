import React, { useState } from 'react';
import { Search, ZoomIn, ZoomOut, Square, X, Circle, Hand } from 'lucide-react';

const Navbar = ({
  onSearch,
  onZoomIn,
  onZoomOut,
  onToggleDrawMode,
  isDrawMode,
  onClearSelection,
  currentZoom,
  minZoom,
  maxZoom,
  selectionMode, // 'rectangle', 'circle'
  onSelectionModeChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSelectionExpanded, setIsSelectionExpanded] = useState(false);
  const [hoveredButton, setHoveredButton] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim() && !isSearching) {
      setIsSearching(true);
      try {
        await onSearch(searchQuery);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }
  };

  const handleSelectionToggle = () => {
    if (isDrawMode) {
      // If already in draw mode, turn it off
      onToggleDrawMode();
      setIsSelectionExpanded(false);
    } else {
      // Toggle expansion
      setIsSelectionExpanded(!isSelectionExpanded);
    }
  };

  const handleSelectionModeSelect = (mode) => {
    onSelectionModeChange(mode);
    if (!isDrawMode) {
      onToggleDrawMode();
    }
    setIsSelectionExpanded(false);
  };

  const zoomInDisabled = currentZoom != null && maxZoom != null ? currentZoom >= maxZoom : false;
  const zoomOutDisabled = currentZoom != null && minZoom != null ? currentZoom <= minZoom : false;

  return (
    <>
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[95%] sm:w-[90%] max-w-2xl px-2 sm:px-0">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <input
              type="search"
              name="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Planned Cities"
              className="w-full h-12 pl-5 pr-20 bg-white text-gray-900 placeholder:text-gray-500 rounded-full focus:outline-none transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)] focus:shadow-[0_4px_12px_rgba(0,0,0,0.25)] text-[15px] indent-5 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
              style={{ fontSize: 'clamp(13px, 3vw, 15px)' }}
              disabled={isSearching}
            />
            {searchQuery && !isSearching && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute top-1/2 -translate-y-1/2 right-12 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Clear search"
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
                className="absolute top-1/2 -translate-y-1/2 right-4 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!searchQuery.trim()}
                aria-label="Search"
              >
                <Search className="h-5 w-5" strokeWidth={2} />
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="fixed top-1/2 -translate-y-1/2 right-2 sm:right-4 z-[9999] flex flex-col gap-2 items-center">
        {/* Zoom Controls */}
        <div className="relative">
          <div className="bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.15)] overflow-hidden">
            <button
              onClick={onZoomIn}
              disabled={zoomInDisabled}
              onMouseEnter={() => setHoveredButton('zoomIn')}
              onMouseLeave={() => setHoveredButton(null)}
              className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors border-b border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white relative"
              aria-label="Zoom in"
            >
              <ZoomIn size={20} strokeWidth={2} />
            </button>
            <button
              onClick={onZoomOut}
              disabled={zoomOutDisabled}
              onMouseEnter={() => setHoveredButton('zoomOut')}
              onMouseLeave={() => setHoveredButton(null)}
              className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white relative"
              aria-label="Zoom out"
            >
              <ZoomOut size={20} strokeWidth={2} />
            </button>
          </div>

          {/* Zoom Tooltips */}
          {hoveredButton === 'zoomIn' && !zoomInDisabled && (
            <div className="absolute right-[calc(100%+8px)] top-0 bg-gray-900 text-white text-xs px-3 py-1.5 rounded shadow-lg whitespace-nowrap pointer-events-none">
              Zoom In
            </div>
          )}
          {hoveredButton === 'zoomOut' && !zoomOutDisabled && (
            <div className="absolute right-[calc(100%+8px)] top-11 bg-gray-900 text-white text-xs px-3 py-1.5 rounded shadow-lg whitespace-nowrap pointer-events-none">
              Zoom Out
            </div>
          )}
        </div>

        {/* Selection Button with Expandable Menu */}
        <div className="relative flex items-center">
          <div
            className={`flex items-center bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.15)] overflow-hidden transition-all duration-300 ${isSelectionExpanded ? 'gap-0' : ''
              }`}
            style={{
              width: isSelectionExpanded ? 'auto' : '40px',
              height: '44px'
            }}
          >
            {/* Main Selection Toggle Button */}
            <button
              onClick={handleSelectionToggle}
              onMouseEnter={() => setHoveredButton('selectionToggle')}
              onMouseLeave={() => setHoveredButton(null)}
              className={`flex items-center justify-center transition-all duration-200 flex-shrink-0 relative ${isDrawMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              style={{
                width: '40px',
                height: '44px'
              }}
              aria-pressed={isDrawMode}
              aria-label="Toggle selection tools"
            >
              <Hand size={20} strokeWidth={2} />
            </button>

            {/* Expanded Options */}
            <div
              className={`flex items-center transition-all duration-300 overflow-hidden ${isSelectionExpanded ? 'opacity-100' : 'opacity-0 w-0'
                }`}
              style={{
                width: isSelectionExpanded ? 'auto' : '0'
              }}
            >
              <div className="h-6 w-px bg-gray-200 mx-1"></div>

              <button
                onClick={() => handleSelectionModeSelect('rectangle')}
                onMouseEnter={() => setHoveredButton('rectangle')}
                onMouseLeave={() => setHoveredButton(null)}
                className={`flex items-center justify-center transition-colors flex-shrink-0 relative ${selectionMode === 'rectangle' && isDrawMode
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                  }`}
                style={{
                  width: '40px',
                  height: '44px'
                }}
                aria-label="Rectangle selection"
              >
                <Square size={18} strokeWidth={2} />
              </button>

              <button
                onClick={() => handleSelectionModeSelect('circle')}
                onMouseEnter={() => setHoveredButton('circle')}
                onMouseLeave={() => setHoveredButton(null)}
                className={`flex items-center justify-center transition-colors flex-shrink-0 relative ${selectionMode === 'circle' && isDrawMode
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                  }`}
                style={{
                  width: '40px',
                  height: '44px'
                }}
                aria-label="Circle selection"
              >
                <Circle size={18} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Selection Tooltips */}
          {hoveredButton === 'selectionToggle' && !isSelectionExpanded && (
            <div className="absolute right-[calc(100%+8px)] top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded shadow-lg whitespace-nowrap pointer-events-none z-[10000]">
              Selection Tools
            </div>
          )}
          {hoveredButton === 'rectangle' && isSelectionExpanded && (
            <div className="absolute right-[calc(100%+8px)] top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded shadow-lg whitespace-nowrap pointer-events-none z-[10000]">
              Rectangle
            </div>
          )}
          {hoveredButton === 'circle' && isSelectionExpanded && (
            <div className="absolute right-[calc(100%+8px)] top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded shadow-lg whitespace-nowrap pointer-events-none z-[10000]">
              Circle
            </div>
          )}
        </div>

        {/* Clear Button */}
        <div className="relative">
          <button
            onClick={onClearSelection}
            onMouseEnter={() => setHoveredButton('clear')}
            onMouseLeave={() => setHoveredButton(null)}
            className="w-10 h-10 sm:w-11 sm:h-11 bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.15)] flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Clear selection"
          >
            <X size={20} strokeWidth={2} />
          </button>
          {hoveredButton === 'clear' && (
            <div className="absolute right-[calc(100%+8px)] top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded shadow-lg whitespace-nowrap pointer-events-none">
              Clear Selection
            </div>
          )}
        </div>
      </div>

      {isDrawMode && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] w-[90%] sm:w-full max-w-lg px-2 sm:px-4">
          <div
            className="bg-white rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.15)] flex items-center justify-between"
            style={{
              height: 'clamp(40px, 8vw, 48px)',
              paddingLeft: 'clamp(20px, 4vw, 32px)',
              paddingRight: 'clamp(20px, 4vw, 32px)',
              gap: 'clamp(16px, 3vw, 24px)'
            }}
          >
            <div className="flex items-center flex-1" style={{ gap: '16px' }}>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse flex-shrink-0"></div>
              <p className="text-[15px] text-gray-800 font-normal" style={{ fontSize: 'clamp(13px, 3vw, 15px)' }}>
                {selectionMode === 'rectangle' && 'Click and drag to draw a rectangle'}
                {selectionMode === 'circle' && 'Click and drag to draw a circle'}
              </p>
            </div>
            <button
              onClick={onToggleDrawMode}
              className="text-[15px] text-blue-600 hover:text-blue-700 font-medium transition-colors flex-shrink-0"
              style={{ fontSize: 'clamp(13px, 3vw, 15px)' }}
              aria-label="Cancel drawing mode"
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