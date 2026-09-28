import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const box = document.querySelector("#flower-3d");

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    35,
    box.clientWidth / box.clientHeight,
    .1,
    100
);

camera.position.set(0, .2, 7);

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});

renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(box.clientWidth, box.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

box.appendChild(renderer.domElement);

scene.add(
    new THREE.HemisphereLight(
        0xffffff,
        0x555555,
        2.5
    )
);

const keyLight = new THREE.DirectionalLight(
    0xffffff,
    3.5
);

keyLight.position.set(4, 6, 5);
keyLight.castShadow = true;

scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(
    0xffd27a,
    1.5
);

fillLight.position.set(-4, 2, 4);

scene.add(fillLight);

const flower = new THREE.Group();

scene.add(flower);

const loader = new GLTFLoader();

const flowers = [
    {
        file: "../models/sunflower.glb",
        name: "Sunflower",
        type: "HELIANTHUS ANNUUS",
        description: "A flower that follows the light.",
        species: "HELIANTHUS",
        family: "ASTERACEAE",
        status: "IN BLOOM",
        hotspots: [
            ["PETALS", "Bright outer petals surrounding the flower head."],
            ["SEEDS", "The central structure contains hundreds of developing seeds."],
            ["STEM", "The stem supports the flower and follows the light."]
        ]
    },
    {
        file: "../models/rose.glb",
        name: "Rose",
        type: "ROSA",
        description: "A classic flower associated with love and beauty.",
        species: "ROSA",
        family: "ROSACEAE",
        status: "IN BLOOM",
        hotspots: [
            ["PETALS", "Layered petals form the characteristic rose shape."],
            ["CENTER", "The center of the flower contains the reproductive structures."],
            ["STEM", "The stem supports the flower and carries its leaves."]
        ]
    },
    {
        file: "../models/tulip.glb",
        name: "Tulip",
        type: "TULIPA",
        description: "A clean and elegant flower with a simple silhouette.",
        species: "TULIPA",
        family: "LILIACEAE",
        status: "IN BLOOM",
        hotspots: [
            ["PETALS", "The petals form the recognizable cup-shaped flower."],
            ["CENTER", "The center contains the flower's reproductive structures."],
            ["STEM", "The long stem supports the flower above the leaves."]
        ]
    },
    {
    file: "../models/lilies.glb",
    name: "Lily",
    type: "LILIUM",
    description: "An elegant flower with a distinctive open shape.",
    species: "LILIUM",
    family: "LILIACEAE",
    status: "IN BLOOM",
    hotspots: null
}
];

let currentFlower = 0;
let currentModel = null;

let targetX = -.08;
let targetY = 0;
let targetCameraZ = 7;
let targetCameraY = .2;

const flowerIndex = document.querySelector("#flower-index");
const flowerType = document.querySelector("#flower-type");
const flowerName = document.querySelector("#flower-name");
const flowerDescription = document.querySelector("#flower-description");

const flowerNumber = document.querySelector("#flower-number");
const flowerCurrent = document.querySelector("#flower-current");

const flowerSpecies = document.querySelector("#flower-species");
const flowerFamily = document.querySelector("#flower-family");
const flowerStatus = document.querySelector("#flower-status");

const previousButton = document.querySelector("#flower-prev");
const nextButton = document.querySelector("#flower-next");

function updateHotspots(data) {
    const hotspots = document.querySelectorAll(".flower-hotspot");

    hotspots.forEach((hotspot, index) => {
        if (!data.hotspots) {
            hotspot.style.display = "none";
            return;
        }

        const hotspotData = data.hotspots[index];

        hotspot.style.display = "block";
        hotspot.dataset.title = hotspotData[0];
        hotspot.dataset.text = hotspotData[1];
    });
}
function updateFlowerInfo() {
    const data = flowers[currentFlower];

    flowerIndex.textContent =
        `${String(currentFlower + 1).padStart(2, "0")} / SPECIMEN`;

    flowerType.textContent = data.type;
    flowerName.textContent = data.name;
    flowerDescription.textContent = data.description;

    flowerNumber.textContent =
        String(currentFlower + 1).padStart(3, "0");

    flowerCurrent.textContent =
        String(currentFlower + 1).padStart(2, "0");

    flowerSpecies.textContent = data.species;
    flowerFamily.textContent = data.family;
    flowerStatus.textContent = data.status;

    updateHotspots(data);
}

let loadId = 0;

function loadFlower(index) {
    currentFlower = index;
    const currentLoadId = ++loadId;

    updateFlowerInfo();

    targetX = -.08;
    targetY = 0;
    targetCameraZ = 7;
    targetCameraY = .2;

    if (currentModel) {
        flower.remove(currentModel);
        currentModel = null;
    }
    document
    .querySelectorAll(".flower-views button")
    .forEach(button => button.classList.remove("active"));

        document
    .querySelector('.flower-views button[data-view="front"]')
    .classList.add("active");

    loader.load(
        flowers[currentFlower].file,
        gltf => {
            if (currentLoadId !== loadId) {
                return;
            }

            if (currentModel) {
                flower.remove(currentModel);
                currentModel = null;
            }

            const model = gltf.scene;

            model.traverse(object => {
                if (object.isMesh) {
                    object.castShadow = true;
                    object.receiveShadow = true;
                }
            });

            const bounds = new THREE.Box3().setFromObject(model);
            const size = bounds.getSize(new THREE.Vector3());
            const center = bounds.getCenter(new THREE.Vector3());

            const scale =
                3.4 / Math.max(size.x, size.y, size.z);

            model.scale.setScalar(scale);

            model.position.set(
                -center.x * scale,
                -center.y * scale,
                -center.z * scale
            );

            currentModel = model;
            flower.add(model);
        },
        undefined,
        error => {
            if (currentLoadId !== loadId) {
                return;
            }

            console.error(
                `Ошибка загрузки модели ${flowers[currentFlower].file}:`,
                error
            );
        }
    );
}

previousButton.addEventListener("click", () => {
    const nextIndex =
        (currentFlower - 1 + flowers.length) % flowers.length;

    loadFlower(nextIndex);
});

nextButton.addEventListener("click", () => {
    const nextIndex =
        (currentFlower + 1) % flowers.length;

    loadFlower(nextIndex);
});

box.addEventListener("pointermove", event => {
    const rect = box.getBoundingClientRect();

    const x =
        (event.clientX - rect.left) / rect.width - .5;

    const y =
        (event.clientY - rect.top) / rect.height - .5;

    targetY = x * .7;
    targetX = -.08 + y * .25;
});

box.addEventListener("pointerleave", () => {
    targetX = -.08;
    targetY = 0;
});

const views = {
    front: {
        rotation: 0,
        z: 7,
        y: .2
    },
    side: {
        rotation: Math.PI / 2,
        z: 7,
        y: .2
    },
    detail: {
        rotation: 0,
        z: 4.5,
        y: .35
    }
};

document.querySelectorAll(".flower-views button").forEach(button => {
    button.addEventListener("click", () => {
        const view = views[button.dataset.view];

        targetY = view.rotation;
        targetCameraZ = view.z;
        targetCameraY = view.y;

        document
            .querySelectorAll(".flower-views button")
            .forEach(button => {
                button.classList.remove("active");
            });

        button.classList.add("active");
    });
});

const tooltip = document.querySelector(".flower-tooltip");
const tooltipTitle = tooltip.querySelector("span");
const tooltipText = tooltip.querySelector("p");

document.querySelectorAll(".flower-hotspot").forEach(hotspot => {
    hotspot.addEventListener("mouseenter", () => {
        tooltipTitle.textContent =
            hotspot.dataset.title;

        tooltipText.textContent =
            hotspot.dataset.text;

        const rect =
            hotspot.getBoundingClientRect();

        const boxRect =
            box.getBoundingClientRect();

        tooltip.style.left =
            `${rect.left - boxRect.left + 25}px`;

        tooltip.style.top =
            `${rect.top - boxRect.top - 10}px`;

        tooltip.classList.add("show");
    });

    hotspot.addEventListener("mouseleave", () => {
        tooltip.classList.remove("show");
    });
});

let time = 0;

function animate() {
    requestAnimationFrame(animate);

    time += .008;

    flower.rotation.x +=
        (targetX - flower.rotation.x) * .045;

    flower.rotation.y +=
        (targetY - flower.rotation.y) * .045;

    flower.position.y =
        Math.sin(time) * .025;

    camera.position.z +=
        (targetCameraZ - camera.position.z) * .05;

    camera.position.y +=
        (targetCameraY - camera.position.y) * .05;

    renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
    const width = box.clientWidth;
    const height = box.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
});

loadFlower(0);

animate();