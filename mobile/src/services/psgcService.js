// mobile/src/services/psgcService.js
// Lightweight PSGC API wrapper with simple in-memory caching.
// Endpoints used are public from https://psgc.gitlab.io/api/

const BASE = "https://psgc.gitlab.io/api";

const cache = {
  provinces: null,
  cities: null,
  municipalities: null,
  barangays: null,
};

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`PSGC fetch failed: ${res.status}`);
  return res.json();
}

export async function getProvinces() {
  if (!cache.provinces) {
    cache.provinces = await fetchJson(`${BASE}/provinces/`);
  }
  // Normalize minimal shape
  return (cache.provinces || []).map(p => ({
    code: String(p.code || p.psgcCode || p.provinceCode || "").trim(),
    name: String(p.name || p.provinceName || p.description || "").trim(),
  })).filter(p => p.code && p.name);
}

export async function getCitiesByProvince(provinceCode) {
  if (!cache.cities) {
    cache.cities = await fetchJson(`${BASE}/cities/`);
  }
  const list = (cache.cities || []).filter(c => {
    const pc = String(c.provinceCode || c.province_code || "").trim();
    return pc === String(provinceCode).trim();
  }).map(c => ({
    type: "City",
    code: String(c.code || c.cityCode || c.psgcCode || "").trim(),
    name: String(c.name || c.cityName || c.description || "").trim(),
    provinceCode: String(c.provinceCode || c.province_code || "").trim(),
  }));
  return list;
}

export async function getMunicipalitiesByProvince(provinceCode) {
  if (!cache.municipalities) {
    cache.municipalities = await fetchJson(`${BASE}/municipalities/`);
  }
  const list = (cache.municipalities || []).filter(m => {
    const pc = String(m.provinceCode || m.province_code || "").trim();
    return pc === String(provinceCode).trim();
  }).map(m => ({
    type: "Municipality",
    code: String(m.code || m.municipalityCode || m.psgcCode || "").trim(),
    name: String(m.name || m.municipalityName || m.description || "").trim(),
    provinceCode: String(m.provinceCode || m.province_code || "").trim(),
  }));
  return list;
}

export async function getCitiesAndMunicipalities(provinceCode) {
  const [cities, municipalities] = await Promise.all([
    getCitiesByProvince(provinceCode),
    getMunicipalitiesByProvince(provinceCode),
  ]);
  const combined = [...cities, ...municipalities];
  // Sort by name
  combined.sort((a, b) => a.name.localeCompare(b.name));
  return combined;
}

export async function getBarangaysByParent(parentCode) {
  if (!cache.barangays) {
    cache.barangays = await fetchJson(`${BASE}/barangays/`);
  }
  const list = (cache.barangays || []).filter(b => {
    const cityCode = String(b.cityCode || b.city_code || "").trim();
    const munCode = String(b.municipalityCode || b.municipality_code || "").trim();
    const parent = String(parentCode).trim();
    return cityCode === parent || munCode === parent;
  }).map(b => ({
    code: String(b.code || b.barangayCode || b.psgcCode || "").trim(),
    name: String(b.name || b.barangayName || b.description || "").trim(),
    cityCode: String(b.cityCode || b.city_code || "").trim(),
    municipalityCode: String(b.municipalityCode || b.municipality_code || "").trim(),
  }));
  list.sort((a, b) => a.name.localeCompare(b.name));
  return list;
}

export default {
  getProvinces,
  getCitiesAndMunicipalities,
  getBarangaysByParent,
};