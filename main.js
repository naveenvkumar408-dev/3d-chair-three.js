import * as THREE from 'three';
import {OrbitControls}  from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import GUI from 'three/addons/libs/lil-gui.module.min.js';
import {BokehPass} from 'three/addons/postprocessing/BokehPass.js';
let model;
let isHovering=false;

//scene
const scene = new THREE.Scene();
// scene.background = new THREE.Color(0xaaaaaa);

//environment//
// const environment = new RGBELoader();
// environment.load('environmenttexture/sky.hdr',(hdrTexture)=>
// {
//   hdrTexture.mapping = THREE.EquirectangularReflectionMapping;

//   scene.background = hdrTexture;
//   scene.environment = hdrTexture;
// });

//camera
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.set(2,3,10);
const blur = new BokehPass(scene,camera,{
  focus:6,
  aperture:6,
  maxblur:6
});


//renderer
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.appendChild( renderer.domElement );

//orbitcontrols
const Controls = new OrbitControls(camera,renderer.domElement);
Controls.enableDamping=true;
Controls.dampingFactor=0.08;
Controls.enableZoom=true;
Controls.target.set(0,0,0);


// light
const directionalLight = new THREE.DirectionalLight(0xffffff, 5);
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);  

//texture loader//
const texture = new THREE.TextureLoader();
const woodtexture = texture.load("textures/wood.jpg");
woodtexture.wrapS = THREE.RepeatWrapping;
woodtexture.wrapT = THREE.RepeatWrapping;
woodtexture.repeat.set(10,10);

//floor with texture
const floorgeo = new THREE.PlaneGeometry(10,10);
const floormat = new THREE.MeshStandardMaterial({map: woodtexture,side : THREE.DoubleSide});
const floor = new THREE.Mesh(floorgeo,floormat);
floor.rotation.x=-Math.PI/2;
floor.position.y=-1.5;
floor.receiveShadow=true;
scene.add(floor);

//gltf model
const loader = new GLTFLoader();
loader.load(
  'models/officechair.glb',
  function(gltf){
    model = gltf.scene;
    
    model.position.set(0,-1.5,0);
    model.scale.set(2,2,2);
    
    model.traverse((child)=>{
      if (child.isMesh){
        child.castShadow=true;
        child.receiveShadow=true;
      }
    });
    scene.add(model);
  },
  undefined,
  function(error){
    console.error('an error happened while loading the maodel:',error);
  }
);

// Raycaster + mouse
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

}
);
// Geometry

// Create geometry
const particlesGeometry = new THREE.BufferGeometry();
const count = 10000; // number of particles
const positions = new Float32Array(count * 3);

for (let i = 0; i < count * 3; i++) {
  positions[i] = (Math.random() - 0.5) * 100; // random in space
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

// Material
const particlesMaterial = new THREE.PointsMaterial({
  size: 0.1,
  color: 0xffffff
});

// Mesh
const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

// const geometry = new THREE.SphereGeometry(1, 64, 64);
// const basic = new THREE.MeshBasicMaterial({ color: 0xff0000 });
// const lambert = new THREE.MeshLambertMaterial({ color: 0x333 });
// const phong = new THREE.MeshPhongMaterial({ color: 0x0000ff, shininess: 100 });
// const standard = new THREE.MeshStandardMaterial({ color: 0xfff000, metalness: 0.5, roughness: 0.5 });
// const physical = new THREE.MeshPhysicalMaterial({ color: 0xfff000, metalness: 0.5, roughness: 0.5, clearcoat: 1 });

// // Start with standard material
// const sphere = new THREE.Mesh(geometry, standard);
// sphere.castShadow = true;
// scene.add(sphere);


//scene.add(new THREE.BoxHelper(model,0xff0000));

//setup composer//
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene,camera));

const bloompass = new UnrealBloomPass(
   new THREE.Vector2(window.innerWidth,window.innerHeight),
   0.1,
   0,
   1
);
composer.addPass(bloompass,blur);

//anime
function animate() {
  requestAnimationFrame(animate);
  // sphere.rotation.y+=0.01;
  particles.rotation.y += 0.001; // slow rotation
  particles.rotation.x = mouse.y * 0.2;
  particles.rotation.y = mouse.x * 0.2;
  
  // cube.rotation.x+=0.01;
  // cube.rotation.y+=0.01;
  if (model) {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(model, true);
    isHovering = intersects.length > 0;
  if (isHovering){
    model.rotation.y+=0.01;
  }
}
  Controls.update();
  composer.render();
}
animate();

window.addEventListener("click", () => {
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] += (Math.random() - 0.5) * 2; // x
    positions[i + 1] += (Math.random() - 0.5) * 2; // y
    positions[i + 2] += (Math.random() - 0.5) * 2; // z
  }
  particlesGeometry.attributes.position.needsUpdate = true;
});

//gui
const gui = new GUI();
gui.add(bloompass,"strength",0,3).step(0.1);
gui.add(bloompass,"radius",0,1).step(0.01);
gui.add(bloompass,"threshold",0,1).step(0.01);
gui.add(blur.materialBokeh.uniforms.focus,'value',1.0,10.0).name('Focus');
gui.add(blur.materialBokeh.uniforms.focus,'value',0.0001,0.1).name('Aperture');
gui.add(blur.materialBokeh.uniforms.focus,'value',0.0,5).name('Max Blur');
// const materials = { basic, lambert, phong, standard, physical };
// let currentMaterial = 'standard';
// gui.add({ material: currentMaterial }, 'material', Object.keys(materials)).onChange((mat) => {
//   sphere.material = materials[mat];
// });
//handel window resize
window.addEventListener('resize',function(){
  camera.aspect=this.window.innerWidth/this.window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(this.window.innerWidth,this.window.innerHeight);
});