// Cảnh 3D của bãi phế liệu. Mọi thứ dựng từ hình khối cơ bản, không tải mô hình hay texture ngoài.
import { Html, OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { LANE_WIDTH, LANE_Z, tons, type Pile } from '../lib/yard'

/** Màn hình dọc (điện thoại) nhìn hẹp hơn: lùi máy quay ra xa để thấy đủ bãi. */
function viewScale(): number {
  if (typeof window === 'undefined') return 1
  return window.innerWidth / window.innerHeight < 1 ? 1.7 : 1
}

/** Vòng sáng dưới chân đống đang chọn; nhịp nhẹ, đứng yên khi giảm hiệu ứng. */
function SelectionRing({ radius, reduced }: { radius: number; reduced: boolean }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current || reduced) return
    const k = 1 + Math.sin(clock.getElapsedTime() * 3) * 0.04
    ref.current.scale.set(k, k, 1)
  })
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
      <ringGeometry args={[radius + 0.35, radius + 0.6, 48]} />
      <meshBasicMaterial color="#e3b341" transparent opacity={0.9} toneMapped={false} />
    </mesh>
  )
}

export interface YardProps {
  piles: Pile[]
  selected: string | null
  onSelect: (code: string | null) => void
  reduced: boolean
}

// Số ngẫu nhiên có hạt giống cố định: cảnh giống hệt nhau mỗi lần tải
function rng(seed: number) {
  return () => {
    seed = (seed * 1_664_525 + 1_013_904_223) % 4_294_967_296
    return seed / 4_294_967_296
  }
}

function useHover(code: string, onSelect: YardProps['onSelect']) {
  const [hover, setHover] = useState(false)
  return {
    hover,
    handlers: {
      onPointerOver: (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer' },
      onPointerOut: () => { setHover(false); document.body.style.cursor = '' },
      onClick: (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect(code) },
    },
  }
}

function Label({ pile, active }: { pile: Pile; active: boolean }) {
  const [k] = useState(viewScale)
  return (
    <Html position={[0, pile.height + 0.9, 0]} center distanceFactor={k > 1 ? 26 * k * 0.8 : 26} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
      <div className={`whitespace-nowrap rounded-md border px-2 py-1 text-[11px] font-medium shadow-lg transition ${active ? 'border-gold bg-ink-900 text-gold' : 'border-white/10 bg-ink-900/80 text-ink-300'}`}>
        {pile.name} · {tons(pile.kg)} t
      </div>
    </Html>
  )
}

/** Đống phế liệu: hình nón thô (ít mặt, flat shading) + vài mảnh vụn rải quanh. */
function Heap({ pile, active, onSelect, reduced }: { pile: Pile; active: boolean; onSelect: YardProps['onSelect']; reduced: boolean }) {
  const { hover, handlers } = useHover(pile.code, onSelect)
  const debris = useMemo(() => {
    const r = rng(pile.code.length * 97 + Math.round(pile.kg))
    return Array.from({ length: reduced ? 0 : 26 }, () => {
      const a = r() * Math.PI * 2
      const d = pile.radius * (0.35 + r() * 0.75)
      const y = Math.max(0.1, pile.height * (1 - d / pile.radius) * 0.9)
      return { p: [Math.cos(a) * d, y, Math.sin(a) * d] as const, s: 0.18 + r() * 0.35, rot: [r() * 3, r() * 3, r() * 3] as const }
    })
  }, [pile, reduced])
  const color = new THREE.Color(pile.color)
  const glow = active ? 0.35 : hover ? 0.18 : 0
  return (
    <group position={[pile.x, 0, pile.z]} {...handlers}>
      <mesh castShadow={!reduced} receiveShadow position={[0, pile.height / 2, 0]} rotation={[0, pile.kg % 3, 0]}>
        <coneGeometry args={[pile.radius, pile.height, 9, 3]} />
        <meshStandardMaterial color={color} flatShading roughness={0.85} metalness={0.35} emissive={color} emissiveIntensity={glow} />
      </mesh>
      {debris.map((d, i) => (
        <mesh key={i} position={d.p as unknown as [number, number, number]} rotation={d.rot as unknown as [number, number, number]} castShadow={false}>
          <boxGeometry args={[d.s * 1.6, d.s * 0.4, d.s]} />
          <meshStandardMaterial color={color.clone().offsetHSL(0, 0, (i % 3) * 0.06 - 0.05)} roughness={0.7} metalness={0.5} />
        </mesh>
      ))}
      {active && <SelectionRing radius={pile.radius} reduced={reduced} />}
      <Label pile={pile} active={active || hover} />
    </group>
  )
}

/** Thùng chứa kim loại màu: khung thép, mức đầy thể hiện lượng tồn. */
function Bin({ pile, active, onSelect, reduced }: { pile: Pile; active: boolean; onSelect: YardProps['onSelect']; reduced: boolean }) {
  const { hover, handlers } = useHover(pile.code, onSelect)
  const fill = pile.fill
  const wall = '#6b7380'
  const w = 2.6, d = 2, h = pile.height
  const wallH = h * 0.62 // vách thấp hơn mức chứa để nhìn thấy hàng bên trong từ góc cao
  const color = new THREE.Color(pile.color)
  return (
    <group position={[pile.x, 0, pile.z]} {...handlers}>
      {/* đáy + 4 vách mỏng để nhìn thấy mức hàng bên trong */}
      <mesh receiveShadow position={[0, 0.05, 0]}><boxGeometry args={[w, 0.1, d]} /><meshStandardMaterial color="#3b4048" /></mesh>
      {[[0, wallH / 2, d / 2], [0, wallH / 2, -d / 2]].map((p, i) => (
        <mesh key={`z${i}`} castShadow={!reduced} position={p as [number, number, number]}><boxGeometry args={[w, wallH, 0.08]} /><meshStandardMaterial color={wall} metalness={0.55} roughness={0.45} /></mesh>
      ))}
      {[[w / 2, wallH / 2, 0], [-w / 2, wallH / 2, 0]].map((p, i) => (
        <mesh key={`x${i}`} castShadow={!reduced} position={p as [number, number, number]}><boxGeometry args={[0.08, wallH, d]} /><meshStandardMaterial color={wall} metalness={0.55} roughness={0.45} /></mesh>
      ))}
      {/* viền màu theo loại hàng để nhận ra từ xa */}
      <mesh position={[0, wallH - 0.08, d / 2 + 0.05]}><boxGeometry args={[w, 0.16, 0.02]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} /></mesh>
      <mesh position={[0, 0.1 + (h - 0.2) * fill / 2, 0]}>
        <boxGeometry args={[w - 0.12, (h - 0.2) * fill, d - 0.12]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.35} emissive={color} emissiveIntensity={active ? 0.45 : hover ? 0.25 : 0.12} />
      </mesh>
      {active && <SelectionRing radius={pile.radius} reduced={reduced} />}
      <Label pile={pile} active={active || hover} />
    </group>
  )
}

/** Xe tải chạy vào bàn cân, dừng, rồi chạy ra; đứng yên khi giảm hiệu ứng. */
function Truck({ reduced }: { reduced: boolean }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!ref.current || reduced) return
    const t = (clock.getElapsedTime() % 16) / 16 // vòng 16 giây
    // 0–0.35 chạy vào, 0.35–0.6 đứng trên cân, 0.6–1 chạy ra
    const ease = (u: number) => u * u * (3 - 2 * u)
    const x = t < 0.35 ? -34 + ease(t / 0.35) * 22 : t < 0.6 ? -12 : -12 + ease((t - 0.6) / 0.4) * 46
    ref.current.position.x = x
  })
  return (
    <group ref={ref} position={[-12, 0, LANE_Z]}>
      <mesh castShadow={!reduced} position={[1.9, 1.15, 0]}><boxGeometry args={[1.5, 1.7, 2.1]} /><meshStandardMaterial color="#e3b341" roughness={0.4} metalness={0.3} /></mesh>
      <mesh position={[2.66, 1.4, 0]}><boxGeometry args={[0.02, 0.7, 1.7]} /><meshStandardMaterial color="#1b2733" metalness={0.9} roughness={0.1} /></mesh>
      <mesh castShadow={!reduced} position={[-0.6, 1.25, 0]}><boxGeometry args={[3.6, 1.3, 2.2]} /><meshStandardMaterial color="#5b6470" roughness={0.6} metalness={0.5} /></mesh>
      <mesh position={[0, 0.45, 0]}><boxGeometry args={[5.2, 0.3, 2]} /><meshStandardMaterial color="#2a2f36" /></mesh>
      {[-1.7, 0.2, 2].flatMap((x) => [-1, 1].map((z) => (
        <mesh key={`${x}${z}`} position={[x, 0.42, z * 1.05]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 0.3, 14]} /><meshStandardMaterial color="#111316" roughness={0.9} />
        </mesh>
      )))}
    </group>
  )
}

function Weighbridge() {
  return (
    <group position={[-12, 0, LANE_Z]}>
      <mesh receiveShadow position={[0, 0.06, 0]}><boxGeometry args={[7, 0.12, 3]} /><meshStandardMaterial color="#3a3f47" metalness={0.6} roughness={0.4} /></mesh>
      {[-3.5, 3.5].map((x) => <mesh key={x} position={[x, 0.07, 0]}><boxGeometry args={[0.12, 0.14, 3]} /><meshStandardMaterial color="#e3b341" /></mesh>)}
      {/* đầu cân và màn hình */}
      <mesh castShadow position={[0, 1, 2.4]}><boxGeometry args={[0.2, 2, 0.2]} /><meshStandardMaterial color="#4a5059" /></mesh>
      <mesh position={[0, 2.1, 2.4]}><boxGeometry args={[1.4, 0.6, 0.15]} /><meshStandardMaterial color="#111316" emissive="#e3b341" emissiveIntensity={0.25} /></mesh>
      <Html position={[0, 2.1, 2.5]} center distanceFactor={22} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div className="font-mono text-[12px] font-semibold text-gold">24.360 kg</div>
      </Html>
    </group>
  )
}

function Office() {
  return (
    <group position={[-34, 0, -9]}>
      <mesh castShadow receiveShadow position={[0, 1.6, 0]}><boxGeometry args={[6, 3.2, 4]} /><meshStandardMaterial color="#d9dce1" roughness={0.8} /></mesh>
      <mesh position={[0, 3.3, 0]}><boxGeometry args={[6.4, 0.2, 4.4]} /><meshStandardMaterial color="#2a2f36" /></mesh>
      {[-1.6, 0, 1.6].map((x) => <mesh key={x} position={[x, 1.9, 2.01]}><boxGeometry args={[1, 0.8, 0.02]} /><meshStandardMaterial color="#1b2733" emissive="#7dd3fc" emissiveIntensity={0.15} /></mesh>)}
    </group>
  )
}

function Ground() {
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[90, 50]} />
        <meshStandardMaterial color="#2c3036" roughness={0.95} />
      </mesh>
      {/* lối xe chạy */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, LANE_Z]}>
        <planeGeometry args={[90, LANE_WIDTH]} />
        <meshStandardMaterial color="#363a41" roughness={0.9} />
      </mesh>
      {Array.from({ length: 22 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-42 + i * 4, 0.02, LANE_Z]}>
          <planeGeometry args={[1.6, 0.12]} /><meshBasicMaterial color="#e3b341" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  )
}

export default function Yard({ piles, selected, onSelect, reduced }: YardProps) {
  const [k] = useState(viewScale)
  return (
    <Canvas
      shadows={!reduced}
      dpr={reduced ? 1 : [1, 2]}
      frameloop={reduced ? 'demand' : 'always'}
      camera={{ position: [18 * k, 22 * k, 34 * k], fov: 40 }}
      gl={{ antialias: !reduced, preserveDrawingBuffer: true }}
      onPointerMissed={() => onSelect(null)}
      aria-label="Cảnh 3D bãi phế liệu"
    >
      <color attach="background" args={['#0c0d0f']} />
      <fog attach="fog" args={['#0c0d0f', 45 * k, 95 * k]} />
      <hemisphereLight args={['#dfe7f2', '#2a2d33', 1.1]} />
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[18, 28, 14]}
        intensity={2.8}
        color="#fff4dc"
        castShadow={!reduced}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <Ground />
      <Office />
      <Weighbridge />
      <Truck reduced={reduced} />
      {piles.map((p) =>
        p.kind === 'heap'
          ? <Heap key={p.code} pile={p} active={selected === p.code} onSelect={onSelect} reduced={reduced} />
          : <Bin key={p.code} pile={p} active={selected === p.code} onSelect={onSelect} reduced={reduced} />,
      )}
      <OrbitControls
        makeDefault
        target={[-2, 1.5, -2]}
        minDistance={14}
        maxDistance={70 * k}
        maxPolarAngle={Math.PI / 2.15}
        enableDamping={!reduced}
      />
    </Canvas>
  )
}
