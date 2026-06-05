// Game Core Variables
const player = {
    maxHp: 1200,
    hp: 1200,
    maxMp: 120,
    mp: 120,
    mpRegenRate: 0.20 
};

const enemy = {
    maxHp: 5000,
    hp: 5000,
    bleedStacks: 0,
    lethargyStacks: 0,
    lethargyTimer: null,
    bleedTimer: null,
    speed: 0.03, 
    attackInterval: 2500, 
    lastAttackTime: 0
};

// Execution Event Listeners upon DOM load
document.addEventListener("DOMContentLoaded", () => {
    const buttonAttack = document.getElementById('command-Attack');
    const buttonMagic = document.getElementById('command-Magic');
    const buttonItem = document.getElementById('command-Items');
    const buttonDash = document.getElementById('command-Dash');

    if(buttonAttack) buttonAttack.addEventListener('click', executeAttack);
    if(buttonMagic) buttonMagic.addEventListener('click', executeMagic);
    if(buttonItem) buttonItem.addEventListener('click', executeItem);

    // Start Main Periodic Systems
    setInterval(processPassiveRegen, 1000);
    setInterval(processBleedTick, 1000);
    
    // 3D Engine Frame Loop for Enemy AI Movement & Combat Tracking
    setInterval(processEnemyAI, 30); 

    updateUserInterface();
});

// --- Actions Engine Realization ---

function executeAttack() {
    if (enemy.hp <= 0) return;
    spawnVisualAsset('red-slash-line');

    const calculationDmg = evaluateAmplifiedDmg(200);
    damageEnemyEntity(calculationDmg);

    if (enemy.bleedStacks < 5) {
        enemy.bleedStacks++;
    }
        //refresh bleed Stacks on hit
        clearTimeout(enemy.bleedTimer);

        // Bleed duration, stacks are refreshed after each hit and the timer is reset.
        enemy.bleedTimer = setTimeout(() => {
        enemy.bleedStacks = 0;
        enemy.bleedTimer = null;
        updateUserInterface();
    }, 7000); // 7000ms = 7 seconds 
    
    updateUserInterface();
}

function executeMagic() {
    if (enemy.hp <= 0) return;
    if (player.mp < 40) return;

    player.mp -= 40;
    spawnVisualAsset('blue-magic-streak');
    damageEnemyEntity(400);

    if (enemy.lethargyStacks < 4) {
        enemy.lethargyStacks++;
    }

    clearTimeout(enemy.lethargyTimer);
    enemy.lethargyTimer = setTimeout(() => {
        enemy.lethargyStacks = 0;
        enemy.lethargyTimer = null;
        updateUserInterface();
    }, 15000);

    updateUserInterface();
}

function executeItem() {
    if (enemy.hp <= 0) return;
    const restorationValue = player.maxHp * 0.35;
    player.hp = Math.min(player.maxHp, player.hp + restorationValue);
    updateUserInterface();
}

// --- Enemy AI Behavior (3D Movement & Combat Loop) ---

function processEnemyAI() {
    if (enemy.hp <= 0) return;

    const darklingEl = document.getElementById('darkling-target');
    const cameraEl = document.getElementById('camera');
    
    if (!darklingEl || !cameraEl) return;

    const enemyPos = darklingEl.object3D.position;
    const playerPos = cameraEl.object3D.position;

    const dx = playerPos.x - enemyPos.x;
    const dz = playerPos.z - enemyPos.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance > 1.5) {
        enemyPos.x += (dx / distance) * enemy.speed;
        enemyPos.z += (dz / distance) * enemy.speed;
        
        darklingEl.object3D.lookAt(playerPos.x, enemyPos.y, playerPos.z);
    } else {
        const currentTime = Date.now();
        if (currentTime - enemy.lastAttackTime >= enemy.attackInterval) {
            executeEnemyAttack();
            enemy.lastAttackTime = currentTime;
        }
    }
}

function executeEnemyAttack() {
    if (player.hp <= 0) return;

    const isCrit = Math.random() < 0.35;
    const finalEnemyDmg = isCrit ? 50 : 25;

    player.hp = Math.max(0, player.hp - finalEnemyDmg);
    console.log(`Darkling hit you for ${finalEnemyDmg} damage! ${isCrit ? '(CRITICAL!)' : ''}`);
    
    updateUserInterface();

    if (player.hp <= 0) {
        console.log("Skill issue! You got yourself handded to you by a Darkling NPC.");
    }
}

// --- Engine Core Support Calculations ---

function evaluateAmplifiedDmg(baseDmg) {
    const amplificationFactor = 1 + (enemy.lethargyStacks * 0.15);
    return baseDmg * amplificationFactor;
}

function damageEnemyEntity(dmgValue) {
    enemy.hp = Math.max(0, enemy.hp - dmgValue);
    updateUserInterface();

    if (enemy.hp <= 0) {
        triggerVictoryState();
    }
}

function processPassiveRegen() {
    if (enemy.hp <= 0) return;
    const pointAccrual = player.maxMp * player.mpRegenRate;
    player.mp = Math.min(player.maxMp, player.mp + pointAccrual);
    updateUserInterface();
}

function processBleedTick() {
    if (enemy.hp <= 0 || enemy.bleedStacks === 0) return;

    let appliedBaseTickValue = enemy.bleedStacks < 5 ? enemy.bleedStacks * 50 : 200;
    const dynamicFinalTickValue = evaluateAmplifiedDmg(appliedBaseTickValue);
    damageEnemyEntity(dynamicFinalTickValue);
}

// --- UI Sync Engine ---

function spawnVisualAsset(vClassName) {
    const layerContainer = document.getElementById('effect-overlay');
    if (!layerContainer) return;

    const splashDiv = document.createElement('div');
    splashDiv.className = vClassName;
    layerContainer.appendChild(splashDiv);

    setTimeout(() => { splashDiv.remove(); }, 500);
}

function updateUserInterface() {
    const enemyHpBarElement = document.getElementById('enemy-hp-fill');
    const enemyHpTextElement = document.getElementById('enemy-hp-text');
    
    if (enemyHpBarElement && enemyHpTextElement) {
        const hpPercentValue = (enemy.hp / enemy.maxHp) * 100;
        enemyHpBarElement.style.width = `${hpPercentValue}%`;
        enemyHpTextElement.innerText = `${Math.round(enemy.hp)} / ${enemy.maxHp}`;
    }

    const playerHpLabel = document.getElementById('player-hp-text');
    const playerMpLabel = document.getElementById('player-mp-text');

    if (playerHpLabel) playerHpLabel.innerText = `HP: ${Math.round(player.hp)}`;
    if (playerMpLabel) playerMpLabel.innerText = `MP: ${Math.round(player.mp)}`;

    // Sync Custom Status Badges with Icon Graphics
    const bleedBadge = document.getElementById('status-bleed');
    const bleedCounter = document.getElementById('bleed-counter');
    const lethargyBadge = document.getElementById('status-lethargy');
    const lethargyCounter = document.getElementById('lethargy-counter');

    if (bleedBadge && bleedCounter) {
        if (enemy.bleedStacks > 0) {
            bleedBadge.classList.remove('hidden');
            bleedCounter.innerText = `x${enemy.bleedStacks}`;
        } else {
            bleedBadge.classList.add('hidden');
        }
    }

    if (lethargyBadge && lethargyCounter) {
        if (enemy.lethargyStacks > 0) {
            lethargyBadge.classList.remove('hidden');
            lethargyCounter.innerText = `x${enemy.lethargyStacks}`;
        } else {
            lethargyBadge.classList.add('hidden');
        }
    }
}

function triggerVictoryState() {
    const modalView = document.getElementById('victory-screen');
    if (modalView) modalView.classList.remove('hidden');
}