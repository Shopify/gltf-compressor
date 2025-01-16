import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import './App.css'

function App() {
  return (
    <>
     <Canvas>
      <mesh>
        <boxGeometry />
        <meshBasicMaterial color="red" />
      </mesh>
      <OrbitControls />
     </Canvas>
    </>
  )
}

export default App
