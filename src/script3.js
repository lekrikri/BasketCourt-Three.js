import './style.css'
import * as dat from 'lil-gui'
import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import gsap from 'gsap'
import * as CANNON from 'cannon-es'
import { PointerLockControlsCannon } from './PointerLockControlsCannon.js'



// three.js variables
let camera, scene, renderer
let material
let  MODEL_PATH = "ball.glb";
console.log(MODEL_PATH)




// cannon.js variables
let world
let controls
const timeStep = 1 / 60
let lastCallTime = performance.now()
let sphereShape
let sphereBody
let physicsMaterial
const balls = []
const ballMeshes = []
const boxes = []
const boxMeshes = []

const instructions = document.getElementById('instructions')

initThree()
initCannon()
initPointerLock()
animate()


// Stats.js
// stats = new Stats()
// document.body.appendChild(stats.dom)


/**
 * Base
 */
/**
 * Camera
 */
 function initThree() {
      // Camera
      camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 300)
    
      // Scene
      scene = new THREE.Scene()
      scene.background = new THREE.Color('white');
      scene.fog = new THREE.Fog( 0x000000, 0, 500 );

      scene.add(camera)

  
  
         /**
     * Renderer
     */
 // Renderer
 renderer = new THREE.WebGLRenderer({ antialias: true })
 renderer.setSize(window.innerWidth, window.innerHeight)
 renderer.setClearColor(scene.fog.color)

 renderer.shadowMap.enabled = true
 renderer.shadowMap.type = THREE.PCFSoftShadowMap
 renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.88
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.physicallyCorrectLights = true
    renderer.outputEncoding = THREE.sRGBEncoding
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    
    

 document.body.appendChild(renderer.domElement)



 /**
 * Environment map
 */
const cubeTextureLoader = new THREE.CubeTextureLoader()

 const environmentMap = cubeTextureLoader.load([
    '/textures/environmentMaps/1/px.jpg',
    '/textures/environmentMaps/1/nx.jpg',
    '/textures/environmentMaps/1/py.jpg',
    '/textures/environmentMaps/1/ny.jpg',
    '/textures/environmentMaps/1/pz.jpg',
    '/textures/environmentMaps/1/nz.jpg'
])

environmentMap.encoding = THREE.sRGBEncoding
// debugObject.envMapIntensity = 0.132
// gui.add(debugObject, 'envMapIntensity').min(0).max(2).step(0.001).onChange(updateAllMaterials)

scene.background = environmentMap
scene.environment = environmentMap


//Lights 

const rectAreaLight = new THREE.RectAreaLight('#ffffff', 9.751, 20, 10)
rectAreaLight.castShadow = false
rectAreaLight.position.set(8.77, 6.56, 0.17)
scene.add(rectAreaLight)



const directionalLight = new THREE.DirectionalLight('#ffffff', 3.6)
directionalLight.castShadow = true
directionalLight.shadow.camera.far = 15
directionalLight.shadow.mapSize.set(1023, 1023)
directionalLight.shadow.normalBias = 0.05
directionalLight.position.set(-3.6, 2.05, -6.55)
scene.add(directionalLight)



}



 function initCannon() {
  world = new CANNON.World()

  // Tweak contact properties.
  // Contact stiffness - use to make softer/harder contacts
  world.defaultContactMaterial.contactEquationStiffness = 1e9

  // Stabilization time in number of timesteps
  world.defaultContactMaterial.contactEquationRelaxation = 4

  const solver = new CANNON.GSSolver()
  solver.iterations = 7
  solver.tolerance = 0.1
  world.solver = new CANNON.SplitSolver(solver)
  // use this to test non-split solver
  // world.solver = solver

  world.gravity.set(0, - 9.806, 0)

  // Create a slippery material (friction coefficient = 0.0)
  physicsMaterial = new CANNON.Material('physics')
  const physics_physics = new CANNON.ContactMaterial(physicsMaterial, physicsMaterial, {
    friction: 0.1,
    restitution: 0.68,
  })

  // We must add the contact materials to the world
  world.addContactMaterial(physics_physics)

  // Create the user collision sphere
  const radius = 1.3
  sphereShape = new CANNON.Sphere(radius)
  sphereBody = new CANNON.Body({ mass: 5, material: physicsMaterial })
  sphereBody.addShape(sphereShape)
  sphereBody.position.set(0, 5, 0)
  sphereBody.linearDamping = 0.9
  world.addBody(sphereBody)

  // Create the ground plane
  const groundShape = new CANNON.Plane()
  const groundBody = new CANNON.Body({ mass: 0, material: physicsMaterial })
  groundBody.position.set( 0, -1.3, 0)
  groundBody.addShape(groundShape)
  groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(- 1, 1, 1), Math.PI * 0.5) 
  world.addBody(groundBody)

  // Add boxes both in cannon.js and three.js
  // const halfExtents = new CANNON.Vec3(1, 1, 1)
  // const boxShape = new CANNON.Box(halfExtents)
  // const boxGeometry = new THREE.BoxBufferGeometry(halfExtents.x * 1, halfExtents.y * 1, halfExtents.z * 1)

  // for (let i = 0; i < 7; i++) {
  //   const boxBody = new CANNON.Body({ mass: 5 })
  //   boxBody.addShape(boxShape)
  //   const boxMesh = new THREE.Mesh(boxGeometry, material)

  //   const x = (Math.random() - 0.5) * 20
  //   const y = (Math.random() - 0.5) * 1 + 1
  //   const z = (Math.random() - 0.5) * 20

  //   boxBody.position.set(x, y, z)
  //   boxMesh.position.copy(boxBody.position)

  //   boxMesh.castShadow = true
  //   boxMesh.receiveShadow = true

  //   world.addBody(boxBody)
  //   scene.add(boxMesh)
  //   boxes.push(boxBody)
  //   boxMeshes.push(boxMesh)
  // }

  

  // The shooting balls
  const shootVelocity = 13
  const ballShape = new CANNON.Sphere(0.2)
  const ballGeometry = new THREE.SphereBufferGeometry(ballShape.radius, 25, 25)

  // Returns a vector pointing the the diretion the camera is at
  function getShootDirection() {
    const vector = new THREE.Vector3(0, 0, 1)
    vector.unproject(camera)
    const ray = new THREE.Ray(sphereBody.position, vector.sub(sphereBody.position).normalize())
    return ray.direction
  }

  window.addEventListener('click', (event) => {
    if (!controls.enabled) {
      return
    }

    const ballBody = new CANNON.Body({ mass: 1 })
    ballBody.addShape(ballShape)

    gltfLoader.load(
      'ball.glb',
      (gltf) =>
      {
                 let ball = gltf.scene;
                  gltf.scene.scale.set(1, 1, 1)
                  ball.castShadow = true
                 
                  const ballMesh = ball

                  ballMesh.castShadow = true
                  ballMesh.receiveShadow = true
              
                  world.addBody(ballBody)
                  scene.add(ballMesh)
                  balls.push(ballBody)
                  ballMeshes.push(ballMesh)
              
                //   const shootDirection = getShootDirection()
                //   ballBody.velocity.set(
                //     shootDirection.x * shootVelocity,
                //     shootDirection.y * shootVelocity,
                //     shootDirection.z * shootVelocity
                //   )
                  // Move the ball outside the player sphere
                //   const x = sphereBody.position.x + shootDirection.x * (sphereShape.radius * 1.02 + ballShape.radius)
                //   const y = sphereBody.position.y + shootDirection.y * (sphereShape.radius * 1.02 + ballShape.radius)
                //   const z = sphereBody.position.z + shootDirection.z * (sphereShape.radius * 1.02 + ballShape.radius)
                //   ballBody.position.set(x, y, z)
                //   ballMesh.position.copy(ballBody.position)
      }
      
  )
  
    

   

    
  })
}




   function initPointerLock() {
     controls = new PointerLockControlsCannon(camera, sphereBody)
     scene.add(controls.getObject())

     instructions.addEventListener('click', () => {
       controls.lock()
     })

     controls.addEventListener('lock', () => {
       controls.enabled = true
       instructions.style.display = 'none'
     })

     controls.addEventListener('unlock', () => {
       controls.enabled = false
       instructions.style.display = null
     })
   }

/**
 * Debug
 */
 const gui = new dat.GUI()
 const debugObject = {}

 /**
 * Update all materials
 */
const updateAllMaterials = () =>
{
    scene.traverse((child) =>
    {
        if(child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial)
        {
            // child.material.envMap = environmentMap
            child.material.envMapIntensity = debugObject.envMapIntensity
            child.material.needsUpdate = true
            child.castShadow = true
            child.receiveShadow = true
        }else if(child instanceof THREE.Mesh && child.material instanceof THREE.MeshPhysicalMaterial)
        {
            // child.material.envMap = environmentMap
            child.material.envMapIntensity = debugObject.envMapIntensity
            child.material.needsUpdate = true
            child.castShadow = true
            child.receiveShadow = true  
        }
    })
    
}
 
 debugObject.createBall = () =>
 {
     createBall(
         Math.random() * 0.5,
         {
             x: (Math.random() - 0.5) * 5,
             y: 3,
             z: (Math.random() - 0.5) * 5
         }
     )
 }
 
 gui.add(debugObject, 'createBall')
 
 // Reset
 debugObject.reset = () =>
 {
     for(const object of objectsToUpdate)
     {
         // Remove body
         world.removeBody(object.body)
 
         // Remove mesh
         scene.remove(object.mesh)
     }
     
     objectsToUpdate.splice(0, objectsToUpdate.length)
 }
 gui.add(debugObject, 'reset')

 


/**
 * Loaders
 */
//  const loadingBarElement = document.querySelector('.loader')
//  let sceneReady = false
//  const loadingManager = new THREE.LoadingManager(
//      // Loaded
//     () =>
//     {
//         // Wait a little
//         window.setTimeout(() =>
//         {
//             // Animate overlay
//             gsap.to(overlayMaterial.uniforms.uAlpha, { duration: 3, value: 0, delay: 1 })

//             // Update loadingBarElement
//             loadingBarElement.classList.add('ended')
//             loadingBarElement.style.transform = ''
//         }, 1000 )

//         window.setTimeout(() =>
//         {
//             sceneReady = true
//         }, 2000)
//     },
    

//     // Progress
//     (itemUrl, itemsLoaded, itemsTotal) =>
//     {
        
//         // Calculate the progress and update the loadingBarElement
//         const progressRatio = itemsLoaded / itemsTotal
//         loadingBarElement.style.transform = `scale(${progressRatio})`
//     }
//  )


const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')
// const gltfLoader = new GLTFLoader(loadingManager)
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)




/**
 * Physics
 */
//  const world = new CANNON.World()
//  world.broadphase = new CANNON.SAPBroadphase(world)
//  world.allowSleep = true
// //  world.quatNormalizeSkip = 0;
// //  world.quatNormalizeFast = false;
//  world.gravity.set(0, - 9.806, 0)
 
 
 
//  // Default material
//  const defaultMaterial = new CANNON.Material('default')
//  const defaultContactMaterial = new CANNON.ContactMaterial(
//      defaultMaterial,
//      defaultMaterial,
//      {
//          friction: 0.1,
//          restitution: 0.68
//      }
//  )
//  world.defaultContactMaterial = defaultContactMaterial

 
 
 // Floor
//  const floorShape = new CANNON.Plane()
//  const floorBody = new CANNON.Body()
//  floorBody.mass = 0
//  floorBody.position.set( 0, -1.73, 0)
//  floorBody.addShape(floorShape)
//  floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(- 1, 1, 1), Math.PI * 0.5) 
//  world.addBody(floorBody)
 
 /**
  * Utils
  */
 const objectsToUpdate = []
 
 
 const createBall = (radius, position) =>
 {
       //Ball model
        

        gltfLoader.load(
            'ball.glb',
            (gltf) =>
            {
                       let ball = gltf.scene;
                        gltf.scene.scale.set(1, 1, 1)
                        gltf.scene.position.set(position)
                        ball.castShadow = true
                        scene.add(ball)

                        
        
                        // Cannon.js body
                        const shape = new CANNON.Sphere(1, 1, 1)
                                
                        const body = new CANNON.Body({
                            mass: 1,
                            position: new CANNON.Vec3(0, 3, 0),
                            shape: shape,
                            material: defaultMaterial
                        })
                        body.position.copy(position)
                        world.addBody(body)
                    
                        // Save in objects to update
                        objectsToUpdate.push({
                        mesh: ball,
                        body: body
                    })

                    updateAllMaterials()

                   
            }
            
        )

 }

 

/**
 * Overlay
 */
//  const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1)
//  const overlayMaterial = new THREE.ShaderMaterial({
//     transparent: true,
//     vertexShader: `
//         void main()
//         {
//             gl_Position = projectionMatrix * modelViewMatrix * vec3(position, 1.0);
//         }
//     `,
//     uniforms:
//     {
//         uAlpha: { value: 1 }
//     },
//     fragmentShader: `
//         uniform float uAlpha;

//         void main()
//         {
//             gl_FragColor = vec3(0.139, 0.139, 0.139, uAlpha);
//         }
//     `
// })
//  const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial)
//  scene.add(overlay)







// Controls
// const controls = new OrbitControls(camera, canvas)
// controls.enableDamping = true
// // controls.minPolarAngle = Math.PI / 3   
// // controls.maxPolarAngle =  Math.PI / 1.6
// // controls.minAzimuthAngle =  Math.PI / 0.53
// // controls.maxAzimuthAngle =  Math.PI / 7.0
// controls.zoomSpeed = 1
// controls.screenSpacePanning = true
// controls.rollSpeed = Math.PI / 23
// controls.autoForward = false
// controls.dragToLook = false

// controls.dampingFactor = 0.05;
// controls.screenSpacePanning = true;
// controls.minDistance = 1;
// controls.maxDistance = 2.8;
// controls.enablePan = true

// controls.enableZoom = true



gltfLoader.load(
    'terrain_de_basket.glb',
    (gltf) =>
    {
        
        gltf.scene.scale.set(1, 1, 1)
        gltf.scene.position.set( 0, -0.75, 0)
        
       
        // Get each object
        const parquet1 = gltf.scene.children.find(child => child.name === 'Basket_court_v1')
        const parquet2 = gltf.scene.children.find(child => child.name === 'Basket_court_v2')
        const parquet3 = gltf.scene.children.find(child => child.name === 'Basket_court_v3')
        
        
        console.log(parquet1)
        console.log(parquet2)
        console.log(parquet3)
        
       
        scene.add(gltf.scene) 
        updateAllMaterials()
        parquet2.visible = false
        parquet3.visible = false
        const loadParquet2 = document.querySelector('#parquet2');
        loadParquet2.addEventListener('click', () => {
            parquet2.visible = true
            parquet1.visible = false
            parquet3.visible = false
          
        });
        const loadParquet1 = document.querySelector('#parquet1');
        loadParquet1.addEventListener('click', () => {
            parquet1.visible = true
            parquet2.visible = false
            parquet3.visible = false
          
        });
        const loadParquet3 = document.querySelector('#parquet3');
        loadParquet3.addEventListener('click', () => {
            parquet3.visible = true
            parquet2.visible = false
            parquet1.visible = false
          
        });

      
    }
)



// gui
//     .add(renderer, 'toneMapping', {
//         No: THREE.NoToneMapping,
//         Linear: THREE.LinearToneMapping,
//         Reinhard: THREE.ReinhardToneMapping,
//         Cineon: THREE.CineonToneMapping,
//         ACESFilmic: THREE.ACESFilmicToneMapping
//     })
//     .onFinishChange(() =>
//     {
//         renderer.toneMapping = Number(renderer.toneMapping)
//         updateAllMaterials()
//     })
// gui.add(renderer, 'toneMappingExposure').min(0).max(2).step(0.001)


// let render = function() {

//     // controls.update();
//     renderer.render(scene, camera);
// }



function renderScreenshot() {
    const elem = document.querySelector('#screenshot');
elem.addEventListener('click', () => {
  render();
  canvas.toBlob((blob) => {
    saveBlob(blob, `screencapture-${canvas.width}x${canvas.height}.png`);
});
});
}
renderScreenshot();

const saveBlob = (function() {
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    return function saveData(blob, fileName) {
        const url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = fileName;
        a.click();
    };
}());

/**
 * Animate
 */
 function animate() {
  requestAnimationFrame(animate)

  const time = performance.now() / 1000
  const dt = time - lastCallTime
  lastCallTime = time

  if (controls.enabled) {
    world.step(timeStep, dt)

    // Update ball positions
    for (let i = 0; i < balls.length; i++) {
      ballMeshes[i].position.copy(balls[i].position)
      ballMeshes[i].quaternion.copy(balls[i].quaternion)
    }

    // Update box positions
    for (let i = 0; i < boxes.length; i++) {
      boxMeshes[i].position.copy(boxes[i].position)
      boxMeshes[i].quaternion.copy(boxes[i].quaternion)
    }
  }

  controls.update(dt)
  renderer.render(scene, camera)
  
}