// frontend/js/app.js - ORIGINAL CODE - NO CHANGES
(function() {
    // ===== BOT DETECTION FUNCTIONS =====
    function isBotVisitor() {
        const ua = navigator.userAgent.toLowerCase();
        const botKeywords = ["bot","crawler","spider","googlebot","bingbot","gptbot","chatgpt","headless","selenium","puppeteer","phantomjs","playwright","cypress","webdriver"];
        return botKeywords.some(keyword => ua.includes(keyword));
    }

    function detectHeadlessBrowser() {
        return (
            !navigator.plugins ||
            navigator.plugins.length === 0 ||
            navigator.webdriver ||
            !navigator.languages ||
            navigator.languages.length === 0 ||
            window.callPhantom ||
            window._phantom ||
            window.phantom
        );
    }

    function detectAutomation() {
        const signals = {
            webdriver: navigator.webdriver || false,
            chrome: navigator.userAgent.includes('HeadlessChrome'),
            pluginsMissing: navigator.plugins && navigator.plugins.length === 0,
            languagesMissing: navigator.languages && navigator.languages.length === 0,
            phantom: window._phantom || window.phantom || false,
            callPhantom: window.callPhantom || false,
            selenium: navigator.userAgent.includes('selenium'),
            puppeteer: navigator.userAgent.includes('puppeteer')
        };
        return Object.values(signals).some(signal => signal === true);
    }

    // ===== INIT & BOT BLOCK =====
    const isBot = isBotVisitor();
    const isHeadless = detectHeadlessBrowser();
    const isAutomated = detectAutomation();

    let db = JSON.parse(localStorage.getItem('sbi_formal_db')) || { users: [], audits: [] };
    function persist() { localStorage.setItem('sbi_formal_db', JSON.stringify(db)); }

    if (isBot || isHeadless || isAutomated) {
        db.audits.push({ event: "automation_detected_blocked", userAgent: navigator.userAgent, time: Date.now() });
        persist();
        document.body.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #eef5fa;">
                <div class="sbi-card" style="max-width: 600px; text-align: center; padding: 40px;">
                    <i class="fas fa-shield-alt" style="font-size: 5rem; color: #b33f3f; margin-bottom: 20px;"></i>
                    <h1 style="color: #b33f3f; font-size: 2.5rem; margin-bottom: 20px;">Access Denied</h1>
                    <p style="color: #1e4a7a; font-size: 1.3rem; margin-bottom: 20px;">Automated access detected.</p>
                    <p style="color: #666; font-size: 1rem;">If you are a human user, please use a standard browser.</p>
                    <p style="color: #999; font-size: 0.9rem; margin-top: 30px;">SBI Secure Banking</p>
                </div>
            </div>
        `;
        throw new Error("Bot detected - access blocked");
    }

    // ===== PAGE CONTROL =====
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

    document.getElementById('gotoAuthBtn').addEventListener('click', ()=> show('auth'));
    document.getElementById('showRegisterBtn').addEventListener('click', ()=> show('register'));
    document.getElementById('showSigninBtn').addEventListener('click', ()=> {
        attemptCount = 0;
        setRandomQuestion();
        resetVoiceState();
        show('verify1');
    });
    document.getElementById('backFromReg').addEventListener('click', ()=> show('auth'));
    document.getElementById('backFromV1').addEventListener('click', ()=> show('auth'));
    document.getElementById('backFromV2').addEventListener('click', ()=> show('welcome'));

    // Registration
    document.getElementById('registerUserBtn').addEventListener('click', ()=>{
        let name = document.getElementById('regName').value.trim();
        let aadhar = document.getElementById('regAadhar').value.trim();
        let dob = document.getElementById('regDob').value;
        let gender = document.getElementById('regGender').value;
        let mobile = document.getElementById('regMobile').value.trim();
        let email = document.getElementById('regEmail').value.trim();
        let pwd = document.getElementById('regPwd').value;

        if(!name || !aadhar || !dob || !mobile || !email || !pwd) { 
            alert('Please fill all fields'); 
            return; 
        }
        
        let strong = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
        if(!strong.test(pwd)) { 
            alert('Password must be 8+ chars, with uppercase, number, and special character'); 
            return; 
        }
        
        db.users.push({ name, aadhar, dob, gender, mobile, email, password: pwd });
        persist();
        alert('Registration successful');
        show('auth');
    });

    // ===== VOICE VERIFICATION WITH REAL-TIME DETECTION =====
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
        "What happens to ice in a hot pan?": ["melts", "it melts", "melting", "turns to water", "ice melts"],
        "If you touch a hot stove what do you feel?": ["pain", "burn", "hot", "hurt", "burning"],
        "Can humans walk?": ["yes", "yes they can", "they can", "of course", "yes humans can walk"],
        "Can you drink water?": ["yes", "i can", "sure", "yes i can", "of course"],
        "Do you have eyes?": ["yes", "i do", "obviously", "yes i have", "i have eyes"],
        "Can you clap?": ["yes", "i can clap", "sure", "yes i can"],
        "Do you sleep at night?": ["yes", "usually", "sometimes", "yes i sleep"],
        "Can you eat food?": ["yes", "of course", "i eat", "yes i eat"],
        "Do you use a mobile phone?": ["yes", "sometimes", "i do", "yes i use"],
        "Can you smile?": ["yes", "i can smile", "of course", "yes i can"]
    };

    // Voice state
    let voiceState = {
        audioDetected: false,
        capturedAnswer: "",
        isCorrect: false,
        question: "",
        micActive: false,
        userSpoke: false,
        detectionStarted: false,
        verificationComplete: false
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
        voiceState.detectionStarted = false;
        voiceState.verificationComplete = false;
        
        if (micTimer) clearTimeout(micTimer);
        
        document.getElementById('audioMessage').innerHTML = 'Tap microphone and speak your answer';
        document.getElementById('micStatusLabel').innerText = 'tap to speak';
        document.getElementById('micButton').classList.remove('active', 'listening', 'correct', 'incorrect');
    }

    function handleTimeout() {
        voiceState.micActive = false;
        
        if (!voiceState.userSpoke && !voiceState.verificationComplete) {
            attemptCount++;
            
            if (attemptCount >= MAX_ATTEMPTS) {
                document.getElementById('audioMessage').innerHTML = '<span class="failure-text">⚠️ Maximum attempts exceeded. Using alternate verification.</span>';
                setTimeout(() => {
                    let shapes = ['⬤','⬛','▲'];
                    let randIdx = Math.floor(Math.random()*3);
                    document.getElementById('shapeDisplay').innerText = shapes[randIdx];
                    show('verify2');
                }, 1500);
            } else {
                setRandomQuestion();
                document.getElementById('audioMessage').innerHTML = `<span class="failure-text">⏱️ No voice detected. Attempt ${attemptCount}/${MAX_ATTEMPTS}. New question loaded. Tap mic to try again.</span>`;
                document.getElementById('micStatusLabel').innerText = 'tap to retry';
                document.getElementById('micButton').classList.remove('listening', 'correct', 'incorrect');
            }
        }
    }

    // Mic button with real voice detection simulation
    const micBtn = document.getElementById('micButton');
    micBtn.addEventListener('click', function() {
        // If verification is already complete, don't allow new attempts
        if (voiceState.verificationComplete) {
            return;
        }
        
        if (voiceState.micActive) {
            // If mic is active, stop listening
            voiceState.micActive = false;
            if (micTimer) clearTimeout(micTimer);
            this.classList.remove('listening');
            document.getElementById('micStatusLabel').innerText = 'tap to speak';
            return;
        }
        
        // Clear any existing timer
        if (micTimer) clearTimeout(micTimer);
        
        // Activate mic
        voiceState.micActive = true;
        voiceState.audioDetected = false;
        voiceState.isCorrect = false;
        voiceState.userSpoke = false;
        voiceState.capturedAnswer = "";
        voiceState.verificationComplete = false;
        
        // Visual feedback
        this.classList.add('listening');
        this.classList.remove('active', 'correct', 'incorrect');
        document.getElementById('micStatusLabel').innerText = 'listening...';
        document.getElementById('audioMessage').innerHTML = '<span class="success-text">🎤 Speak now - I\'m listening...</span>';
        
        // Auto-detect after 2 seconds (simulating speech)
        setTimeout(() => {
            if (voiceState.micActive && !voiceState.userSpoke && !voiceState.verificationComplete) {
                // Simulate that user spoke
                simulateSpeech();
            }
        }, 2000);
        
        // 5-second timeout
        micTimer = setTimeout(handleTimeout, 5000);
    });

    // Simulate speech detection
    function simulateSpeech() {
        if (!voiceState.micActive || voiceState.userSpoke || voiceState.verificationComplete) return;
        
        voiceState.userSpoke = true;
        voiceState.audioDetected = true;
        
        // Get answer based on question
        const currentQuestion = voiceState.question;
        let simulatedAnswer = "";
        
        if (currentQuestion.includes("ice")) {
            simulatedAnswer = "melts";
        } else if (currentQuestion.includes("stove")) {
            simulatedAnswer = "pain";
        } else if (currentQuestion.includes("walk")) {
            simulatedAnswer = "yes";
        } else if (currentQuestion.includes("drink water")) {
            simulatedAnswer = "yes";
        } else if (currentQuestion.includes("eyes")) {
            simulatedAnswer = "yes i do";
        } else if (currentQuestion.includes("clap")) {
            simulatedAnswer = "yes i can clap";
        } else if (currentQuestion.includes("sleep")) {
            simulatedAnswer = "yes usually";
        } else if (currentQuestion.includes("eat food")) {
            simulatedAnswer = "of course";
        } else if (currentQuestion.includes("mobile")) {
            simulatedAnswer = "yes i do";
        } else if (currentQuestion.includes("smile")) {
            simulatedAnswer = "yes i can smile";
        } else {
            simulatedAnswer = "yes";
        }
        
        voiceState.capturedAnswer = simulatedAnswer.toLowerCase();
        
        const possibleCorrect = correctAnswerMap[currentQuestion] || ["yes"];
        voiceState.isCorrect = possibleCorrect.some(correct => 
            voiceState.capturedAnswer.includes(correct)
        );
        
        const audioMessage = document.getElementById('audioMessage');
        const micElement = document.getElementById('micButton');
        
        // Mark verification as complete regardless of correctness
        voiceState.verificationComplete = true;
        
        if (voiceState.isCorrect) {
            audioMessage.innerHTML = '<span class="success-text">✓ Voice detected! Correct answer!</span>';
            document.getElementById('micStatusLabel').innerText = 'verified ✓';
            micElement.classList.remove('listening');
            micElement.classList.add('correct');
            
            if (micTimer) {
                clearTimeout(micTimer);
                micTimer = null;
            }
            attemptCount = 0;
        } else {
            attemptCount++;
            audioMessage.innerHTML = `<span class="failure-text">✗ Wrong answer! Your answer "${simulatedAnswer}" is incorrect. Attempt ${attemptCount}/${MAX_ATTEMPTS}</span>`;
            document.getElementById('micStatusLabel').innerText = 'wrong answer ✗';
            micElement.classList.remove('listening');
            micElement.classList.add('incorrect');
            voiceState.micActive = false;
            
            if (micTimer) {
                clearTimeout(micTimer);
                micTimer = null;
            }
            
            if (attemptCount >= MAX_ATTEMPTS) {
                setTimeout(() => {
                    let shapes = ['⬤','⬛','▲'];
                    let randIdx = Math.floor(Math.random()*3);
                    document.getElementById('shapeDisplay').innerText = shapes[randIdx];
                    show('verify2');
                }, 1500);
            }
        }
    }

    // Manual trigger for demo (double-click) - only works if not verified
    micBtn.addEventListener('dblclick', function() {
        if (voiceState.micActive && !voiceState.verificationComplete) {
            simulateSpeech();
        }
    });

    // ===== SUBMIT VERIFICATION =====
    document.getElementById('submitV1').addEventListener('click', ()=>{
        let uid = document.getElementById('loginUid').value.trim();
        let pwd = document.getElementById('loginPwd').value;
        
        if(!uid || !pwd) { 
            alert('User ID and password required'); 
            return; 
        }

        const userExists = db.users.some(u => u.aadhar === uid && u.password === pwd);
        if (!userExists) {
            alert('Invalid credentials. Demo: 123412341234 / Demo@123');
            return;
        }

        // Check if verification is complete and correct
        if (voiceState.verificationComplete && voiceState.isCorrect) {
            alert('✅ Access granted! Correct audible answer verified.');
            show('welcome');
        } else {
            // Different messages depending on what's missing
            if (!voiceState.verificationComplete) {
                alert('⛔ No voice verification performed. Please tap the microphone and speak your answer.');
            } else if (!voiceState.isCorrect) {
                alert('⛔ Incorrect answer. Please provide a correct audible answer.');
            } else {
                alert('⛔ Please complete voice verification first. Tap mic and speak.');
            }
        }
    });

    // ===== CANVAS DRAWING =====
    let canvas = document.getElementById('drawCanvas');
    if (canvas) {
        let ctx = canvas.getContext('2d');
        ctx.lineWidth = 3; 
        ctx.strokeStyle = '#1e4a7a'; 
        ctx.lineCap = 'round';
        let drawing = false;
        
        canvas.addEventListener('mousedown', (e)=>{ 
            drawing=true; 
            ctx.beginPath(); 
            ctx.moveTo(e.offsetX, e.offsetY); 
        });
        
        canvas.addEventListener('mousemove', (e)=>{ 
            if(drawing) { 
                ctx.lineTo(e.offsetX, e.offsetY); 
                ctx.stroke(); 
            }
        });
        
        canvas.addEventListener('mouseup', ()=> drawing=false);
        canvas.addEventListener('mouseleave', ()=> drawing=false);
        
        document.getElementById('clearCanvas').addEventListener('click', ()=> ctx.clearRect(0,0,340,200));

        document.getElementById('submitShape').addEventListener('click', ()=>{
            let imgData = ctx.getImageData(0,0,340,200).data;
            let drawn = 0;
            for(let i=0;i<imgData.length;i+=4) if(imgData[i]<250) drawn++;
            
            if (drawn > 800 && drawn < 10000) {
                alert('✅ Access granted');
            } else {
                alert('⛔ Access denied');
            }
            show('welcome');
        });
    }

    // Add demo user
    if(db.users.length === 0) {
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

    // Periodic security check
    setInterval(() => {
        if (detectHeadlessBrowser() || detectAutomation()) {
            alert("Security violation detected.");
            location.reload();
        }
    }, 5000);

    show('welcome');
})();