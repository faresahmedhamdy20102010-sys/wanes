
export interface GPSCoordinates {
  latitude: number
  longitude: number
  accuracy?: number
}

export interface StructuredAddress {
  coords: GPSCoordinates
  formattedAddress: string
  street: string
  building: string
  district: string
  governorate: string
}

export const KNOWN_EGYPTIAN_GOVERNORATES = [
  "Cairo",
  "Alexandria",
  "Giza",
  "Al Qalyubia",
  "Port Said",
  "Suez",
  "Damietta",
  "Dakahlia",
  "Ash Sharqia",
  "Kafr El Sheikh",
  "Al Gharbia",
  "Al Monufia",
  "Al Beheira",
  "Ismailia",
  "Beni Suef",
  "Faiyum",
  "Minya",
  "Asyut",
  "Sohag",
  "Qena",
  "Aswan",
  "Luxor",
  "Red Sea",
  "New Valley",
  "Matrouh",
  "North Sinai",
  "South Sinai",
] as const

export type EgyptianGovernorate = (typeof KNOWN_EGYPTIAN_GOVERNORATES)[number]

export function matchEgyptianGovernorate(
  text?: string | null,
  lat?: number,
  lng?: number
): string {
  if (text) {
    const clean = text.toLowerCase().replace(/governorate|gov\.|محافظة/gi, "").trim()

    for (const gov of KNOWN_EGYPTIAN_GOVERNORATES) {
      const govClean = gov.toLowerCase()
      if (clean === govClean || clean.includes(govClean) || govClean.includes(clean)) {
        return gov
      }
    }

    if (clean.includes("qahir") || clean.includes("cairo")) return "Cairo"
    if (clean.includes("giza") || clean.includes("gizeh") || clean.includes("october") || clean.includes("zayed") || clean.includes("haram")) return "Giza"
    if (clean.includes("alex") || clean.includes("iskand")) return "Alexandria"
    if (clean.includes("qalyub") || clean.includes("banha") || clean.includes("shubra")) return "Al Qalyubia"
    if (clean.includes("sharq") || clean.includes("zagazig")) return "Ash Sharqia"
    if (clean.includes("dakahl") || clean.includes("mansoura")) return "Dakahlia"
    if (clean.includes("gharbi") || clean.includes("tanta")) return "Al Gharbia"
    if (clean.includes("monuf") || clean.includes("shebin")) return "Al Monufia"
    if (clean.includes("beheir") || clean.includes("damanhour")) return "Al Beheira"
    if (clean.includes("ismail")) return "Ismailia"
    if (clean.includes("port said")) return "Port Said"
    if (clean.includes("suez")) return "Suez"
    if (clean.includes("aswan")) return "Aswan"
    if (clean.includes("luxor")) return "Luxor"
    if (clean.includes("hurghada") || clean.includes("red sea")) return "Red Sea"
    if (clean.includes("sharm") || clean.includes("sinai")) return "South Sinai"
    if (clean.includes("matrouh") || clean.includes("alamein")) return "Matrouh"
    if (clean.includes("fayoum") || clean.includes("faiyum")) return "Faiyum"
    if (clean.includes("asyut") || clean.includes("assiut")) return "Asyut"
    if (clean.includes("minya")) return "Minya"
    if (clean.includes("sohag")) return "Sohag"
    if (clean.includes("qena")) return "Qena"
  }

  if (typeof lat === "number" && typeof lng === "number") {
    if (lat >= 29.8 && lat <= 30.3 && lng >= 30.8 && lng <= 31.6) {
      return lng >= 31.21 ? "Cairo" : "Giza"
    }
    if (lat >= 31.0 && lat <= 31.4 && lng >= 29.7 && lng <= 30.2) {
      return "Alexandria"
    }
  }

  return "Cairo"
}

export function formatCoordinates(lat: number, lng: number): string {
  const latStr = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? "N" : "S"}`
  const lngStr = `${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? "E" : "W"}`
  return `Lat: ${latStr} · Lng: ${lngStr}`
}

export async function getLiveGPSCoordinates(): Promise<GPSCoordinates> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    throw new Error("Geolocation is not supported by your browser.")
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy || 10),
        })
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(
              new Error(
                "Location permission denied. Please allow location access in your browser settings."
              )
            )
            break
          case error.POSITION_UNAVAILABLE:
            reject(
              new Error(
                "Location information is unavailable. Please check your GPS signal or connection."
              )
            )
            break
          case error.TIMEOUT:
            reject(
              new Error(
                "Location request timed out. Please try clicking 'Detect Location' again."
              )
            )
            break
          default:
            reject(
              new Error(
                "Unable to retrieve your location. Please check browser location permissions."
              )
            )
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    )
  })
}

export async function reverseGeocodeCoordinates(lat: number, lng: number): Promise<string> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          "Accept-Language": "en",
        },
      }
    )
    clearTimeout(timeoutId)

    if (response.ok) {
      const data = await response.json()
      if (data?.address) {
        const addr = data.address
        const parts: string[] = []
        const road = addr.road || addr.pedestrian || addr.street || addr.residential || addr.path
        if (road) parts.push(road)
        const area = addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district
        if (area) parts.push(area)
        const city = addr.city || addr.town || addr.county || addr.state
        if (city) parts.push(city)
        if (addr.country) parts.push(addr.country)

        if (parts.length > 0) {
          return parts.join(", ")
        }
        if (data.display_name) {
          return data.display_name.split(",").slice(0, 3).join(",").trim()
        }
      }
    }
  } catch {
  }

  return `GPS Pin (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`
}

export async function detectStructuredLiveLocation(): Promise<StructuredAddress> {
  const coords = await getLiveGPSCoordinates()
  const lat = coords.latitude
  const lng = coords.longitude

  let street = ""
  let building = ""
  let district = ""
  let governorate = "Cairo"
  let formattedAddress = `GPS Pin (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4500)

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          "Accept-Language": "en",
        },
      }
    )
    clearTimeout(timeoutId)

    if (response.ok) {
      const data = await response.json()
      if (data?.address) {
        const addr = data.address

        const road =
          addr.road || addr.pedestrian || addr.street || addr.residential || addr.path || addr.footway || ""
        const houseNumber = addr.house_number || ""
        const bldgName = addr.building || addr.amenity || ""

        street = road ? (houseNumber ? `${houseNumber} ${road}` : road) : ""
        building = bldgName
          ? bldgName
          : houseNumber
          ? `Building ${houseNumber}`
          : "Residential Building (GPS Verified)"

        district =
          addr.suburb ||
          addr.neighbourhood ||
          addr.quarter ||
          addr.city_district ||
          addr.city ||
          addr.town ||
          ""

        const stateText = addr.state || addr.county || addr.city || ""
        governorate = matchEgyptianGovernorate(stateText, lat, lng)

        const parts: string[] = []
        if (street) parts.push(street)
        if (district && district !== street) parts.push(district)
        if (governorate && !parts.includes(governorate)) parts.push(governorate)
        if (addr.country) parts.push(addr.country)

        if (parts.length > 0) {
          formattedAddress = parts.join(", ")
        } else if (data.display_name) {
          formattedAddress = data.display_name.split(",").slice(0, 3).join(",").trim()
        }
      }
    }
  } catch {
  }

  if (!street) {
    street = `GPS Location (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`
  }
  if (!building) {
    building = "Residence (GPS Locked)"
  }
  if (!district) {
    district = governorate === "Cairo" ? "Downtown / Central Cairo" : `${governorate} Center`
  }

  return {
    coords,
    formattedAddress,
    street,
    building,
    district,
    governorate,
  }
}

export function buildGoogleMapsEmbedUrl(lat: number, lng: number, zoom = 16): string {
  return `https://maps.google.com/maps?q=${lat},${lng}&hl=en&z=${zoom}&output=embed`
}

export function buildGoogleMapsDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}

export function buildGoogleMapsSearchUrl(lat: number, lng: number, query?: string): string {
  if (query) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
  }
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
}
