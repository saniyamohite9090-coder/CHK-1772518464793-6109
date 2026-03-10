const API_URL = 'http://localhost:5000/api';

// Page management
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

// Event listeners
document.getElementById('gotoAuthBtn').addEventListener('click', () => show('auth'));
document.getElementById('showRegisterBtn').addEventListener('click', () => show('register'));
document.getElementById('showSigninBtn').addEventListener('click', () => {
    setRandomQuestion();
    resetVoiceState();
    show('verify1');
});
document.getElementById('backFromReg').addEventListener('click', () => show('auth'));
document.getElementById('backFromV1').addEventListener('click', () => show('auth'));
document.getElementById('backFromV2').addEventListener('click', () => show('welcome'));

// Questions bank
const questionBank = [
    "What happens to ice in a hot pan?",
    "If you touch a hot stove what do you feel?",
    "Can humans walk?",
    "Can you drink water?",
    "Do you have eyes?",
    "Can you clap?",
    "Do you sleep at night?",
    "Can you eat food?",
    "Do you use a mobile phone?",
    "Can you smile?"
];

const correctAnswerMap = {
    "What happens to ice in a hot pan?": ["melts", "it melts", "melting", "turns to water"],
    "If you touch a hot stove what do you feel?": ["pain", "burn", "hot", "hurt"],
    "Can humans walk?": ["yes", "yes they can", "they can", "of course"],
    "Can you drink water?": ["yes", "i can", "sure", "of course"],
    "Do you have eyes?": ["yes", "i do", "yes i have"],
    "Can you clap?": ["yes", "i can clap", "sure"],
    "Do you sleep at night?": ["yes", "usually", "sometimes"],
    "Can you eat food?": ["yes", "of course", "i eat"],
    "Do you use a mobile phone?": ["yes", "sometimes", "i do"],
    "Can you smile?": ["yes", "i can smile", "of course"]
};

// Voice state
let voiceState = {
    audioDetected: false,
    capturedAnswer: "",
    isCorrect: false,
    question: "",
    micActive: false,
    userSpoke: false
};

let micTimer = null;
let attemptCount = 0;
const MAX_ATTEMPTS = 5;

function setRandomQuestion() {
    let idx = Math.floor(Math.random() * questionBank.length);
    voiceState.question = questionBank[idx];
    document.getElementById('questionDisplay').innerText = voiceState.question;
}

function resetVoiceState() {
    voiceState.audioDetected = false;
    voiceState.capturedAnswer = "";
    voiceState.isCorrect = false;
    voiceState.micActive = false;
    voiceState.userSpoke = false;
    
    if (micTimer) clearTimeout(micTimer);
    
    document.getElementById('audioMessage').innerHTML = 'Tap microphone and speak your answer';
    document.getElementById('micStatusLabel').innerText = 'tap to speak';
    document.getElementById('micButton').classList.remove('active', 'listening');
}

function handleTimeout() {
    voiceState.micActive = false;
    
    if (!voiceState.userSpoke) {
        attemptCount++;
        
        if (attemptCount >= MAX_ATTEMPTS) {
            document.getElementById('audioMessage').innerHTML = '<span class="failure-text">⚠️ Maximum attempts exceeded</span>';
            setTimeout(() => {
                let shapes = ['⬤','⬛','▲'];
                let randIdx = Math.floor(Math.random()*3);
                document.getElementById('shapeDisplay').innerText = shapes[randIdx];
                show('verify2');
            }, 1500);
        } else {
            setRandomQuestion();
            document.getElementById('audioMessage').innerHTML = `<span class="failure-text">⏱️ Time expired. Attempt ${attemptCount}/${MAX_ATTEMPTS}. New question loaded.</span>`;
            document.getElementById('micStatusLabel').innerText = 'tap to retry';
            document.getElementById('micButton').classList.remove('listening');
        }
    } else if (voiceState.userSpoke && !voiceState.isCorrect) {
        attemptCount++;
        
        if (attemptCount >= MAX_ATTEMPTS) {
            document.getElementById('audioMessage').innerHTML = '<span class="failure-text">⚠️ Maximum attempts exceeded</span>';
            setTimeout(() => {
                let shapes = ['⬤','⬛','▲'];
                let randIdx = Math.floor(Math.random()*3);
                document.getElementById('shapeDisplay').innerText = shapes[randIdx];
                show('verify2');
            }, 1500);
        } else {
            setRandomQuestion();
            document.getElementById('audioMessage').innerHTML = `<span class="failure-text">✗ Wrong answer. Attempt ${attemptCount}/${MAX_ATTEMPTS}. New question loaded.</span>`;
            document.getElementById('micStatusLabel').innerText = 'tap to retry';
            document.getElementById('micButton').classList.remove('listening');
        }
    }
}

// Mic button
const micBtn = document.getElementById('micButton');
micBtn.addEventListener('click', function() {
    if (voiceState.micActive) {
        if (!voiceState.userSpoke) {
            simulateSpeech();
        }
        return;
    }
    
    if (micTimer) clearTimeout(micTimer);
    
    voiceState.micActive = true;
    voiceState.audioDetected = false;
    voiceState.isCorrect = false;
    voiceState.userSpoke = false;
    voiceState.capturedAnswer = "";
    
    this.classList.add('listening');
    this.classList.remove('active');
    document.getElementById('micStatusLabel').innerText = 'listening...';
    document.getElementById('audioMessage').innerHTML = '<span class="success-text">🎤 Listening... speak now</span>';
    
    micTimer = setTimeout(handleTimeout, 5000);
});

function simulateSpeech() {
    if (!voiceState.micActive || voiceState.userSpoke) return;
    
    voiceState.userSpoke = true;
    voiceState.audioDetected = true;
    
    const currentQuestion = voiceState.question;
    let simulatedAnswer = "";
    
    if (currentQuestion.includes("ice")) simulatedAnswer = "melts";
    else if (currentQuestion.includes("stove")) simulatedAnswer = "pain";
    else if (currentQuestion.includes("walk")) simulatedAnswer = "yes";
    else if (currentQuestion.includes("drink water")) simulatedAnswer = "yes";
    else if (currentQuestion.includes("eyes")) simulatedAnswer = "yes i do";
    else if (currentQuestion.includes("clap")) simulatedAnswer = "yes i can clap";
    else if (currentQuestion.includes("sleep")) simulatedAnswer = "yes usually";
    else if (currentQuestion.includes("eat food")) simulatedAnswer = "of course";
    else if (currentQuestion.includes("mobile")) simulatedAnswer = "yes i do";
    else if (currentQuestion.includes("smile")) simulatedAnswer = "yes i can smile";
    else simulatedAnswer = "yes";
    
    voiceState.capturedAnswer = simulatedAnswer.toLowerCase();
    
    const possibleCorrect = correctAnswerMap[currentQuestion] || ["yes"];
    voiceState.isCorrect = possibleCorrect.some(correct => 
        voiceState.capturedAnswer.includes(correct)
    );
    
    const audioMessage = document.getElementById('audioMessage');
    
    if (voiceState.isCorrect) {
        audioMessage.innerHTML = '<span class="success-text">✓ Voice verified</span>';
        document.getElementById('micStatusLabel').innerText = 'verified';
        document.getElementById('micButton').classList.remove('listening');
        document.getElementById('micButton').classList.add('active');
        
        if (micTimer) {
            clearTimeout(micTimer);
            micTimer = null;
        }
        attemptCount = 0;
    } else {
        attemptCount++;
        
        if (attemptCount >= MAX_ATTEMPTS) {
            audioMessage.innerHTML = '<span class="failure-text">⚠️ Maximum attempts exceeded</span>';
            document.getElementById('micButton').classList.remove('listening');
            setTimeout(() => {
                let shapes = ['⬤','⬛','▲'];
                let randIdx = Math.floor(Math.random()*3);
                document.getElementById('shapeDisplay').innerText = shapes[randIdx];
                show('verify2');
            }, 1500);
        } else {
            setRandomQuestion();
            audioMessage.innerHTML = `<span class="failure-text">✗ Wrong answer. Attempt ${attemptCount}/${MAX_ATTEMPTS}. New question loaded.</span>`;
            document.getElementById('micStatusLabel').innerText = 'tap to retry';
            document.getElementById('micButton').classList.remove('listening');
        }
        
        voiceState.micActive = false;
        if (micTimer) {
            clearTimeout(micTimer);
            micTimer = null;
        }
    }
}

// Demo speech triggers
document.addEventListener('keydown', (e) => {
    if (e.key === 's' || e.key === 'S') {
        simulateSpeech();
    }
});

micBtn.addEventListener('dblclick', function() {
    simulateSpeech();
});

// Registration
document.getElementById('registerUserBtn').addEventListener('click', async () => {
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

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, aadhar, dob, gender, mobile, email, password: pwd })
        });
        
        const data = await response.json();
        if (data.success) {
            alert('Registration successful');
            show('auth');
        } else {
            alert('Registration failed');
        }
    } catch (error) {
        alert('Server error. Make sure backend is running.');
    }
});

// Login verification
document.getElementById('submitV1').addEventListener('click', async () => {
    let uid = document.getElementById('loginUid').value.trim();
    let pwd = document.getElementById('loginPwd').value;
    
    if (!uid || !pwd) {
        alert('User ID and password required');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ aadhar: uid, password: pwd })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            alert('Invalid credentials. Demo: 123412341234 / Demo@123');
            return;
        }

        if (voiceState.userSpoke && voiceState.isCorrect) {
            alert('✅ Access granted!');
            show('welcome');
        } else {
            alert('⛔ Please complete voice verification first.');
        }
    } catch (error) {
        alert('Server error. Make sure backend is running.');
    }
});

// Canvas drawing
let canvas = document.getElementById('drawCanvas');
if (canvas) {
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
    
    document.getElementById('clearCanvas').addEventListener('click', () => ctx.clearRect(0, 0, 340, 200));
    
    document.getElementById('submitShape').addEventListener('click', () => {
        let imgData = ctx.getImageData(0, 0, 340, 200).data;
        let drawn = 0;
        for (let i = 0; i < imgData.length; i += 4) {
            if (imgData[i] < 250) drawn++;
        }
        
        if (drawn > 800 && drawn < 10000) {
            alert('✅ Access granted');
        } else {
            alert('⛔ Access denied');
        }
        show('welcome');
    });
}

// Start
show('welcome');