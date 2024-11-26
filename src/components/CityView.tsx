import React, { useRef, useState, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Box } from '@react-three/drei'
import { Group, Vector3, MathUtils, Matrix4 } from 'three'
import { useGlobeStore } from '../stores/globeStore'
import gsap from 'gsap'

interface CityViewProps {
  position: Vector3
  name: string
  distanceFromCamera: number
  onSelect: () => void
}

const CityView: React.FC<CityViewProps> = ({ 
  position, 
  name, 
  distanceFromCamera,
  onSelect 
}) => {
  const groupRef = useRef<Group>(null)
  const { camera } = useThree()
  const normalizedPosition = position.clone().normalize()
  const { setShowImmersiveView } = useGlobeStore()

  // Calculate rotation to align with globe surface
  const alignmentMatrix = useMemo(() => {
    const matrix = new Matrix4()
    const up = normalizedPosition.clone()
    const forward = new Vector3(0, 1, 0)
    const right = new Vector3().crossVectors(forward, up).normalize()
    forward.crossVectors(up, right)
    matrix.makeBasis(right, up, forward)
    return matrix
  }, [normalizedPosition])

  // Visibility and scale controls
  const visibility = useMemo(() => 
    MathUtils.smoothstep(6, 4, distanceFromCamera), [distanceFromCamera])
  
  const scale = useMemo(() => {
    const baseScale = MathUtils.clamp(1 / (distanceFromCamera * 3), 0.005, 0.1)
    return baseScale * (1 + (6 - Math.min(6, distanceFromCamera)) * 0.5)
  }, [distanceFromCamera])

  // Handle zoom transition
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleTransition = () => {
    if (!groupRef.current || isTransitioning) return
    setIsTransitioning(true)

    const cityWorldPos = groupRef.current.getWorldPosition(new Vector3())
    const upVector = cityWorldPos.clone().normalize()
    
    // Calculate street-level view position
    const streetLevel = cityWorldPos.clone().multiplyScalar(1.02)
    const lookAtPoint = streetLevel.clone().add(upVector.multiplyScalar(0.1))
    
    gsap.timeline({
      onStart: () => {
        if (camera.userData.controls) {
          camera.userData.controls.enabled = false
        }
      },
      onComplete: () => {
        onSelect()
        setShowImmersiveView(true)
      }
    })
    .to(camera.position, {
      x: streetLevel.x,
      y: streetLevel.y + 2, // Place camera at human height
      z: streetLevel.z,
      duration: 2,
      ease: "power2.inOut",
      onUpdate: () => {
        camera.lookAt(lookAtPoint)
      }
    })
  }

  useFrame(() => {
    if (!groupRef.current || isTransitioning) return
    
    const distance = camera.position.distanceTo(
      groupRef.current.getWorldPosition(new Vector3())
    )
    
    if (distance < 2.5 && !isTransitioning) {
      handleTransition()
    }
  })

  if (visibility <= 0) return null

  return (
    <group
      ref={groupRef}
      position={normalizedPosition.multiplyScalar(1.001)}
      matrix={alignmentMatrix}
      scale={scale}
      onClick={onSelect}
    >
      {/* Simplified city representation for globe view */}
      <Box args={[0.5, 1, 0.5]} position={[0, 0.5, 0]}>
        <meshStandardMaterial
          color="#445566"
          metalness={0.8}
          roughness={0.2}
          emissive="#ffaa44"
          emissiveIntensity={0.3 * visibility}
          transparent
          opacity={visibility}
        />
      </Box>
      
      <pointLight
        position={[0, 1, 0]}
        intensity={5 * visibility}
        distance={2}
        color="#ffaa44"
      />
    </group>
  )
}

export default CityView