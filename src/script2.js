import './style.css'
import * as dat from 'lil-gui'
import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import gsap from 'gsap'
import CANNON from 'cannon' 
import { Object3D } from 'three';


// const blocker = document.getElementById( 'blocker' );
// const instructions = document.getElementById( 'instructions' );

// var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;


/**
 * Base
 */

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
 * Textures
 */
 const textureLoader = new THREE.TextureLoader()

 const parquetColorTexture = textureLoader.load('/textures/basket_court_textures/basket_court_bk3.png')
 parquetColorTexture.encoding = THREE.sRGBEncoding

 const parquetNormalTexture = textureLoader.load('/textures/basket_court_textures/basket_court_bk_normal.png')

 

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

// Canvas
const canvas = document.querySelector('canvas.webgl')
const cubeTextureLoader = new THREE.CubeTextureLoader()


// Scene
const scene = new THREE.Scene()
scene.background = new THREE.Color('white');
scene.fog = new THREE.Fog( 0x000000, 0, 500 );

// var ambient = new THREE.AmbientLight( 0x111111 );
// scene.add( ambient );s



                /**
 * Environment map
 */
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

// gui.add(rectAreaLight, 'intensity').min(0).max(10).step(0.001).name('rectArealightIntensity')
// gui.add(rectAreaLight.position, 'x').min(- 10).max(10).step(0.01).name('lightX')
// gui.add(rectAreaLight.position, 'y').min(- 10).max(10).step(0.01).name('lightY')
// gui.add(rectAreaLight.position, 'z').min(- 10).max(10).step(0.01).name('lightZ')


const directionalLight = new THREE.DirectionalLight('#ffffff', 3.6)
directionalLight.castShadow = true
directionalLight.shadow.camera.far = 15
directionalLight.shadow.mapSize.set(1023, 1023)
directionalLight.shadow.normalBias = 0.05
directionalLight.position.set(-3.6, 2.05, -6.55)
scene.add(directionalLight)

// gui.add(directionalLight, 'intensity').min(0).max(10).step(0.001).name('directionallightIntensity')
// gui.add(directionalLight.position, 'x').min(- 15).max(5).step(0.01).name('lightX')
// gui.add(directionalLight.position, 'y').min(- 15).max(5).step(0.01).name('lightY')
// gui.add(directionalLight.position, 'z').min(- 15).max(5).step(0.01).name('lightZ')




/**
 * Physics
 */
 const world = new CANNON.World()
 world.broadphase = new CANNON.SAPBroadphase(world)
 world.allowSleep = true
//  world.quatNormalizeSkip = 0;
//  world.quatNormalizeFast = false;
 world.gravity.set(0, - 9.806, 0)
 
 
 
 // Default material
 const defaultMaterial = new CANNON.Material('default')
 const defaultContactMaterial = new CANNON.ContactMaterial(
     defaultMaterial,
     defaultMaterial,
     {
         friction: 0.1,
         restitution: 0.68
     }
 )
 world.defaultContactMaterial = defaultContactMaterial

 
 
 // Floor
 const floorShape = new CANNON.Plane()
 const floorBody = new CANNON.Body()
 floorBody.mass = 0
//  floorBody.position.set( 0, -1.73, 0)
 floorBody.addShape(floorShape)
 floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(- 1, 1, 1), Math.PI * 0.5) 
 world.addBody(floorBody)
 
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



/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputEncoding = THREE.sRGBEncoding
})


/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 1000 );
// camera.position.x = -0.200
// camera.position.y = -0.032
// camera.position.z = 1.8
camera.position.set( 3.338, -0.06, 2.3)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
// controls.minPolarAngle = Math.PI / 3   
// controls.maxPolarAngle =  Math.PI / 1.6
// controls.minAzimuthAngle =  Math.PI / 0.53
// controls.maxAzimuthAngle =  Math.PI / 7.0
controls.zoomSpeed = 1
controls.screenSpacePanning = true
controls.rollSpeed = Math.PI / 23
controls.autoForward = false
controls.dragToLook = false

controls.dampingFactor = 0.05;
controls.screenSpacePanning = true;
controls.minDistance = 1;
controls.maxDistance = 2.8;
controls.enablePan = true

controls.enableZoom = true



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


/**
 * Renderer
 */
 const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.physicallyCorrectLights = true
renderer.outputEncoding = THREE.sRGBEncoding
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 0.88
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
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


let render = function() {

    // controls.update();
    renderer.render(scene, camera);
}



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
 const clock = new THREE.Clock()
 let oldElapsedTime = 0
 
 const tick = () =>
 {
     const elapsedTime = clock.getElapsedTime()
     const deltaTime = elapsedTime - oldElapsedTime
     oldElapsedTime = elapsedTime
 
     // Update physics
     world.step(1 / 60, deltaTime, 3)

     for(const object of objectsToUpdate)
     {
         object.mesh.position.copy(object.body.position)
         object.mesh.quaternion.copy(object.body.quaternion)
     }
 
     // Update controls
     controls.update()
 
     // Render
     renderer.render(scene, camera)
 
     // Call tick again on the next frame
     window.requestAnimationFrame(tick)
 }

 
 
 tick()