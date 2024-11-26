import React, { useRef } from 'react'
import { Box } from '@react-three/drei'
import { Group } from 'three'

const ImmersiveCity = () => {
  const cityRef = useRef<Group>(null)

  // Create a basic city grid
  const createBuilding = (x: number, z: number, height: number) => (
    <Box
      key={`${x}-${z}`}
      position={[x * 20, height / 2, z * 20]}
      args={[15, height, 15]}
    >
      <meshStandardMaterial
        color="#334455"
        metalness={0.8}
        roughness={0.2}
        emissive="#112233"
        emissiveIntensity={0.2}
      />
      {/* Windows */}
      {Array.from({ length: Math.floor(height / 4) }).map((_, i) => (
        <Box
          key={i}
          position={[7.6, -height / 2 + 2 + i * 4, 0]}
          args={[0.1, 3, 10]}
        >
          <meshStandardMaterial
            color="#ffcc88"
            emissive="#ffcc88"
            emissiveIntensity={0.5}
          />
        </Box>
      ))}
    </Box>
  )

  // Create a grid of buildings
  const cityBlocks = []
  for (let x = -5; x <= 5; x++) {
    for (let z = -5; z <= 5; z++) {
      const height = 20 + Math.random() * 60
      cityBlocks.push(createBuilding(x, z, height))
    }
  }

  return (
    <group ref={cityRef}>
      {/* Street level */}
      <Box 
        args={[1000, 0.1, 1000]} 
        position={[0, -0.05, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          color="#222222"
          roughness={0.8}
          metalness={0.2}
        />
      </Box>

      {/* Buildings */}
      {cityBlocks}

      {/* Street lights */}
      {Array.from({ length: 20 }).map((_, i) => (
        <group key={i} position={[i * 10 - 100, 0, 20]}>
          <Box args={[0.2, 5, 0.2]} position={[0, 2.5, 0]}>
            <meshStandardMaterial color="#333333" />
          </Box>
          <pointLight
            position={[0, 5, 0]}
            intensity={5}
            distance={15}
            color="#ffaa44"
          />
        </group>
      ))}

      {/* Ambient lighting */}
      <ambientLight intensity={0.2} />
      <directionalLight
        position={[50, 100, 50]}
        intensity={0.8}
        castShadow
      />
      <hemisphereLight
        intensity={0.3}
        groundColor="#000000"
        color="#ffffff"
      />

      {/* Fog for atmosphere */}
      <fog attach="fog" args={['#000000', 10, 100]} />
    </group>
  )
}

export default ImmersiveCity 