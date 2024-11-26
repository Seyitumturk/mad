import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Sphere } from '@react-three/drei'
import { Mesh, ShaderMaterial, Group, Vector3 } from 'three'
import { useGlobeStore } from '../stores/globeStore'
import gsap from 'gsap'
import CityView from './CityView'
import ImmersiveCity from './ImmersiveCity'

// Add noise functions and continent data
const ContinentShader = {
  uniforms: {
    time: { value: 0 },
    elevation: { value: 0.04 },
    cameraDistance: { value: 5.0 },
    focusPoint: { value: new Vector3(0, 0, 0) },
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vPos;
    uniform float time;
    uniform float elevation;
    uniform float cameraDistance;
    uniform vec3 focusPoint;

    // Noise functions for vertex shader
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float noise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;

      i = mod289(i);
      vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0));

      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);

      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    float fbm(vec3 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      for(int i = 0; i < 4; i++) {
        value += amplitude * noise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
      }
      return value;
    }

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPos = position;
      
      // Calculate distance-based detail factor
      float detailFactor = smoothstep(1.5, 4.0, cameraDistance);
      
      // Modify noise frequency based on camera distance
      float noiseScale = mix(4.0, 1.5, detailFactor);
      vec3 noisePos = position * noiseScale;
      
      // Increase detail near focus point when zooming in
      float distToFocus = length(position - focusPoint);
      float focusDetail = smoothstep(0.5, 0.0, distToFocus);
      noiseScale = mix(noiseScale, noiseScale * 2.0, focusDetail);
      
      float n = fbm(noisePos);
      float continents = fbm(noisePos * 0.2) * 2.5;
      
      // Add extra detail layer for close-up view
      float microDetail = fbm(noisePos * 4.0) * 0.1 * (1.0 - detailFactor);
      
      float landMask = smoothstep(0.2, 0.3, continents) * 
                      smoothstep(-0.2, 0.2, n);
      
      float heightVariation = fbm(noisePos * 2.0) * 0.4 + microDetail;
      vec3 newPosition = position + normal * (landMask * elevation * (1.0 + heightVariation));
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    varying vec3 vPos;

    // Duplicate noise functions for fragment shader
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float noise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;

      i = mod289(i);
      vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0));

      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);

      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    float fbm(vec3 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      for(int i = 0; i < 4; i++) {
        value += amplitude * noise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
      }
      return value;
    }

    // New function for biome variation
    vec3 getBiomeColor(float height, vec3 position) {
      // Softer, more natural colors
      vec3 deepGreen = vec3(0.15, 0.35, 0.15);    // Forest
      vec3 lightGreen = vec3(0.35, 0.45, 0.20);   // Grassland
      vec3 desertColor = vec3(0.76, 0.70, 0.50);  // Desert
      vec3 mountainColor = vec3(0.55, 0.55, 0.55); // Mountains
      vec3 snowColor = vec3(0.95, 0.95, 0.95);     // Snow
      
      float latitude = abs(position.y);
      
      // Smoother biome transitions
      vec3 baseColor;
      
      // Add some noise to break up straight latitude lines
      float latitudeNoise = fbm(position * 4.0) * 0.2;
      float noisyLatitude = latitude + latitudeNoise;
      
      if (noisyLatitude > 0.75) {
        // Polar regions
        baseColor = mix(mountainColor, snowColor, smoothstep(0.75, 0.85, noisyLatitude));
      } else if (noisyLatitude > 0.55) {
        // Tundra transition
        baseColor = mix(lightGreen, snowColor, smoothstep(0.55, 0.75, noisyLatitude));
      } else if (noisyLatitude > 0.2 && noisyLatitude < 0.4) {
        // Desert bands with smoother transition
        float desertInfluence = smoothstep(0.2, 0.3, noisyLatitude) * 
                               (1.0 - smoothstep(0.3, 0.4, noisyLatitude));
        baseColor = mix(lightGreen, desertColor, desertInfluence);
      } else {
        // Main temperate/tropical regions
        float heightInfluence = smoothstep(0.3, 0.7, height);
        
        if (height > 0.7) {
          // Mountain peaks
          baseColor = mix(mountainColor, snowColor, smoothstep(0.7, 0.85, height));
        } else {
          // Regular terrain
          baseColor = mix(deepGreen, lightGreen, heightInfluence * 0.5);
        }
      }
      
      return baseColor;
    }

    void main() {
      vec3 noisePos = vPos * 1.5; // Match vertex shader frequency
      float n = fbm(noisePos);
      
      // Modified continental shapes to match vertex shader
      float continents = fbm(noisePos * 0.2) * 2.5;
      float landMask = smoothstep(0.2, 0.3, continents) * 
                      smoothstep(-0.2, 0.2, n);
      
      // Enhanced ocean colors - reduced opacity
      vec3 deepOcean = vec3(0.05, 0.15, 0.3);
      vec3 shallowOcean = vec3(0.1, 0.25, 0.4);
      
      float oceanDepth = mix(0.8, 1.0, fbm(noisePos * 1.5));
      vec3 oceanColor = mix(deepOcean, shallowOcean, oceanDepth);
      
      // Terrain variation
      float terrainHeight = fbm(noisePos * 2.0) * 0.7 + 0.3;
      vec3 landColor = getBiomeColor(terrainHeight, vPos);
      
      // Sharper transition between land and water
      vec3 color = mix(oceanColor, landColor, smoothstep(0.45, 0.55, landMask));
      
      // Lighting
      vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
      float diffuse = max(dot(vNormal, lightDir), 0.0);
      float ambient = 0.4;
      
      vec3 viewDir = normalize(-vPos);
      vec3 halfDir = normalize(lightDir + viewDir);
      float specular = pow(max(dot(vNormal, halfDir), 0.0), 50.0);
      
      // Apply lighting
      float lighting = ambient + diffuse * 0.6;
      color *= lighting;
      color += (1.0 - landMask) * specular * 0.3;
      
      // Subtle atmospheric effect
      float atmosphericEffect = pow(1.0 - abs(dot(vNormal, viewDir)), 2.0);
      vec3 atmosphereColor = vec3(0.6, 0.8, 1.0);
      color = mix(color, atmosphereColor, atmosphericEffect * 0.15);
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
}

// Update city position to be near equator on land (roughly Brazil)
const CITY_POSITION = new Vector3(0.5, 0.1, -0.5).normalize()

const Globe: React.FC = () => {
  const meshRef = useRef<Mesh>(null)
  const globeGroup = useRef<Group>(null)
  const { camera } = useThree()
  const continentRef = useRef<ShaderMaterial>(null)
  const { highlightedRegion, setHighlightedRegion, showImmersiveView, setShowImmersiveView } = useGlobeStore()

  const handleCitySelect = () => {
    setHighlightedRegion('madwrld')
  }

  const zoomToCity = () => {
    const targetPos = CITY_POSITION.clone()
    const timeline = gsap.timeline()

    // Disable orbit controls during transition
    const controls = camera.userData.controls
    if (controls) controls.enabled = false

    // Smoother multi-stage transition
    timeline
      // First stage: Gentle zoom towards city
      .to(camera.position, {
        x: targetPos.x * 3,
        y: targetPos.y * 3,
        z: targetPos.z * 3,
        duration: 2,
        ease: "power2.inOut",
        onUpdate: () => {
          camera.lookAt(targetPos.x, targetPos.y, targetPos.z)
        }
      })
      // Second stage: Move closer while maintaining view
      .to(camera.position, {
        x: targetPos.x * 1.5,
        y: targetPos.y * 1.5 + 0.2, // Slightly above to look down at city
        z: targetPos.z * 1.5,
        duration: 2,
        ease: "power2.inOut",
        onUpdate: () => {
          camera.lookAt(targetPos.x, targetPos.y, targetPos.z)
        }
      })
      // Final stage: Transition to street level
      .to(camera.position, {
        x: targetPos.x * 1.02,
        y: targetPos.y * 1.02 + 0.05,
        z: targetPos.z * 1.02,
        duration: 2,
        ease: "power2.inOut",
        onUpdate: () => {
          camera.lookAt(targetPos.x, targetPos.y, targetPos.z)
        },
        onComplete: () => {
          setShowImmersiveView(true)
          if (controls) controls.enabled = true
        }
      })
  }

  // Update the reset animation to be smoother
  useEffect(() => {
    if (highlightedRegion) {
      zoomToCity()
    } else {
      const timeline = gsap.timeline()
      timeline.to(camera.position, {
        x: 0,
        y: 0,
        z: 5,
        duration: 3,
        ease: "power2.inOut",
        onStart: () => {
          setShowImmersiveView(false)
        },
        onUpdate: () => {
          camera.lookAt(0, 0, 0)
        }
      })
    }
  }, [highlightedRegion])

  return (
    <group ref={globeGroup}>
      {showImmersiveView ? (
        <ImmersiveCity />
      ) : (
        <>
          {/* Main globe */}
          <Sphere ref={meshRef} args={[1, 256, 256]}>
            <shaderMaterial
              ref={continentRef}
              args={[ContinentShader]}
              transparent
            />
          </Sphere>

          {/* Ocean layer */}
          <Sphere args={[0.99, 128, 128]}>
            <meshPhongMaterial
              color="#1e4d8c"
              transparent
              opacity={0.2}
              shininess={100}
              specular="#4477aa"
            />
          </Sphere>

          {/* Single city */}
          <CityView
            position={CITY_POSITION}
            name="MADWRLD"
            distanceFromCamera={camera.position.length()}
            onSelect={handleCitySelect}
          />
        </>
      )}
    </group>
  )
}

export default Globe 