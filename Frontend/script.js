// ===== DATABASE INIT =====
let db = JSON.parse(localStorage.getItem('sbi_formal_db')) || { 
    users: [], 
    audits: [] 
};

function persist() { 
    localStorage.setItem('sbi_formal_db', JSON.stringify(db)); 
}

// ===== PAGE NAVIGATION =====
const pages = {
    welcome: document.getElementById('pageWelcome'),
    auth: document.getElementById('pageAuthChoice'),
    register: document.getElementById('pageRegister'),
    verify1: document.getElementById('pageVerify1'),
    verify2: document.getElementById('pageVerify2')
};

function show(pageId) {
    Object.values(pages).forEach(p => p.classList.add('hidden-page'));
    pages[pageId].classList.remove('hidden-page');
}

// ===== NAVIGATION EVENT LISTENERS =====
document.getElementById('gotoAuthBtn').addEventListener('click', () => show('auth'));
document.getElementById('showRegisterBtn').addEventListener('click', () => show('register'));
document.getElementById('showSigninBtn').addEventListener('click', () => {
    setRandomQuestion();
    show('verify1');
});
document.getElementById('backFromReg').addEventListener('click', () => show('auth'));
document.getElementById('backFromV1').addEventListener('click', () => show('auth'));
document.getElementById('backFromV2').addEventListener('click', () => show('welcome'));

// ===== REGISTRATION =====
document.getElementById('registerUserBtn').addEventListener('click', () => {
    let name = document.getElementById('regName').value.trim();
    let aadhar = document.getElementById('regAadhar').value.trim();
    let dob = document.getElementById('regDob').value;
    let gender = document.getElementById('regGender').value;
    let mobile = document.getElementById('regMobile').value.trim();
    let email = document.getElementById('regEmail').value.trim();
    let pwd = document.getElementById('regPwd').value;

    if (!name || !aadhar || !dob || !mobile || !email || !pwd) {
        alert('Please fill all fields');
        return;
    }

    let strong = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!strong.test(pwd)) {
        alert('Password must be 8+ chars, with uppercase, number, and special character');
        return;
    }

    db.users.push({ name, aadhar, dob, gender, mobile, email, password: pwd });
    persist();
    alert('Registration successful');
    show('auth');
});

// ===== QUESTION BANK =====
const questionBank = [
    "What happens to ice in a hot pan?", "If you touch a hot stove what do you say?",
    "Can humans walk?", "Can you touch your hand?", "Can you bath?", "Can you sleep?",
    "Can you eat?", "Can you beat someone?", "Can you cook the food?", "Can you touch your hair?",
    "Can you eat mango?", "Can you put your phone on charger?", "Can you drink the water?",
    "You have the smart phone?", "Can you smile?", "Can you touch the laptop?", "Can drink the tea?",
    "At what time you sleep?", "Can you open the door?", "Can you see yourself in mirror?",
    "Can you eat pizza?", "Can you jump?", "Can you eat rice ?", "Do you wear the footwear?",
    "Do you have blood?", "Can you put your head down?", "Do you have eyes?", "Do you have tongue?",
    "Can you wash your hand?", "Can drink coffee?", "Can you open the bottle cap?",
    "Can you clap?", "Can you brush your teeth?", "Can you sit?", "Do you have lungs?",
    "Do you you have stomach?", "Can touch the table fan?", "Can you touch the car?",
    "Can you wash your face?", "Can you hug your mom?", "Can you put the bottle on the table?",
    "Can you swim?", "Can you drink water?", "Can you use mobile?", "Can you put the book on the table?",
    "Can you tap on the table?", "Do you have the nails?", "Do you have teeth?", "Can you dance?",
    "Can you bring the book?", "Can you hold the bag?", "Can you blink your eyes?",
    "Do you drill the wall?", "Do you wash your hair?", "Can you touch the mobile?",
    "Do you travel?", "Do you have shadow?", "Can you code in 3 seconds?", "Are you AI?",
    "Can you do repetitive tasks in few seconds ?", "Are you GEN AI?",
    "Are you hardware/software?", "Can you recall million of data without forgetting them?",
    "Can you work continuously without sleep, rest, or breaks?", "Do you use NLP?",
    "Do you have artificial neurons ?", "Are you made with algorithms?", "Can you use the bytecode?",
    "Are you the existence of software/hardware?", "Are you available for the 24/7?",
    "Can you read 100 pages in few seconds?", "Can you react in few milliseconds?",
    "Can you remember 100 numbers instantly?", "Can you create the visual art?",
    "Can you do image recognition?", "Can you do voice recognition?"
];

function setRandomQuestion() {
    let idx = Math.floor(Math.random() * questionBank.length);
    document.getElementById('questionDisplay').innerText = questionBank[idx];
}

// ===== BEHAVIORAL DATA COLLECTION =====
let mouseMoves = [];
let scrollEvents = [];
let voice = { pitch: 0, mod: 0, noise: 0 };
let typingStd = 45; // Default irregular

// Mouse tracking
let micBtn = document.getElementById('micButton');
micBtn.addEventListener('mousemove', (e) => {
    mouseMoves.push({ x: e.clientX, y: e.clientY, t: Date.now() });
    if (mouseMoves.length > 40) mouseMoves = mouseMoves.slice(-30);
});

// Scroll tracking
document.getElementById('micSensorZone').addEventListener('wheel', (e) => {
    scrollEvents.push({ delta: e.deltaY, time: Date.now() });
    if (scrollEvents.length > 20) scrollEvents.shift();
});

// Voice simulation
micBtn.addEventListener('click', function() {
    this.classList.add('active');
    voice = {
        pitch: 100 + Math.random() * 70,
        mod: 10 + Math.random() * 45,
        noise: 5 + Math.random() * 40
    };
    setTimeout(() => this.classList.remove('active'), 600);
});

// ===== STAGE 1 VERIFICATION =====
document.getElementById('submitV1').addEventListener('click', () => {
    let uid = document.getElementById('loginUid').value.trim();
    let pwd = document.getElementById('loginPwd').value;

    if (!uid || !pwd) {
        alert('User ID and password required');
        return;
    }

    // Calculate mouse jaggedness
    let mouseJag = 25;
    if (mouseMoves.length >= 4) {
        let dists = [];
        for (let i = 1; i < mouseMoves.length; i++) {
            let dx = mouseMoves[i].x - mouseMoves[i - 1].x;
            let dy = mouseMoves[i].y - mouseMoves[i - 1].y;
            dists.push(Math.sqrt(dx * dx + dy * dy));
        }
        let avgD = dists.reduce((a, b) => a + b, 0) / dists.length;
        let varD = dists.map(d => Math.pow(d - avgD, 2)).reduce((a, b) => a + b, 0) / dists.length;
        mouseJag = Math.sqrt(varD);
    }

    // Calculate scroll irregularity
    let scrollVal = scrollEvents.length ? 
        scrollEvents.map(s => Math.abs(s.delta)).reduce((a, b) => a + b, 0) / scrollEvents.length : 25;

    let pitch = voice.pitch || 140;
    let mod = voice.mod || 25;
    let noise = voice.noise || 20;

    // Decision: grant if irregular
    let grant = (noise > 12 || mod > 22 || mouseJag > 22 || typingStd > 40 || scrollVal > 25);

    // Store audit
    db.audits.push({ 
        stage1: uid, 
        typingStd, 
        mouseJag, 
        scrollVal, 
        pitch, 
        mod, 
        noise, 
        decision: grant ? 'grant' : 'deny' 
    });
    persist();

    if (grant) {
        alert('Access granted');
        show('welcome');
    } else {
        alert('Additional step required');
        let shapes = ['⬤', '⬛', '▲'];
        let randIdx = Math.floor(Math.random() * 3);
        document.getElementById('shapeDisplay').innerText = shapes[randIdx];
        document.getElementById('shapeDisplay').setAttribute('data-shape', 
            shapes[randIdx] === '⬤' ? 'circle' : shapes[randIdx] === '⬛' ? 'square' : 'triangle');
        show('verify2');
    }
});

// ===== CANVAS DRAWING =====
let canvas = document.getElementById('drawCanvas');
let ctx = canvas.getContext('2d');
ctx.lineWidth = 3;
ctx.strokeStyle = '#1e4a7a';
ctx.lineCap = 'round';

let drawing = false;

canvas.addEventListener('mousedown', (e) => {
    drawing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
});

canvas.addEventListener('mousemove', (e) => {
    if (drawing) {
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
    }
});

canvas.addEventListener('mouseup', () => drawing = false);
canvas.addEventListener('mouseleave', () => drawing = false);

document.getElementById('clearCanvas').addEventListener('click', () => {
    ctx.clearRect(0, 0, 340, 200);
});

// ===== STAGE 2 VERIFICATION =====
document.getElementById('submitShape').addEventListener('click', () => {
    let imgData = ctx.getImageData(0, 0, 340, 200).data;
    let drawn = 0;
    
    for (let i = 0; i < imgData.length; i += 4) {
        if (imgData[i] < 250) drawn++;
    }
    
    let accurate = (drawn > 800 && drawn < 10000);
    let finalAccess = accurate ? false : true; // accurate = deny

    db.audits.push({ stage2: true, drawn, accurate, finalAccess });
    persist();

    if (finalAccess) alert('Access granted');
    else alert('Access denied');
    
    show('welcome');
});

// ===== INITIAL SETUP =====
if (db.users.length === 0) {
    db.users.push({ 
        name: "Demo User", 
        aadhar: "123412341234", 
        dob: "1985-05-15", 
        gender: "Male", 
        mobile: "9988776655", 
        email: "demo@bank.com", 
        password: "Demo@123" 
    });
    persist();
}

// Start with welcome page
show('welcome');