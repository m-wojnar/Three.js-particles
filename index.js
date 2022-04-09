// Maksymilian Wojnar

var scene, camera, renderer, controls;
var cameraR = 100, cameraY = 80, cameraPhi = 0;

const delta = 0.002;
var move = true;
var t = 0;

const maxSnowPoints = 2000;
const snowPointsArray = new Float32Array(maxSnowPoints * 3);
var snow;

const maxFirePoints = 4000;
const firePointsArray = new Float32Array(maxFirePoints * 3);
const fireColorsArray = new Float32Array(maxFirePoints * 3);
const fireVectorsArray = new Float32Array(maxFirePoints * 3);
const fireLifetimeArray = new Float32Array(maxFirePoints);
const fireSpeedArray = new Float32Array(maxFirePoints);
var fire;
var mainFirePoint;

init();
animate();

function init() {
    // ------------------ INIT --------------------
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0x222222, 1);
    renderer.setSize(canvasWidth, canvasHeight);

    document.getElementById("canvas").appendChild(renderer.domElement);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, canvasWidth / canvasHeight, 0.1, 1e5);
    camera.position.set(100, 80, 100);
    camera.lookAt(scene.position);
    scene.add(camera);

    controls = new THREE.OrbitControls(camera, renderer.domElement);

    // ------------------ LIGHT --------------------

    const light = new THREE.PointLight(0xffbb99, 2, 500, 1);
    light.position.set(0, 15, 0);
    light.castShadow = true;
    scene.add(light);

    // ------------------ GROUND -------------------

    const groundTexture = new THREE.TextureLoader().load('textures/ground_texture.jpg');
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(5, 5);

    const groundBump = new THREE.TextureLoader().load('textures/ground_normal.jpg');
    groundBump.wrapS = THREE.RepeatWrapping;
    groundBump.wrapT = THREE.RepeatWrapping;
    groundBump.repeat.set(5, 5);

    const groundMaterial = new THREE.MeshPhongMaterial();
    groundMaterial.side = THREE.BackSide;
    groundMaterial.map = groundTexture;
    groundMaterial.normalMap = groundBump;

    const groundGeometry = new THREE.PlaneGeometry(150, 150);
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // ------------------ SKYBOX -------------------

    const materialArray = [];
    materialArray.push(new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('textures/night_skybox_right.png') }));
    materialArray.push(new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('textures/night_skybox_left.png') }));
    materialArray.push(new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('textures/night_skybox_top.png') }));
    materialArray.push(new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('textures/night_skybox_bottom.png') }));
    materialArray.push(new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('textures/night_skybox_front.png') }));
    materialArray.push(new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('textures/night_skybox_back.png') }));
    materialArray.forEach(e => e.side = THREE.BackSide);

    const skyboxMaterial = new THREE.MeshFaceMaterial(materialArray);
    const skyboxGeometry = new THREE.BoxGeometry(5000, 5000, 5000, 64, 64, 64);
    const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
    scene.add(skybox);

    // ------------------ SNOW -------------------

    const snowTexture = new THREE.TextureLoader().load('textures/snow.png');
    const snowMaterial = new THREE.PointsMaterial({ map: snowTexture, transparent: true });
    const snowGeometry = new THREE.BufferGeometry();
    snowGeometry.setAttribute('position', new THREE.BufferAttribute(snowPointsArray, 3));
    snow = new THREE.Points(snowGeometry, snowMaterial);

    let index = 0;
    for (let i = 0; i < maxSnowPoints; i++) {
        snowPointsArray[index++] = (Math.random() - 0.5) * 300;
        snowPointsArray[index++] = (Math.random() - 0.1) * 100;
        snowPointsArray[index++] = (Math.random() - 0.5) * 300;
    }

    scene.add(snow);

    // ------------------ FIRE -------------------

    const fireMaterial = new THREE.PointsMaterial({ vertexColors: true });
    const fireGeometry = new THREE.BufferGeometry();
    fireGeometry.setAttribute('position', new THREE.BufferAttribute(firePointsArray, 3));
    fireGeometry.setAttribute('color', new THREE.BufferAttribute(fireColorsArray, 3));
    fire = new THREE.Points(fireGeometry, fireMaterial);

    for (let i = 0; i < maxFirePoints; i++)
        createFireParticle(i);

    scene.add(fire);

    mainFirePoint = new THREE.Vector3(0, 20, 0);
}

function animate() {
    requestAnimationFrame(animate);

    if (move) {
        // Camera rotation
        camera.position.set(Math.sin(cameraPhi) * cameraR, cameraY, Math.cos(cameraPhi) * cameraR);

        cameraPhi += delta;
        t += delta;

        for (let i = 0; i < maxSnowPoints; i++) {
            // Falling snow
            snowPointsArray[3 * i + 1] -= 0.2;

            // If snow is below ground, move it to the "sky"
            if (snowPointsArray[3 * i + 1] <= -10)
                snowPointsArray[3 * i + 1] = 90;
        }

        snow.geometry.attributes.position.needsUpdate = true;

        // Main fire point movement
        mainFirePoint.x = Math.sin(30 * t) * 4; 
        mainFirePoint.y = Math.cos(-50 * t) * 3 + Math.sin(60 * t) * 3 + 20; 
        mainFirePoint.z = Math.sin(50 * t) * 3; 

        let index = 0;
        for (let i = 0; i < maxFirePoints; i++) {
            // Fire particles animation
            firePointsArray[index] += fireVectorsArray[index++];
            firePointsArray[index] += fireVectorsArray[index++];
            firePointsArray[index] += fireVectorsArray[index++];

            // Calculate new properties of particle
            calculateFireParticleVector(i);
            calculateFireParticleColor(i);
            fireLifetimeArray[i] -= delta;

            // If fire particle lifetime is end, generate new particle
            if (fireLifetimeArray[i] <= 0)
                createFireParticle(i);
        }

        fire.geometry.attributes.position.needsUpdate = true;
        fire.geometry.attributes.color.needsUpdate = true;
    }

    controls.update();
    renderer.render(scene, camera);
}

// New particle with random position, speed and lifetime
function createFireParticle(index) {
    fireLifetimeArray[index] = Math.random() * 0.1;
    fireSpeedArray[index] = Math.random() * 0.5;

    index *= 3;

    let phi = 2 * Math.random() * Math.PI;
    let r = Math.random() * 10;

    firePointsArray[index++] = Math.cos(phi) * r;
    firePointsArray[index++] = 0;
    firePointsArray[index++] = Math.sin(phi) * r;
}

// Calculate the direction of a particle
function calculateFireParticleVector(index) {
    let speed = fireSpeedArray[index];
    let i = index * 3;

    let x = mainFirePoint.x - firePointsArray[i++];
    let y = mainFirePoint.y - firePointsArray[i++];
    let z = mainFirePoint.z - firePointsArray[i++];

    let len = Math.sqrt(x * x + y * y + z * z);

    // Slow down particles that are close to main point
    // in order to prevent creating "fire ball" at that point
    if (len < 5) len *= 10; 

    i = index * 3;
    fireVectorsArray[i++] = speed * x / len;
    // +0.3 is an additional vector to make particles move up
    fireVectorsArray[i++] = speed * y / len + 0.3;
    fireVectorsArray[i++] = speed * z / len;
}

// Calculate color depending on the position of a particle
function calculateFireParticleColor(index) {
    let i = index * 3;
    let x = mainFirePoint.x - firePointsArray[i++];
    let y = mainFirePoint.y - firePointsArray[i++];
    let z = mainFirePoint.z - firePointsArray[i++];

    let dist1 = Math.sqrt(x * x + y * y + z * z);  // distance from the main point
    let dist2 = firePointsArray[index * 3 + 1];    // distance from the ground
    let dist3 = Math.sqrt(x * x + z * z);          // distance from the main point's y axis

    // the smaller that distances are, the more yellow particle is
    i = index * 3;
    fireColorsArray[i++] = 1;
    fireColorsArray[i++] = Math.min(0.9, 
        Math.max(0.3, 1 - dist1 / mainFirePoint.y, 1 - dist2 / 7, 1 - dist3 / 7)
    );
    fireColorsArray[i++] = 0.2;
}

document.addEventListener('mousedown', onMouseDown, false);
document.addEventListener('mouseup', onMouseUp, false);

// Stop animation on mouse click
function onMouseDown(event) {
    move = false;
}

// Resume animation from the same place
function onMouseUp(event) {
    let x = camera.position.x;
    let z = camera.position.z;
    let r = Math.sqrt(x * x + z * z);
    
    cameraR = r;
    cameraY = camera.position.y;

    if (z < 0)
        cameraPhi = Math.atan(x / z) + Math.PI;
    else
        cameraPhi = Math.atan(x / z);

    move = true;
}