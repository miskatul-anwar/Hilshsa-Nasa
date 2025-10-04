# Hilshsa-Nasa

Hilshsa-Nasa is a modern urban planning analysis tool that leverages interactive mapping, real-time geospatial data, and desktop-native performance to evaluate infrastructure, amenities, and population metrics for any region. It uses a hybrid tech stack combining React and Tauri (Rust) for a robust, performant, and visually rich desktop application.

---

## Tech Stack Overview

### Frontend
- **React**  
  The user interface is built with React, enabling modular, stateful components and fast rendering.  
  - Components such as `MapComponent.jsx`, `Navbar.jsx`, and `InfoContainer.jsx` encapsulate map interactions, navigation, and region analytics.

- **React-Leaflet**  
  For dynamic, interactive mapping, Hilshsa-Nasa utilizes [react-leaflet](https://react-leaflet.js.org/).  
  - Features: Drawing rectangles/circles, placing markers, handling zoom, and map events.
  - Underlying mapping via [Leaflet.js](https://leafletjs.com/), with custom marker icons sourced from CDN.

- **Leaflet-Geosearch**  
  Geocoding/search within the map uses [leaflet-geosearch](https://smeijer.github.io/leaflet-geosearch/), specifically the OpenStreetMapProvider for address lookup.

- **Lucide-React**  
  Iconography is handled by [lucide-react](https://lucide.dev/), providing crisp, modern SVG icons for UI actions and analytics.

- **Tailwind CSS**  
  UI styling is done with [Tailwind CSS](https://tailwindcss.com/), enabling utility-first CSS for rapid layout design and responsiveness.  
  - Custom styles and animations are used for map overlays, toasts, and grid layouts.

### Desktop/Backend
- **Tauri (Rust)**  
  The backend is powered by [Tauri](https://tauri.app/), providing a secure, lightweight desktop shell and direct access to system APIs.
  - Rust backend (`src-tauri/src/main.rs`) exposes commands to the frontend via Tauri's bridge, specifically for region analysis and geosearch.
  - All heavy computation and third-party API requests are handled natively in Rust for speed and reliability.

- **Overpass API**  
  The backend queries the [OpenStreetMap Overpass API](https://overpass-turbo.eu/) to gather authoritative data on amenities, infrastructure, and transit in the selected region.

- **@tauri-apps/api**  
  Frontend invokes Rust backend commands via Tauri's JS API, bridging React and Rust for seamless data flow.

---

## Core Features

- **Interactive Map Analysis**:  
  - Draw rectangles/circles to select regions.
  - Search for locations and zoom/pan interactively.
  - Display region boundaries and markers.

- **Rich Region Analytics**:  
  - Amenities: Hospitals, police stations, fire stations, schools, parks.
  - Population: Current, projected (5/10 years), annual growth (using UN methodology, 2,500 people/km² with 2.5% annual growth).
  - Infrastructure: Road length, density, transit stops.
  - All metrics are computed from live OSM data via Overpass queries.

- **Modern UI**:  
  - Responsive navigation bar with search, zoom, draw, and selection mode toggles.
  - Animated toasts and info containers for feedback and analytics.
  - SVG icons for clarity and consistency.

---

## Libraries & Frameworks Deep Dive

| Library/Framework      | Purpose                                                       | Integration Highlights                                     |
|------------------------|---------------------------------------------------------------|------------------------------------------------------------|
| React                  | UI components, state management                               | Main UI, hooks, context                                    |
| react-leaflet          | Interactive maps                                              | MapContainer, TileLayer, Marker, Rectangle, Circle         |
| leaflet-geosearch      | Geocoding/search                                              | OpenStreetMapProvider for address lookup                   |
| lucide-react           | SVG icons                                                     | All icons for Navbar, InfoContainer                        |
| Tailwind CSS           | Styling, responsiveness                                      | index.css, utility classes, custom animations              |
| Tauri (Rust)           | Desktop shell, backend, API bridge                           | Region analysis, invoking Rust from React                  |
| Overpass API           | Real-time geospatial data                                    | Amenities, infrastructure, population analytics            |
| @tauri-apps/api        | JS-Rust bridge                                               | Invoking commands from frontend                            |

---

## Project Structure

- **src/**  
  - `components/`: UI components (Map, Navbar, Info, Toasts)
  - `main.jsx`, `App.jsx`: App entry and layout
  - `styles/`: Tailwind and map CSS

- **src-tauri/**  
  - `src/main.rs`: Rust backend, Overpass API logic, analytics computation

- **public/**  
  - `index.html`: App shell, root div

---

## How It Works

1. **User Interacts with Map**  
   - Draw/select region, search for a place, zoom in/out.

2. **Region Bounds Sent to Backend**  
   - React side sends selected bounds to Rust backend via Tauri.

3. **Backend Fetches OSM Data**  
   - Rust queries Overpass API for amenities, roads, transit stops, population estimation.

4. **Frontend Displays Analytics**  
   - InfoContainer renders rich analytics, icons, and projections.

---

## Getting Started

1. **Install Node.js & Rust**
2. **Install dependencies**:  
   `npm install` (for React/Tailwind/JS stack)
3. **Run Tauri app**:  
   `npm run tauri dev`

---

## Contributing

- Linting: ESLint with React Hooks and Vite configs.
- All components follow strict modularity and separation of concerns.

---

## License

MIT

---

## Acknowledgements

- OpenStreetMap & Overpass API for open geospatial data
- Tauri for modern desktop app scaffolding
- Lucide-react and Tailwind for UI polish
