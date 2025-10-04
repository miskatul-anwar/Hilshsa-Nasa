//! Tauri backend for Urban Planning Analysis
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Amenities {
    hospitals: u32,
    police: u32,
    fire_stations: u32,
    schools: u32,
    parks: u32,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct PopulationData {
    current: i64,
    growth_rate: f64,
    projected5_year: i64,
    projected10_year: i64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct TransportMetrics {
    road_km_total: f64,
    road_density_km_per_km2: f64,
    transit_stops: u32,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AnalyzeRegionResponse {
    area: f64, // km^2 (2 decimals)
    amenities: Amenities,
    population_data: PopulationData,
    infra_score: u32, // 0..100
    transport: TransportMetrics,
}

// Overpass response pieces
#[derive(Deserialize)]
struct OverpassResponse {
    elements: Option<Vec<OverpassElement>>,
}

#[derive(Deserialize)]
struct GeometryNode {
    lat: f64,
    lon: f64,
}

#[derive(Deserialize)]
struct OverpassElement {
    #[allow(dead_code)]
    #[serde(rename = "type")]
    el_type: Option<String>,
    tags: Option<HashMap<String, String>>,
    geometry: Option<Vec<GeometryNode>>,
}

fn haversine_km(lat1: f64, lon1: f64, lat2: f64, lon2: f64) -> f64 {
    let r = 6371.0_f64;
    let to_rad = std::f64::consts::PI / 180.0;
    let dlat = (lat2 - lat1) * to_rad;
    let dlon = (lon2 - lon1) * to_rad;
    let a = (dlat / 2.0).sin().powi(2)
        + (lat1 * to_rad).cos() * (lat2 * to_rad).cos() * (dlon / 2.0).sin().powi(2);
    let c = 2.0 * a.sqrt().asin();
    r * c
}

#[tauri::command]
async fn analyze_region(bounds: Vec<Vec<f64>>) -> Result<AnalyzeRegionResponse, String> {
    // bounds: [[lat1, lng1], [lat2, lng2]]
    if bounds.len() != 2 || bounds[0].len() != 2 || bounds[1].len() != 2 {
        return Err("Invalid bounds".into());
    }

    let lat1 = bounds[0][0];
    let lng1 = bounds[0][1];
    let lat2 = bounds[1][0];
    let lng2 = bounds[1][1];

    // Compute bbox and more accurate area:
    // lat distance ~ 111.32 km/deg, lon distance ~ 111.32 * cos(mean_lat) km/deg
    let min_lat = lat1.min(lat2);
    let max_lat = lat1.max(lat2);
    let min_lng = lng1.min(lng2);
    let max_lng = lng1.max(lng2);
    let mean_lat_rad = ((lat1 + lat2) / 2.0).to_radians();

    let km_per_deg_lat = 111.32_f64;
    let km_per_deg_lng = 111.32_f64 * mean_lat_rad.cos();

    let lat_diff = (lat1 - lat2).abs();
    let lng_diff = (lng1 - lng2).abs();

    let mut area = (lat_diff * km_per_deg_lat) * (lng_diff * km_per_deg_lng);
    // round to 2 decimals
    area = (area * 100.0).round() / 100.0;

    let bbox = format!("{},{},{},{}", min_lat, min_lng, max_lat, max_lng);

    // Overpass API query with additional data and geometry for highways
    let query = format!(
        r#"
[out:json][timeout:30];
(
  // Healthcare
  node["amenity"~"hospital|clinic|doctors|pharmacy"]({bbox});
  way["amenity"~"hospital|clinic|doctors|pharmacy"]({bbox});
  relation["amenity"~"hospital|clinic|doctors|pharmacy"]({bbox});

  // Police
  node["amenity"="police"]({bbox});
  way["amenity"="police"]({bbox});
  relation["amenity"="police"]({bbox});

  // Fire
  node["amenity"="fire_station"]({bbox});
  way["amenity"="fire_station"]({bbox});
  relation["amenity"="fire_station"]({bbox});

  // Schools
  node["amenity"="school"]({bbox});
  way["amenity"="school"]({bbox});
  relation["amenity"="school"]({bbox});

  // Parks
  node["leisure"="park"]({bbox});
  way["leisure"="park"]({bbox});
  relation["leisure"="park"]({bbox});

  // Highways (for length)
  way["highway"]({bbox});

  // Transit stops (bus + rail + public_transport)
  node["highway"="bus_stop"]({bbox});
  way["highway"="bus_stop"]({bbox});
  node["railway"~"station|halt|stop"]({bbox});
  way["railway"~"station|halt|stop"]({bbox});
  node["public_transport"~"stop_position|platform"]({bbox});
  way["public_transport"~"stop_position|platform"]({bbox});
);
out body geom;
"#,
        bbox = bbox
    );

    let client = reqwest::Client::new();
    let resp = client
        .post("https://overpass-api.de/api/interpreter")
        .header(
            reqwest::header::USER_AGENT,
            "UrbanPlanningTauri/0.1.0 (https://example.com)",
        )
        .body(query)
        .send()
        .await
        .map_err(|e| format!("Overpass request error: {e}"))?;

    if !resp.status().is_success() {
        return Err(format!(
            "Overpass non-OK status: {}",
            resp.status().as_u16()
        ));
    }

    let data: OverpassResponse = resp
        .json()
        .await
        .map_err(|e| format!("Overpass JSON parse error: {e}"))?;

    let mut counts = Amenities {
        hospitals: 0,
        police: 0,
        fire_stations: 0,
        schools: 0,
        parks: 0,
    };

    let mut transit_stops: u32 = 0;
    let mut road_km_total: f64 = 0.0;

    if let Some(elements) = data.elements {
        for el in elements {
            if let Some(tags) = el.tags {
                // Amenities
                if let Some(amenity) = tags.get("amenity") {
                    if amenity == "hospital"
                        || amenity == "clinic"
                        || amenity == "doctors"
                        || amenity == "pharmacy"
                    {
                        counts.hospitals += 1;
                    }
                    if amenity == "police" {
                        counts.police += 1;
                    }
                    if amenity == "fire_station" {
                        counts.fire_stations += 1;
                    }
                    if amenity == "school" {
                        counts.schools += 1;
                    }
                }
                if let Some(leisure) = tags.get("leisure") {
                    if leisure == "park" {
                        counts.parks += 1;
                    }
                }

                // Roads
                if tags.get("highway").is_some() {
                    if let Some(geom) = &el.geometry {
                        if geom.len() >= 2 {
                            let mut len_km = 0.0;
                            for w in geom.windows(2) {
                                let a = &w[0];
                                let b = &w[1];
                                len_km += haversine_km(a.lat, a.lon, b.lat, b.lon);
                            }
                            road_km_total += len_km;
                        }
                    }
                }

                // Transit stops
                let is_bus_stop = tags
                    .get("highway")
                    .map(|v| v == "bus_stop")
                    .unwrap_or(false);
                let is_rail_stop = tags
                    .get("railway")
                    .map(|v| v == "station" || v == "halt" || v == "stop")
                    .unwrap_or(false);
                let is_pt_stop = tags
                    .get("public_transport")
                    .map(|v| v == "stop_position" || v == "platform")
                    .unwrap_or(false);
                if is_bus_stop || is_rail_stop || is_pt_stop {
                    transit_stops += 1;
                }
            }
        }
    }

    // Population model: 2,500 people/km², 2.5% annual growth
    let estimated_population = (area * 2500.0).round() as i64;
    let growth_rate = 2.5_f64;
    let projected5 =
        (estimated_population as f64 * (1.0 + growth_rate / 100.0).powi(5)).round() as i64;
    let projected10 =
        (estimated_population as f64 * (1.0 + growth_rate / 100.0).powi(10)).round() as i64;

    let population = PopulationData {
        current: estimated_population,
        growth_rate,
        projected5_year: projected5,
        projected10_year: projected10,
    };

    // Infra score, mirror frontend logic:
    // idealHospitals=2, idealPolice=1, idealFire=1, idealSchools=5, normalized=area/10
    // score = average capped facility ratios, 0..100, rounded to 0 decimals
    let normalized = if area > 0.0 { area / 10.0 } else { 0.0 };

    let cap100 = |v: f64| v.min(100.0);
    let mut hospital_score = 0.0;
    let mut police_score = 0.0;
    let mut fire_score = 0.0;
    let mut school_score = 0.0;

    if normalized > 0.0 {
        hospital_score = cap100((counts.hospitals as f64 / (2.0 * normalized)) * 100.0);
        police_score = cap100((counts.police as f64 / (1.0 * normalized)) * 100.0);
        fire_score = cap100((counts.fire_stations as f64 / (1.0 * normalized)) * 100.0);
        school_score = cap100((counts.schools as f64 / (5.0 * normalized)) * 100.0);
    }

    let avg_score = (hospital_score + police_score + fire_score + school_score) / 4.0;
    let infra_score = avg_score.round().clamp(0.0, 100.0) as u32;

    // Transport summary
    let road_density = if area > 0.0 {
        (road_km_total / area * 100.0).round() / 100.0
    } else {
        0.0
    };
    let road_km_total_rounded = (road_km_total * 10.0).round() / 10.0;

    Ok(AnalyzeRegionResponse {
        area,
        amenities: counts,
        population_data: population,
        infra_score,
        transport: TransportMetrics {
            road_km_total: road_km_total_rounded,
            road_density_km_per_km2: road_density,
            transit_stops,
        },
    })
}

#[derive(Serialize)]
struct GeoSearchResult {
    x: f64,        // lon
    y: f64,        // lat
    label: String, // display_name
}

#[derive(Deserialize)]
struct NominatimItem {
    lat: String,
    lon: String,
    display_name: String,
}

#[tauri::command]
async fn osm_geosearch(query: String) -> Result<Vec<GeoSearchResult>, String> {
    if query.trim().is_empty() {
        return Ok(vec![]);
    }

    let url = format!(
        "https://nominatim.openstreetmap.org/search?format=json&q={q}&limit=5&addressdetails=0",
        q = urlencoding::encode(&query)
    );

    let client = reqwest::Client::new();
    let resp = client
        .get(&url)
        .header(
            reqwest::header::USER_AGENT,
            "UrbanPlanningTauri/0.1.0 (https://example.com)",
        )
        .send()
        .await
        .map_err(|e| format!("Nominatim request error: {e}"))?;

    if !resp.status().is_success() {
        return Err(format!(
            "Nominatim non-OK status: {}",
            resp.status().as_u16()
        ));
    }

    let items: Vec<NominatimItem> = resp
        .json()
        .await
        .map_err(|e| format!("Nominatim JSON parse error: {e}"))?;

    let mut results = Vec::with_capacity(items.len());
    for it in items {
        let lat: f64 = it.lat.parse().unwrap_or(0.0);
        let lon: f64 = it.lon.parse().unwrap_or(0.0);
        results.push(GeoSearchResult {
            x: lon,
            y: lat,
            label: it.display_name,
        });
    }

    Ok(results)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![analyze_region, osm_geosearch])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
