"use client"
/** 
 * >>> ADJUSTABLE GLOBE PARAMETERS ARE BELOW IN GLOBE_CONFIG <<<
 */

import { useRef, useMemo, useState, useEffect, useCallback } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { Sphere, Html } from "@react-three/drei"
import * as THREE from "three"
import { feature } from "topojson-client"
import type { Topology, GeometryCollection } from "topojson-specification"
import { MotionValue } from "framer-motion"

// -----------------------------------------------------------------------------
// CONFIGURATION PARAMETERS
// Adjust these values to customize the globe''s appearance and behavior.
// -----------------------------------------------------------------------------
export const GLOBE_CONFIG = {
  // 1. Geometry & Size
  globeRadius: 1.5,
  nodeCount: 12000,
  edgeConnectionDegrees: 5, // Connections within this many degrees

  // 2. Toggles
  showCountryNames: false,   // Set to true to see static country labels
  showActivityLabels: false, // Set to true to see floating dev-activity messages

  // 3. Animation & Speed
  rotationSpeed: 0.028,  // Negative makes it spin left-to-right
  mouseParallaxStrength: 1.06,
  initialRotationY: 5.95, // Exactly calculated to face India (Lng 79E) front and center
  globeTiltX: 0.0,        // Permanent forward tilt (approx 11 degrees)
  globeTiltZ: 0.3,        // Permanent sideways tilt (approx 17 degrees)

  // 4. Glow & Flash Effect
  nodeBaseSize: 1.2,
  flashSizeMultiplier: 1.6,   // How much larger nodes get when flashing
  flashColorBrightness: 8.55, // How white the core gets when flashing
  flashDecayRate: 0.55,       // How fast the flash fades away
  flashFrequency: [0.3, 0.9], // Range of seconds between random flashes [min, max]

  // 5. Dark Mode Colors
  colorsDark: {
    core: "#010810",
    atmosphere: "#0ea5e9",
    atmosphereOpacity: 0.010,
    landLines: "#4ade80",
    oceanLines: "#2563eb",
    landNode: [0.09, 0.64, 0.29], // RGB format [0-1]
    oceanNode: [0.15, 0.39, 0.92]
  },

  // 6. Light Mode Colors
  colorsLight: {
    core: "#f0f4f8",
    atmosphere: "#93c5fd",
    atmosphereOpacity: 0.04,
    landLines: "#16a34a",
    oceanLines: "#2563eb",
    landNode: [0.09, 0.64, 0.29],
    oceanNode: [0.15, 0.39, 0.92]
  }
}

const WORLD_ATLAS_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json"
const EDGE_COS_THRESHOLD = Math.cos(GLOBE_CONFIG.edgeConnectionDegrees * Math.PI / 180)

const CITIES: [number, number, string][] = [
  [35.6762, 139.6503, "Tokyo"], [51.5074, -0.1278, "London"], [52.52, 13.405, "Berlin"],
  [-23.5505, -46.6333, "São Paulo"], [19.076, 72.8777, "Mumbai"], [-33.8688, 151.2093, "Sydney"],
  [37.7749, -122.4194, "San Francisco"], [43.6532, -79.3832, "Toronto"], [37.5665, 126.978, "Seoul"],
  [48.8566, 2.3522, "Paris"], [6.5244, 3.3792, "Lagos"], [1.3521, 103.8198, "Singapore"],
  [40.7128, -74.006, "New York"], [59.3293, 18.0686, "Stockholm"], [25.2048, 55.2708, "Dubai"],
]

const COUNTRY_LABELS: [number, number, string][] = [
  [61, 90, "RUSSIA"], [51, 10, "GERMANY"], [46, 2, "FRANCE"],
  [40, -4, "SPAIN"], [42, 12, "ITALY"], [52, 20, "POLAND"],
  [49, 32, "UKRAINE"], [39, 35, "TURKEY"], [32, 53, "IRAN"],
  [40, -100, "UNITED STATES"], [-10, -55, "BRAZIL"], [35, 105, "CHINA"],
  [22, 79, "INDIA"], [-25, 135, "AUSTRALIA"], [60, -107, "CANADA"],
]

const COMMIT_MSGS = ["Pushed to main ??", "PR merged ?", "Deployed v2.1 ??", "Fixed auth bug ??", "Refactored 800 LOC ??"]
const ERROR_MSGS = ["Build failed ?", "Memory leak ??", "Rate limited ??", "Token expired ??", "500 errors ??"]
const GOLDEN_MSG = "Golden commit! ?"

function latLngToVec3(lat: number, lng: number, r: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -(r * Math.sin(phi) * Math.cos(theta)),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  )
}

function fibonacciSphere(n: number): THREE.Vector3[] {
  const pts: THREE.Vector3[] = []
  const phi = (1 + Math.sqrt(5)) / 2
  for (let i = 0; i < n; i++) {
    const theta = Math.acos(1 - 2 * (i + 0.5) / n)
    const a = 2 * Math.PI * i / phi
    pts.push(new THREE.Vector3(
      Math.sin(theta) * Math.cos(a),
      Math.cos(theta),
      Math.sin(theta) * Math.sin(a)
    ))
  }
  return pts
}

function vecToLatLng(v: THREE.Vector3): [number, number] {
  const lat = 90 - Math.acos(THREE.MathUtils.clamp(v.y, -1, 1)) * (180 / Math.PI)
  const lng = Math.atan2(v.z, -v.x) * (180 / Math.PI) - 180
  return [lat, lng]
}

function pointInRing(lat: number, lng: number, ring: number[][]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1]
    const xj = ring[j][0], yj = ring[j][1]
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi)
      inside = !inside
  }
  return inside
}

function buildBBoxes(features: GeoJSON.Feature[]) {
  return features.map(f => {
    const g = f.geometry
    const polys: number[][][][] =
      g.type === "Polygon"
        ? [g.coordinates as number[][][]]
        : g.type === "MultiPolygon"
          ? (g.coordinates as number[][][][])
          : []
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180
    for (const poly of polys)
      for (const ring of poly)
        for (const [lng, lat] of ring) {
          if (lat < minLat) minLat = lat
          if (lat > maxLat) maxLat = lat
          if (lng < minLng) minLng = lng
          if (lng > maxLng) maxLng = lng
        }
    return { minLat, maxLat, minLng, maxLng, feature: f }
  })
}

type BBox = ReturnType<typeof buildBBoxes>[number]

function isOnLand(lat: number, lng: number, bboxes: BBox[]): boolean {
  for (const bb of bboxes) {
    if (lat < bb.minLat || lat > bb.maxLat || lng < bb.minLng || lng > bb.maxLng) continue
    const g = bb.feature.geometry
    const polys: number[][][][] =
      g.type === "Polygon"
        ? [g.coordinates as number[][][]]
        : g.type === "MultiPolygon"
          ? (g.coordinates as number[][][][])
          : []
    for (const poly of polys) {
      if (pointInRing(lat, lng, poly[0] as number[][])) {
        let inHole = false
        for (let h = 1; h < poly.length; h++)
          if (pointInRing(lat, lng, poly[h] as number[][])) { inHole = true; break }
        if (!inHole) return true
      }
    }
  }
  return false
}

interface ActivityEvent {
  id: number; position: THREE.Vector3; message: string;
  city: string; type: "commit" | "error" | "golden"; time: number;
}

function ActivityLabel({ event, elapsed }: { event: ActivityEvent; elapsed: number }) {
  const age = elapsed - event.time
  if (age > 3.5) return null
  const opacity = age < 0.3 ? age / 0.3 : age > 2.8 ? 1 - (age - 2.8) / 0.7 : 1
  const colors = { commit: "#4ade80", error: "#f43f5e", golden: "#eab308" }
  const bg = { commit: "rgba(34,197,94,0.12)", error: "rgba(244,63,94,0.12)", golden: "rgba(234,179,8,0.15)" }

  return (
    <Html position={event.position} center style={{ pointerEvents: "none" }} zIndexRange={[50, 0]}>
      <div style={{
        opacity, transform: `translateY(${-age * 12}px)`,
        background: bg[event.type], backdropFilter: "blur(6px)",
        border: `1px solid ${colors[event.type]}40`, borderRadius: 8,
        padding: "4px 10px", whiteSpace: "nowrap", fontSize: 11, fontWeight: 600,
        color: colors[event.type], fontFamily: "var(--font-sans)",
        textShadow: `0 0 8px ${colors[event.type]}50`,
      }}>
        <span style={{ fontSize: 9, opacity: 0.7, fontWeight: 500 }}>{event.city} · </span>
        {event.message}
      </div>
    </Html>
  )
}

function CountryLabel({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  const pos = useMemo(() => latLngToVec3(lat, lng, GLOBE_CONFIG.globeRadius + 0.02), [lat, lng])
  return (
    <Html position={pos} center style={{ pointerEvents: "none" }} zIndexRange={[40, 0]}>
      <div style={{
        color: "rgba(255,255,255,0.5)", fontSize: 9, fontWeight: 600,
        letterSpacing: "0.12em", fontFamily: "var(--font-sans)",
        textShadow: "0 0 6px rgba(0,0,0,0.8)", whiteSpace: "nowrap",
        userSelect: "none",
      }}>
        {name}
      </div>
    </Html>
  )
}

const nodeVert = /* glsl */ `
  attribute float size;
  attribute float flash;
  attribute float land;
  uniform float uFlashSizeAdder;
  varying float vFlash;
  varying float vLand;

  void main() {
    vFlash = flash;
    vLand  = land;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = (size + flash * uFlashSizeAdder) * (190.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`

const nodeFrag = /* glsl */ `
  uniform vec3 uLandColor;
  uniform vec3 uOceanColor;
  uniform float uFlashBrightness;
  varying float vFlash;
  varying float vLand;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;

    float core = 1.0 - smoothstep(0.0, 0.08, d);
    float glow = pow(1.0 - smoothstep(0.0, 0.35, d), 2.5);
    float alpha = max(core * 0.88, glow * 0.22) + vFlash * 0.45;

    vec3 c = mix(uOceanColor, uLandColor, vLand);
    c = mix(c, vec3(1.0), core * 0.25 + vFlash * uFlashBrightness);

    gl_FragColor = vec4(c, alpha);
  }
`

function resolveScrollTargets(s: number): { z: number; y: number; tilt: number } {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768
  const o = isMobile ? 0.6 : 0

  if (s < 0.25) {
    const t = s / 0.25
    return { z: lerp(4.4, 3.2, t), y: lerp(0 + o, -0.2 + o, t), tilt: lerp(0, 0.1, t) }
  } else if (s < 0.55) {
    const t = (s - 0.25) / 0.3
    return { z: lerp(3.2, 2.4, t), y: lerp(-0.2 + o, -0.5 + o, t), tilt: lerp(0.1, 0.45, t) }
  } else if (s < 0.8) {
    const t = (s - 0.55) / 0.25
    return { z: lerp(2.4, 1.85, t), y: lerp(-0.5 + o, -0.7 + o, t), tilt: lerp(0.45, 0.65, t) }
  } else {
    const t = (s - 0.8) / 0.2
    return { z: lerp(1.85, 1.5, t), y: lerp(-0.7 + o, -0.85 + o, t), tilt: lerp(0.65, 0.85, t) }
  }
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

interface MeshData {
  landLines: THREE.LineSegments
  oceanLines: THREE.LineSegments
  nodePositions: Float32Array
  nodeSizes: Float32Array
  nodeLand: Float32Array
}

export function NetworkEarth({
  scrollProgress,
  theme = "dark",
}: {
  scrollProgress?: MotionValue<number>
  theme?: string
}) {
  const outerGroupRef = useRef<THREE.Group>(null!)
  const tiltGroupRef = useRef<THREE.Group>(null!)
  const spinGroupRef = useRef<THREE.Group>(null!)
  const dotsRef = useRef<THREE.Points>(null!)
  const { camera, gl } = useThree()

  const uniforms = useMemo(() => ({
    uLandColor: { value: new THREE.Color() },
    uOceanColor: { value: new THREE.Color() },
    uFlashSizeAdder: { value: GLOBE_CONFIG.flashSizeMultiplier },
    uFlashBrightness: { value: GLOBE_CONFIG.flashColorBrightness },
  }), [])

  const [meshData, setMeshData] = useState<MeshData | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(WORLD_ATLAS_URL)
      .then(r => r.json())
      .then((topo: Topology<{ countries: GeometryCollection }>) => {
        if (cancelled) return
        const features = feature(topo, topo.objects.countries).features
        const bboxes = buildBBoxes(features)
        const unitPts = fibonacciSphere(GLOBE_CONFIG.nodeCount)
        const landFlags = unitPts.map(p => {
          const [lat, lng] = vecToLatLng(p)
          return isOnLand(lat, lng, bboxes) ? 1.0 : 0.0
        })
        const pts = unitPts.map(p => p.clone().multiplyScalar(GLOBE_CONFIG.globeRadius + 0.004))
        const landEdgePts: number[] = []
        const oceanEdgePts: number[] = []

        for (let i = 0; i < GLOBE_CONFIG.nodeCount; i++) {
          for (let j = i + 1; j < GLOBE_CONFIG.nodeCount; j++) {
            if (unitPts[i].dot(unitPts[j]) > EDGE_COS_THRESHOLD) {
              const a = pts[i], b = pts[j]
              const target = (landFlags[i] === 1 && landFlags[j] === 1) ? landEdgePts : oceanEdgePts
              target.push(a.x, a.y, a.z, b.x, b.y, b.z)
            }
          }
        }

        if (cancelled) return

        const mkLines = (buf: number[], color: string, opacity: number) => {
          const geo = new THREE.BufferGeometry()
          geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(buf), 3))
          const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity })
          return new THREE.LineSegments(geo, mat)
        }

        const activeCols = theme === "light" ? GLOBE_CONFIG.colorsLight : GLOBE_CONFIG.colorsDark
        const landLines = mkLines(landEdgePts, activeCols.landLines, theme === "light" ? 0.5 : 0.55)
        const oceanLines = mkLines(oceanEdgePts, activeCols.oceanLines, theme === "light" ? 0.3 : 0.35)

        const nodePositions = new Float32Array(GLOBE_CONFIG.nodeCount * 3)
        const nodeSizes = new Float32Array(GLOBE_CONFIG.nodeCount).fill(GLOBE_CONFIG.nodeBaseSize)
        const nodeLand = new Float32Array(landFlags)
        pts.forEach((p, i) => {
          nodePositions[i * 3] = p.x
          nodePositions[i * 3 + 1] = p.y
          nodePositions[i * 3 + 2] = p.z
        })

        setMeshData({ landLines, oceanLines, nodePositions, nodeSizes, nodeLand })
      })
    return () => { cancelled = true }
  }, [theme])

  const flashArr = useMemo(() => new Float32Array(GLOBE_CONFIG.nodeCount).fill(0), [])
  const nextFlash = useRef(0)
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const nextEventRef = useRef(0)
  const eventIdRef = useRef(0)
  const elapsedRef = useRef(0)
  const mouseRef = useRef({ x: 0, y: 0 })

  const handleMove = useCallback((e: PointerEvent) => {
    const rect = gl.domElement.getBoundingClientRect()
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2
    mouseRef.current.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2
  }, [gl])

  useEffect(() => {
    gl.domElement.addEventListener("pointermove", handleMove)
    return () => gl.domElement.removeEventListener("pointermove", handleMove)
  }, [gl, handleMove])

  // Initialize permanent tilt and starting position
  useEffect(() => {
    if (tiltGroupRef.current) {
      tiltGroupRef.current.rotation.x = GLOBE_CONFIG.globeTiltX
      tiltGroupRef.current.rotation.z = GLOBE_CONFIG.globeTiltZ
    }
    if (spinGroupRef.current) {
      spinGroupRef.current.rotation.y = GLOBE_CONFIG.initialRotationY
    }
  }, [])

  useFrame((state, delta) => {
    const outerGroup = outerGroupRef.current
    const spinGroup = spinGroupRef.current
    if (!outerGroup || !spinGroup) return
    const elapsed = state.clock.elapsedTime
    elapsedRef.current = elapsed

    const activeCols = theme === "light" ? GLOBE_CONFIG.colorsLight : GLOBE_CONFIG.colorsDark
    uniforms.uLandColor.value.setRGB(...activeCols.landNode as [number, number, number])
    uniforms.uOceanColor.value.setRGB(...activeCols.oceanNode as [number, number, number])
    uniforms.uFlashSizeAdder.value = GLOBE_CONFIG.flashSizeMultiplier
    uniforms.uFlashBrightness.value = GLOBE_CONFIG.flashColorBrightness

    // 1. Continuous Spin
    spinGroup.rotation.y += delta * GLOBE_CONFIG.rotationSpeed

    // 2. Mouse Parallax on Outer Group
    const mx = mouseRef.current.x, my = mouseRef.current.y
    outerGroup.rotation.y = THREE.MathUtils.lerp(outerGroup.rotation.y, mx * GLOBE_CONFIG.mouseParallaxStrength * 0.5, 0.025)

    // 3. Scroll Tilt & Mouse Pitch on Outer Group
    if (scrollProgress) {
      const s = Math.max(0, Math.min(1, scrollProgress.get()))
      const { z, y, tilt } = resolveScrollTargets(s)
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, z, 0.045)
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, y, 0.045)
      outerGroup.rotation.x = THREE.MathUtils.lerp(outerGroup.rotation.x, tilt + my * GLOBE_CONFIG.mouseParallaxStrength, 0.035)
    } else {
      outerGroup.rotation.x = THREE.MathUtils.lerp(outerGroup.rotation.x, my * GLOBE_CONFIG.mouseParallaxStrength, 0.025)
    }

    if (elapsed > nextFlash.current && meshData) {
      nextFlash.current = elapsed + GLOBE_CONFIG.flashFrequency[0] + Math.random() * (GLOBE_CONFIG.flashFrequency[1] - GLOBE_CONFIG.flashFrequency[0])
      const anchor = Math.floor(Math.random() * GLOBE_CONFIG.nodeCount)
      flashArr[anchor] = 1.0
      for (let k = 0; k < 3; k++) {
        const nb = (anchor + Math.floor(Math.random() * 25) - 12 + GLOBE_CONFIG.nodeCount) % GLOBE_CONFIG.nodeCount
        flashArr[nb] = Math.max(flashArr[nb], 0.5 + Math.random() * 0.3)
      }
    }

    if (GLOBE_CONFIG.showActivityLabels && elapsed > nextEventRef.current) {
      nextEventRef.current = elapsed + 1.5 + Math.random() * 2.5
      const cityIdx = Math.floor(Math.random() * CITIES.length)
      const city = CITIES[cityIdx]
      const roll = Math.random()
      let type: "commit" | "error" | "golden" = "commit"
      let msg = COMMIT_MSGS[Math.floor(Math.random() * COMMIT_MSGS.length)]
      if (roll < 0.01) { type = "golden"; msg = GOLDEN_MSG }
      else if (roll < 0.2) { type = "error"; msg = ERROR_MSGS[Math.floor(Math.random() * ERROR_MSGS.length)] }
      const labelPos = latLngToVec3(city[0] as number, city[1] as number, GLOBE_CONFIG.globeRadius + 0.1)
      setEvents(prev => [...prev.slice(-5), { id: eventIdRef.current++, position: labelPos, message: msg, city: city[2] as string, type, time: elapsed }])
    }

    const pts = dotsRef.current
    if (pts) {
      const flashAttr = pts.geometry.getAttribute("flash") as THREE.BufferAttribute | undefined
      const sizeAttr = pts.geometry.getAttribute("size") as THREE.BufferAttribute | undefined
      if (flashAttr && sizeAttr) {
        for (let i = 0; i < GLOBE_CONFIG.nodeCount; i++) {
          if (flashArr[i] > 0) {
            flashArr[i] = Math.max(0, flashArr[i] - delta * GLOBE_CONFIG.flashDecayRate)
            flashAttr.setX(i, flashArr[i])
            sizeAttr.setX(i, GLOBE_CONFIG.nodeBaseSize)
          } else {
            sizeAttr.setX(i, GLOBE_CONFIG.nodeBaseSize)
          }
        }
        flashAttr.needsUpdate = true
        sizeAttr.needsUpdate = true
      }
    }
  })

  const coreColor = theme === "light" ? GLOBE_CONFIG.colorsLight.core : GLOBE_CONFIG.colorsDark.core

  return (
    <group ref={outerGroupRef}>
      <group ref={tiltGroupRef}>
        <group ref={spinGroupRef}>
          <Sphere args={[GLOBE_CONFIG.globeRadius - 0.018, 64, 64]}>
            <meshBasicMaterial color={coreColor} />
          </Sphere>
          {meshData && <primitive object={meshData.oceanLines} />}
          {meshData && <primitive object={meshData.landLines} />}
          {meshData && (
            <points ref={dotsRef}>
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[meshData.nodePositions, 3]} />
                <bufferAttribute attach="attributes-size" args={[meshData.nodeSizes, 1]} />
                <bufferAttribute attach="attributes-flash" args={[flashArr, 1]} />
                <bufferAttribute attach="attributes-land" args={[meshData.nodeLand, 1]} />
              </bufferGeometry>
              <shaderMaterial vertexShader={nodeVert} fragmentShader={nodeFrag} uniforms={uniforms} transparent depthWrite={false} />
            </points>
          )}
          <Sphere args={[GLOBE_CONFIG.globeRadius + 0.045, 64, 64]}>
            <meshBasicMaterial color={theme === "light" ? GLOBE_CONFIG.colorsLight.atmosphere : GLOBE_CONFIG.colorsDark.atmosphere} transparent opacity={theme === "light" ? GLOBE_CONFIG.colorsLight.atmosphereOpacity : GLOBE_CONFIG.colorsDark.atmosphereOpacity} side={THREE.BackSide} />
          </Sphere>
          {GLOBE_CONFIG.showCountryNames && COUNTRY_LABELS.map(([lat, lng, name]) => (
            <CountryLabel key={name as string} lat={lat as number} lng={lng as number} name={name as string} />
          ))}
          {GLOBE_CONFIG.showActivityLabels && events.filter(e => elapsedRef.current - e.time < 3.5).map(e => (
            <ActivityLabel key={e.id} event={e} elapsed={elapsedRef.current} />
          ))}
        </group>
      </group>
    </group>
  )
}

export function SpaceParticles({ theme = "dark" }: { theme?: string }) {
  const pointsRef = useRef<THREE.Points>(null!)

  const starTexture = useMemo(() => {
    if (typeof document === "undefined") return null
    const canvas = document.createElement("canvas")
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext("2d")!
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)")
    gradient.addColorStop(0.2, "rgba(255, 255, 255, 0.8)")
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 64, 64)
    return new THREE.CanvasTexture(canvas)
  }, [])

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const ct = 2500
    const pos = new Float32Array(ct * 3)
    for (let i = 0; i < ct * 3; i++) pos[i] = (Math.random() - 0.5) * 45
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3))
    return g
  }, [])

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y -= delta * 0.015
      pointsRef.current.rotation.x -= delta * 0.005
    }
  })

  if (theme === "light") return null
  return (
    <points ref={pointsRef} geometry={geo}>
      <pointsMaterial
        color="#ffffff"
        size={0.08}
        transparent
        opacity={0.8}
        map={starTexture as THREE.Texture}
        alphaTest={0.01}
        sizeAttenuation
      />
    </points>
  )
}
