import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const box = document.querySelector("#flower-3d");
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(35, box.clientWidth / box.clientHeight, .1, 100);
camera.position.set(0, .2, 7);

const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(box.clientWidth,box.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
box.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff,0x555555,2.5));

const keyLight = new THREE.DirectionalLight(0xffffff,3.5);
keyLight.position.set(4,6,5);
keyLight.castShadow = true;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffd27a,1.5);
fillLight.position.set(-4,2,4);
scene.add(fillLight);

const flower = new THREE.Group();
scene.add(flower);

const loader = new GLTFLoader();

loader.load("../models/sunflower.glb",gltf=>{
    const model = gltf.scene;

    model.traverse(object=>{
        if(object.isMesh){
            object.castShadow = true;
            object.receiveShadow = true;
        }
    });

    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = 3.4 / Math.max(size.x,size.y,size.z);

    model.scale.setScalar(scale);
    model.position.set(-center.x*scale,-center.y*scale,-center.z*scale);

    flower.add(model);
},undefined,error=>{
    console.error("Ошибка загрузки модели:",error);
});

let targetX = -.08;
let targetY = 0;
let targetCameraZ = 7;
let targetCameraY = .2;

box.addEventListener("pointermove",e=>{
    const rect = box.getBoundingClientRect();
    const x = (e.clientX-rect.left)/rect.width-.5;
    const y = (e.clientY-rect.top)/rect.height-.5;

    targetY = x*.7;
    targetX = -.08+y*.25;
});

box.addEventListener("pointerleave",()=>{
    targetX = -.08;
    targetY = 0;
});

const views = {
    front:{rotation:0,z:7,y:.2},
    side:{rotation:Math.PI/2,z:7,y:.2},
    detail:{rotation:0,z:4.5,y:.35}
};

document.querySelectorAll(".flower-controls button").forEach(button=>{
    button.addEventListener("click",()=>{
        const view = views[button.dataset.view];

        targetY = view.rotation;
        targetCameraZ = view.z;
        targetCameraY = view.y;

        document.querySelectorAll(".flower-controls button").forEach(b=>b.classList.remove("active"));
        button.classList.add("active");
    });
});

const tooltip = document.querySelector(".flower-tooltip");
const tooltipTitle = tooltip.querySelector("span");
const tooltipText = tooltip.querySelector("p");

document.querySelectorAll(".flower-hotspot").forEach(hotspot=>{
    hotspot.addEventListener("mouseenter",()=>{
        tooltipTitle.textContent = hotspot.dataset.title;
        tooltipText.textContent = hotspot.dataset.text;

        const rect = hotspot.getBoundingClientRect();
        const boxRect = box.getBoundingClientRect();

        tooltip.style.left = `${rect.left-boxRect.left+25}px`;
        tooltip.style.top = `${rect.top-boxRect.top-10}px`;
        tooltip.classList.add("show");
    });

    hotspot.addEventListener("mouseleave",()=>{
        tooltip.classList.remove("show");
    });
});

let time = 0;

function animate(){
    requestAnimationFrame(animate);

    time += .008;

    flower.rotation.x += (targetX-flower.rotation.x)*.045;
    flower.rotation.y += (targetY-flower.rotation.y)*.045;

    flower.position.y = Math.sin(time)*.025;

    camera.position.z += (targetCameraZ-camera.position.z)*.05;
    camera.position.y += (targetCameraY-camera.position.y)*.05;

    renderer.render(scene,camera);
}

window.addEventListener("resize",()=>{
    const width = box.clientWidth;
    const height = box.clientHeight;

    camera.aspect = width/height;
    camera.updateProjectionMatrix();
    renderer.setSize(width,height);
});

animate();