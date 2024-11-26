import React from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Suspense } from 'react'
import Globe from './components/Globe'
import Interface from './components/Interface'
import './App.css'

const App: React.FC = () => {
  return (
    <div className="canvas-container">
      <Canvas
        camera={{
          position: [0, 0, 5],
          fov: 45,
          near: 0.1,
          far: 1000
        }}
      >
        <color attach="background" args={['#000005']} />
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <Globe />
          <OrbitControls 
            enablePan={false}
            enableZoom={true}
            minDistance={1.5}
            maxDistance={7}
            enableDamping={true}
            dampingFactor={0.05}
          />
        </Suspense>
      </Canvas>
      <Interface />
    </div>
  )
}

export default App
