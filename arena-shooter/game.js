(function () {
  'use strict';

  const ARENA_SIZE = 44;
  const WALL_HEIGHT = 6;
  const MOVE_SPEED = 0.18;
  const ROTATE_SPEED = 0.06;
  const PLAYER_HEIGHT = 1.6;
  const PLAYER_RADIUS = 0.4;
  const ENEMY_SPEED = 0.08;
  const ENEMY_RADIUS = 0.72;
  const ENEMY_SCALE = 1.6;
  const ENEMY_ACCURACY = 0.5;
  const COLUMN_POSITIONS = [
    [-12, -10], [0, -14], [12, -10],
    [-14, 0], [14, 0],
    [-12, 10], [0, 14], [12, 10],
    [-8, -6], [8, -6], [-8, 6], [8, 6]
  ];
  const COLUMN_SIZE = 1.8;
  const RADAR_SIZE = 140;
  const SHOOT_COOLDOWN = 400;
  const ENEMY_SHOOT_COOLDOWN = 800;
  const DAMAGE = 25;
  const ENEMY_DAMAGE = 15;

  const TRACER_DURATION_MS = 120;
  const TRACER_LENGTH = 20;

  let scene, viewmodelScene, camera, renderer, clock;
  let keys = {};
  let playerYaw = 0;
  let playerPitch = 0;
  let lastShoot = 0;
  let playerHealth = 100;
  let enemyHealth = 100;
  let gameOver = false;
  let tracers = [];

  const player = { position: new THREE.Vector3(0, PLAYER_HEIGHT, 0), yaw: 0, pitch: 0, gun: null };
  const enemy = {
    position: new THREE.Vector3(16, 0, 16),
    yaw: 0,
    mesh: null,
    gun: null,
    lastShoot: 0,
    lastDecision: 0,
    moveDir: new THREE.Vector3(0, 0, 0)
  };

  const walls = [];
  const raycaster = new THREE.Raycaster();
  let audioCtx = null;

  function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  function playShoot() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, audioCtx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.07);
  }

  function playHitEnemy() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.13);
  }

  function playHitPlayer() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.16);
  }

  function playWin() {
    if (!audioCtx) return;
    [523.25, 659.25, 783.99].forEach(function (freq, i) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.08 + 0.2);
      osc.start(audioCtx.currentTime + i * 0.08);
      osc.stop(audioCtx.currentTime + i * 0.08 + 0.22);
    });
  }

  function playGameOver() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(110, audioCtx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.5);
  }

  const GUN_RECOIL_DURATION = 0.12;
  const GUN_MUZZLE_FLASH_DURATION = 0.06;

  function createPlayerRaygun() {
    const root = new THREE.Group();
    const recoilGroup = new THREE.Group();
    root.add(recoilGroup);
    root.userData.recoilGroup = recoilGroup;
    root.userData.recoilStart = 0;

    const darkMetal = new THREE.MeshStandardMaterial({
      color: 0x1a1a22,
      roughness: 0.35,
      metalness: 0.85
    });
    const cyanMetal = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      roughness: 0.25,
      metalness: 0.7,
      emissive: 0x003344
    });
    const cyanHot = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      roughness: 0.1,
      metalness: 0.5,
      emissive: 0x00aacc,
      emissiveIntensity: 0.6
    });

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xe8b88a,
      roughness: 0.85,
      metalness: 0.05
    });
    const handGroup = new THREE.Group();
    handGroup.position.set(0.02, -0.07, 0.03);
    handGroup.rotation.set(0.12, 0, -0.06);
    const palm = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.09, 0.038),
      skinMat
    );
    palm.position.set(0.02, 0.01, 0.025);
    palm.rotation.z = 0.12;
    handGroup.add(palm);
    const fingers = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.07, 0.028),
      skinMat
    );
    fingers.position.set(0.04, -0.02, 0.045);
    fingers.rotation.z = 0.3;
    handGroup.add(fingers);
    const thumb = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, 0.038, 0.022),
      skinMat
    );
    thumb.position.set(-0.018, 0.025, 0.035);
    thumb.rotation.z = -0.45;
    handGroup.add(thumb);
    const wrist = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.028, 0.1, 8),
      skinMat
    );
    wrist.rotation.x = Math.PI / 2;
    wrist.rotation.z = 0.08;
    wrist.position.set(-0.02, -0.035, -0.035);
    handGroup.add(wrist);
    const forearm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.022, 0.12, 8),
      skinMat
    );
    forearm.rotation.x = Math.PI / 2;
    forearm.rotation.z = 0.06;
    forearm.position.set(-0.028, -0.07, -0.09);
    handGroup.add(forearm);
    recoilGroup.add(handGroup);

    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.2, 0.08),
      darkMetal
    );
    grip.position.set(0, -0.06, 0.04);
    recoilGroup.add(grip);
    const gripDetail = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.14, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x2d2d35, roughness: 0.5, metalness: 0.6 })
    );
    gripDetail.position.set(0, -0.06, 0.08);
    recoilGroup.add(gripDetail);

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.08, 0.28),
      darkMetal
    );
    body.position.set(0, 0.02, 0.18);
    recoilGroup.add(body);
    const core = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.04, 0.24),
      cyanHot
    );
    core.position.set(0, 0.02, 0.18);
    recoilGroup.add(core);

    const ventL = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.03, 0.2),
      cyanMetal
    );
    ventL.position.set(-0.055, 0.02, 0.18);
    recoilGroup.add(ventL);
    const ventR = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.03, 0.2),
      cyanMetal
    );
    ventR.position.set(0.055, 0.02, 0.18);
    recoilGroup.add(ventR);

    const topRail = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.015, 0.22),
      darkMetal
    );
    topRail.position.set(0, 0.055, 0.18);
    recoilGroup.add(topRail);
    const holoBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.038, 0.02, 0.055),
      darkMetal
    );
    holoBase.position.set(0, 0.065, 0.27);
    recoilGroup.add(holoBase);
    const holoGlass = new THREE.Mesh(
      new THREE.BoxGeometry(0.032, 0.035, 0.006),
      new THREE.MeshStandardMaterial({
        color: 0x00e5ff,
        roughness: 0.1,
        metalness: 0.1,
        transparent: true,
        opacity: 0.6,
        emissive: 0x0088aa,
        emissiveIntensity: 0.8
      })
    );
    holoGlass.position.set(0, 0.085, 0.29);
    recoilGroup.add(holoGlass);

    const barrelBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.05, 0.1, 6),
      darkMetal
    );
    barrelBase.rotation.x = Math.PI / 2;
    barrelBase.position.set(0, 0.02, 0.35);
    recoilGroup.add(barrelBase);
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.04, 0.22, 8),
      cyanMetal
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.02, 0.48);
    recoilGroup.add(barrel);
    const barrelRing1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.02, 8),
      cyanHot
    );
    barrelRing1.rotation.x = Math.PI / 2;
    barrelRing1.position.set(0, 0.02, 0.38);
    recoilGroup.add(barrelRing1);
    const barrelRing2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.02, 8),
      cyanHot
    );
    barrelRing2.rotation.x = Math.PI / 2;
    barrelRing2.position.set(0, 0.02, 0.58);
    recoilGroup.add(barrelRing2);

    const muzzleFlash = new THREE.Mesh(
      new THREE.CylinderGeometry(0.001, 0.04, 0.06, 8),
      new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.95
      })
    );
    muzzleFlash.rotation.x = Math.PI / 2;
    muzzleFlash.position.set(0, 0.02, 0.61);
    muzzleFlash.visible = false;
    recoilGroup.add(muzzleFlash);
    root.userData.muzzleFlash = muzzleFlash;

    const barrelTip = new THREE.Object3D();
    barrelTip.position.set(0, 0.02, 0.62);
    recoilGroup.add(barrelTip);
    root.userData.barrelTip = barrelTip;

    return root;
  }

  function createRaygun(isPlayer) {
    const group = new THREE.Group();
    const bodyColor = isPlayer ? 0x4dd0e1 : 0xffb74d;
    const accentColor = isPlayer ? 0x00acc1 : 0xff9800;
    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.12, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x546e7a, roughness: 0.5 })
    );
    grip.position.set(0, 0, 0.02);
    group.add(grip);
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.06, 0.2),
      new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.4, metalness: 0.3 })
    );
    body.position.set(0, 0.02, 0.08);
    group.add(body);
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.025, 0.18, 8),
      new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.3, metalness: 0.5 })
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.02, 0.2);
    group.add(barrel);
    const barrelTip = new THREE.Object3D();
    barrelTip.position.set(0, 0.02, 0.3);
    group.add(barrelTip);
    group.userData.barrelTip = barrelTip;
    return group;
  }

  function updatePlayerGunAnimation() {
    if (!player.gun || !player.gun.userData.recoilStart) return;
    const elapsed = performance.now() / 1000 - player.gun.userData.recoilStart;
    const recoilGroup = player.gun.userData.recoilGroup;
    const muzzleFlash = player.gun.userData.muzzleFlash;
    if (elapsed >= GUN_RECOIL_DURATION) {
      recoilGroup.position.z = 0;
      muzzleFlash.visible = false;
      player.gun.userData.recoilStart = 0;
      return;
    }
    const t = elapsed / GUN_RECOIL_DURATION;
    const recoilBack = 0.04;
    if (t < 0.25) {
      const u = t / 0.25;
      recoilGroup.position.z = -u * recoilBack;
    } else {
      const u = (t - 0.25) / 0.75;
      const easeOut = 1 - Math.pow(1 - u, 2);
      recoilGroup.position.z = -recoilBack + easeOut * recoilBack;
    }
    if (elapsed < GUN_MUZZLE_FLASH_DURATION) {
      const flashT = elapsed / GUN_MUZZLE_FLASH_DURATION;
      muzzleFlash.visible = true;
      muzzleFlash.scale.set(1 + flashT * 0.6, 1 + flashT * 0.6, 1);
      muzzleFlash.material.opacity = 0.95 * (1 - flashT * 0.8);
    } else {
      muzzleFlash.visible = false;
      muzzleFlash.scale.set(1, 1, 1);
    }
  }

  function addTracer(origin, dir, isPlayer) {
    const end = origin.clone().add(dir.clone().multiplyScalar(TRACER_LENGTH));
    const points = [origin.clone(), end];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const color = isPlayer ? 0x00ccff : 0xff6600;
    const mat = new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
    const line = new THREE.Line(geo, mat);
    scene.add(line);
    tracers.push({ mesh: line, birthTime: performance.now() });
  }

  function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xc5d8eb);
    scene.fog = new THREE.Fog(0xc5d8eb, 35, 75);

    viewmodelScene = new THREE.Scene();
    viewmodelScene.background = null;
    viewmodelScene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const vmDir = new THREE.DirectionalLight(0xfffaf0, 1.0);
    vmDir.position.set(2, 3, 2);
    viewmodelScene.add(vmDir);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 100);
    camera.position.set(0, PLAYER_HEIGHT, 0);

    const container = document.getElementById('canvas-container');
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    clock = new THREE.Clock();

    addLights();
    buildArena();
    createEnemy();
    setupPlayerGun();
    setupControls();
    window.addEventListener('resize', onResize);
    animate();
  }

  function addLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xfffaf0, 1.0);
    dir.position.set(12, 22, 10);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    dir.shadow.camera.near = 0.5;
    dir.shadow.camera.far = 60;
    dir.shadow.camera.left = -30;
    dir.shadow.camera.right = 30;
    dir.shadow.camera.top = 30;
    dir.shadow.camera.bottom = -30;
    scene.add(dir);
    const fill = new THREE.DirectionalLight(0xe3f2fd, 0.4);
    fill.position.set(-8, 10, -5);
    scene.add(fill);
  }

  function buildArena() {
    const half = ARENA_SIZE / 2;
    const floorGeo = new THREE.PlaneGeometry(ARENA_SIZE + 2, ARENA_SIZE + 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xe8e0d5,
      roughness: 0.9,
      metalness: 0.05
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const gridTex = new THREE.CanvasTexture(createGridCanvas());
    gridTex.wrapS = gridTex.wrapT = THREE.RepeatWrapping;
    gridTex.repeat.set(ARENA_SIZE / 2, ARENA_SIZE / 2);
    const gridMat = new THREE.MeshStandardMaterial({
      color: 0xdfd5c8,
      roughness: 0.85,
      metalness: 0.02,
      map: gridTex
    });
    const gridFloor = new THREE.Mesh(floorGeo.clone(), gridMat);
    gridFloor.rotation.x = -Math.PI / 2;
    gridFloor.receiveShadow = true;
    scene.add(gridFloor);

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xd4c4b0,
      roughness: 0.8,
      metalness: 0.05
    });

    const wallGeos = {
      front: new THREE.BoxGeometry(ARENA_SIZE + 2, WALL_HEIGHT, 1),
      side: new THREE.BoxGeometry(1, WALL_HEIGHT, ARENA_SIZE + 2)
    };

    const frontWall1 = new THREE.Mesh(wallGeos.front, wallMat);
    frontWall1.position.set(0, WALL_HEIGHT / 2, -half - 0.5);
    frontWall1.castShadow = true;
    frontWall1.receiveShadow = true;
    scene.add(frontWall1);
    walls.push(frontWall1);

    const frontWall2 = new THREE.Mesh(wallGeos.front, wallMat);
    frontWall2.position.set(0, WALL_HEIGHT / 2, half + 0.5);
    scene.add(frontWall2);
    walls.push(frontWall2);

    const sideWall1 = new THREE.Mesh(wallGeos.side, wallMat);
    sideWall1.position.set(-half - 0.5, WALL_HEIGHT / 2, 0);
    scene.add(sideWall1);
    walls.push(sideWall1);

    const sideWall2 = new THREE.Mesh(wallGeos.side, wallMat);
    sideWall2.position.set(half + 0.5, WALL_HEIGHT / 2, 0);
    scene.add(sideWall2);
    walls.push(sideWall2);

    const pillarMat = new THREE.MeshStandardMaterial({ color: 0xb8a99a, roughness: 0.7 });
    COLUMN_POSITIONS.forEach(function (pos) {
      const pillar = new THREE.Mesh(
        new THREE.BoxGeometry(COLUMN_SIZE, WALL_HEIGHT, COLUMN_SIZE),
        pillarMat
      );
      pillar.position.set(pos[0], WALL_HEIGHT / 2, pos[1]);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      scene.add(pillar);
      walls.push(pillar);
    });
  }

  function createGridCanvas() {
    const s = 128;
    const c = document.createElement('canvas');
    c.width = s;
    c.height = s;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#e8e0d5';
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = 'rgba(160, 150, 140, 0.35)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= s; i += 16) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, s);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(s, i);
      ctx.stroke();
    }
    return c;
  }

  function createEnemy() {
    const root = new THREE.Group();
    root.position.copy(enemy.position);
    root.scale.set(ENEMY_SCALE, ENEMY_SCALE, ENEMY_SCALE);

    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 16, 12),
      new THREE.MeshStandardMaterial({ color: 0xfdd835, roughness: 0.6 })
    );
    body.position.y = 0.45;
    body.castShadow = true;
    root.add(body);

    const belly = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xfff9c4, roughness: 0.7 })
    );
    belly.position.y = 0.33;
    belly.rotation.x = Math.PI / 2;
    root.add(belly);

    const eyeWhiteL = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 12, 8),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
    );
    eyeWhiteL.position.set(-0.15, 0.57, 0.38);
    root.add(eyeWhiteL);
    const eyeWhiteR = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 12, 8),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
    );
    eyeWhiteR.position.set(0.15, 0.57, 0.38);
    root.add(eyeWhiteR);

    const pupilL = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.1 })
    );
    pupilL.position.set(-0.15, 0.57, 0.48);
    root.add(pupilL);
    const pupilR = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.1 })
    );
    pupilR.position.set(0.15, 0.57, 0.48);
    root.add(pupilR);

    const cheekL = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xffab91, roughness: 0.8 })
    );
    cheekL.position.set(-0.32, 0.45, 0.35);
    root.add(cheekL);
    const cheekR = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xffab91, roughness: 0.8 })
    );
    cheekR.position.set(0.32, 0.45, 0.35);
    root.add(cheekR);

    const earL = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xfdd835, roughness: 0.6 })
    );
    earL.position.set(-0.35, 0.9, 0);
    earL.scale.set(0.6, 1.2, 0.5);
    root.add(earL);
    const earR = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xfdd835, roughness: 0.6 })
    );
    earR.position.set(0.35, 0.9, 0);
    earR.scale.set(0.6, 1.2, 0.5);
    root.add(earR);

    const tail = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xf9a825, roughness: 0.6 })
    );
    tail.position.set(0, 0.3, -0.55);
    tail.scale.set(0.8, 1, 1.5);
    root.add(tail);

    const raygun = createRaygun(false);
    raygun.position.set(0.25, 0.4, 0.5);
    raygun.rotation.y = -Math.PI / 2;
    raygun.rotation.z = 0.1;
    root.add(raygun);
    enemy.gun = raygun;

    enemy.mesh = root;
    scene.add(enemy.mesh);
  }

  const GUN_VIEW_OFFSET = new THREE.Vector3(0.14, -0.12, -0.35);
  const GUN_VIEW_ROTATION = new THREE.Euler(0.12, 0.08, -0.05, 'YXZ');
  const GUN_VIEW_SCALE = 1.7;

  function setViewmodelMaterialProps(obj) {
    obj.traverse(function (child) {
      if (child.material) {
        child.material.depthTest = false;
        child.material.depthWrite = false;
      }
    });
  }

  function setupPlayerGun() {
    const raygun = createPlayerRaygun();
    raygun.scale.set(GUN_VIEW_SCALE, GUN_VIEW_SCALE, GUN_VIEW_SCALE);
    raygun.renderOrder = 9999;
    setViewmodelMaterialProps(raygun);
    viewmodelScene.add(raygun);
    player.gun = raygun;
  }

  function updatePlayerGunView() {
    if (!player.gun) return;
    const cam = camera;
    player.gun.position.copy(cam.position);
    player.gun.quaternion.copy(cam.getWorldQuaternion(new THREE.Quaternion()));
    player.gun.translateX(GUN_VIEW_OFFSET.x);
    player.gun.translateY(GUN_VIEW_OFFSET.y);
    player.gun.translateZ(GUN_VIEW_OFFSET.z);
    player.gun.rotateX(GUN_VIEW_ROTATION.x);
    player.gun.rotateY(GUN_VIEW_ROTATION.y);
    player.gun.rotateZ(GUN_VIEW_ROTATION.z);
    player.gun.updateMatrixWorld(true);
  }

  function setupControls() {
    function ensureAudio() {
      initAudio();
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    }
    document.addEventListener('keydown', function (e) {
      ensureAudio();
      keys[e.code] = true;
      if (e.code === 'Space') e.preventDefault();
    });
    document.addEventListener('keyup', function (e) {
      keys[e.code] = false;
    });
    document.addEventListener('click', ensureAudio);
    document.addEventListener('contextmenu', function (e) {
      e.preventDefault();
    });
  }

  function updatePlayer(dt) {
    if (gameOver) return;
    if (keys['ArrowLeft']) {
      playerYaw += ROTATE_SPEED;
    }
    if (keys['ArrowRight']) {
      playerYaw -= ROTATE_SPEED;
    }

    let dx = 0, dz = 0;
    if (keys['ArrowUp']) {
      dx -= Math.sin(playerYaw);
      dz -= Math.cos(playerYaw);
    }
    if (keys['ArrowDown']) {
      dx += Math.sin(playerYaw);
      dz += Math.cos(playerYaw);
    }
    if (dx !== 0 || dz !== 0) {
      const len = Math.sqrt(dx * dx + dz * dz);
      dx = (dx / len) * MOVE_SPEED;
      dz = (dz / len) * MOVE_SPEED;
      const next = player.position.clone().add(new THREE.Vector3(dx, 0, dz));
      if (!collidesWithWalls(next, PLAYER_RADIUS) && !collidesWithEnemy(next, PLAYER_RADIUS)) {
        player.position.x = next.x;
        player.position.z = next.z;
      }
    }

    if (keys['Space']) {
      const now = performance.now();
      if (now - lastShoot >= SHOOT_COOLDOWN) {
        lastShoot = now;
        shootPlayer();
      }
    }

    camera.position.copy(player.position);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = playerYaw;
    camera.rotation.x = playerPitch;
    updatePlayerGunAnimation();
    updatePlayerGunView();
  }

  function collidesWithWalls(pos, radius) {
    const box = new THREE.Box3(
      new THREE.Vector3(pos.x - radius, pos.y - 0.1, pos.z - radius),
      new THREE.Vector3(pos.x + radius, pos.y + 0.1, pos.z + radius)
    );
    for (let i = 0; i < walls.length; i++) {
      const w = walls[i];
      w.geometry.computeBoundingBox();
      const wBox = w.geometry.boundingBox.clone();
      wBox.applyMatrix4(w.matrixWorld);
      if (box.intersectsBox(wBox)) return true;
    }
    const half = ARENA_SIZE / 2;
    if (Math.abs(pos.x) > half - radius || Math.abs(pos.z) > half - radius) return true;
    return false;
  }

  function collidesWithEnemy(pos, radius) {
    const dist = Math.sqrt(
      (pos.x - enemy.position.x) ** 2 +
      (pos.z - enemy.position.z) ** 2
    );
    return dist < radius + ENEMY_RADIUS;
  }

  function getPlayerGunOrigin() {
    const tip = player.gun.userData.barrelTip;
    const v = new THREE.Vector3();
    tip.getWorldPosition(v);
    return v;
  }

  function getPlayerGunDirection() {
    return new THREE.Vector3(0, 0, -1).applyQuaternion(camera.getWorldQuaternion(new THREE.Quaternion()));
  }

  function shootPlayer() {
    playShoot();
    if (player.gun && player.gun.userData) {
      player.gun.userData.recoilStart = performance.now() / 1000;
    }
    const origin = getPlayerGunOrigin();
    const dir = getPlayerGunDirection();
    addTracer(origin, dir, true);
    raycaster.set(origin, dir);
    if (enemy.mesh) {
      enemy.mesh.updateMatrixWorld(true);
      const hit = raycaster.intersectObject(enemy.mesh, true);
      if (hit.length > 0) {
        enemyHealth = Math.max(0, enemyHealth - DAMAGE);
        updateEnemyHealthUI();
        playHitEnemy();
        if (enemyHealth <= 0) {
          gameOver = true;
          document.getElementById('you-win').classList.add('show');
          playWin();
        }
      }
    }
  }

  function updateEnemy(dt) {
    if (gameOver || enemyHealth <= 0) return;
    const now = performance.now();
    if (now - enemy.lastDecision > 500) {
      enemy.lastDecision = now;
      const toPlayer = new THREE.Vector3(
        player.position.x - enemy.position.x,
        0,
        player.position.z - enemy.position.z
      );
      const dist = toPlayer.length();
      toPlayer.normalize();
      const side = new THREE.Vector3(-toPlayer.z, 0, toPlayer.x);
      if (Math.random() > 0.5) side.negate();
      enemy.moveDir.copy(toPlayer).multiplyScalar(0.6).add(side.multiplyScalar(0.4)).normalize();
    }
    const move = enemy.moveDir.clone().multiplyScalar(ENEMY_SPEED);
    const next = enemy.position.clone().add(move);
    if (!collidesWithWalls(next, ENEMY_RADIUS)) {
      const toPlayer = new THREE.Vector3(player.position.x - next.x, 0, player.position.z - next.z);
          if (toPlayer.length() > PLAYER_RADIUS + ENEMY_RADIUS + 0.2) {
        enemy.position.x = next.x;
        enemy.position.z = next.z;
      }
    }
    enemy.mesh.position.copy(enemy.position);
    const lookAt = new THREE.Vector3(player.position.x, enemy.position.y + 0.45, player.position.z);
    enemy.mesh.lookAt(lookAt);
    enemy.yaw = Math.atan2(
      lookAt.x - enemy.position.x,
      lookAt.z - enemy.position.z
    );

    if (now - enemy.lastShoot >= ENEMY_SHOOT_COOLDOWN) {
      if (canEnemySeePlayer()) {
        enemy.lastShoot = now;
        shootEnemy();
      }
    }
  }

  function getEnemyGunOriginAndDir() {
    const tip = enemy.gun.userData.barrelTip;
    const origin = new THREE.Vector3();
    tip.getWorldPosition(origin);
    const dir = new THREE.Vector3(
      player.position.x - origin.x,
      player.position.y - origin.y,
      player.position.z - origin.z
    ).normalize();
    return { origin: origin, dir: dir };
  }

  function canEnemySeePlayer() {
    const o = getEnemyGunOriginAndDir();
    raycaster.set(o.origin, o.dir);
    const hit = raycaster.intersectObjects(walls, true);
    const distToPlayer = o.origin.distanceTo(player.position);
    if (hit.length === 0) return true;
    return hit[0].distance > distToPlayer - 0.3;
  }

  function shootEnemy() {
    const o = getEnemyGunOriginAndDir();
    addTracer(o.origin, o.dir, false);
    raycaster.set(o.origin, o.dir);
    const wallHits = raycaster.intersectObjects(walls, true);
    const distToPlayer = o.origin.distanceTo(player.position);
    const blocked = wallHits.some(function (h) {
      return h.distance < distToPlayer - 0.3;
    });
    if (!blocked && Math.random() < ENEMY_ACCURACY) {
      playerHealth = Math.max(0, playerHealth - ENEMY_DAMAGE);
      document.getElementById('health-fill').style.width = playerHealth + '%';
      playHitPlayer();
      if (playerHealth <= 0) {
        gameOver = true;
        document.getElementById('game-over').classList.add('show');
        playGameOver();
      }
    }
  }

  function updateEnemyHealthUI() {
    const el = document.getElementById('enemy-hp-text');
    if (el) el.textContent = Math.max(0, enemyHealth);
  }

  function updateRadar() {
    const canvas = document.getElementById('radar-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const half = ARENA_SIZE / 2;
    const scale = RADAR_SIZE / ARENA_SIZE;
    const dirLen = 10;
    ctx.fillStyle = 'rgba(220, 230, 240, 0.85)';
    ctx.fillRect(0, 0, RADAR_SIZE, RADAR_SIZE);
    ctx.strokeStyle = 'rgba(92, 158, 173, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, RADAR_SIZE - 2, RADAR_SIZE - 2);
    COLUMN_POSITIONS.forEach(function (pos) {
      const px = (pos[0] + half) * scale;
      const pz = (pos[1] + half) * scale;
      const s = (COLUMN_SIZE / ARENA_SIZE) * RADAR_SIZE;
      ctx.fillStyle = 'rgba(184, 169, 154, 0.9)';
      ctx.fillRect(px - s / 2, pz - s / 2, s, s);
    });
    const playerX = (player.position.x + half) * scale;
    const playerZ = (player.position.z + half) * scale;
    ctx.fillStyle = '#00acc1';
    ctx.beginPath();
    ctx.arc(playerX, playerZ, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#006064';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    const pDirX = -Math.sin(playerYaw);
    const pDirZ = -Math.cos(playerYaw);
    ctx.strokeStyle = '#004d40';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playerX, playerZ);
    ctx.lineTo(playerX + pDirX * dirLen, playerZ + pDirZ * dirLen);
    ctx.stroke();
    if (enemy.mesh && enemyHealth > 0) {
      const enemyX = (enemy.position.x + half) * scale;
      const enemyZ = (enemy.position.z + half) * scale;
      ctx.fillStyle = '#ff9800';
      ctx.beginPath();
      ctx.arc(enemyX, enemyZ, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e65100';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      const toPlayerX = player.position.x - enemy.position.x;
      const toPlayerZ = player.position.z - enemy.position.z;
      const mag = Math.hypot(toPlayerX, toPlayerZ) || 1;
      const eDirX = toPlayerX / mag;
      const eDirZ = toPlayerZ / mag;
      ctx.strokeStyle = '#bf360c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(enemyX, enemyZ);
      ctx.lineTo(enemyX + eDirX * dirLen, enemyZ + eDirZ * dirLen);
      ctx.stroke();
    }
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.1);
    const now = performance.now();
    while (tracers.length > 0 && now - tracers[0].birthTime > TRACER_DURATION_MS) {
      const t = tracers.shift();
      scene.remove(t.mesh);
      t.mesh.geometry.dispose();
      t.mesh.material.dispose();
    }
    updatePlayer(dt);
    updateEnemy(dt);
    updateRadar();
    updateEnemyHealthUI();
    renderer.autoClear = false;
    renderer.clear();
    renderer.clearDepth();
    renderer.render(scene, camera);
    renderer.clearDepth();
    renderer.render(viewmodelScene, camera);
    renderer.autoClear = true;
  }

  init();
})();
