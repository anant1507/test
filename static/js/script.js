document.addEventListener('DOMContentLoaded', function() {
    // Navbar Toggle
    const menuBtn = document.getElementById('menuBtn');
    const navLinks = document.getElementById('navLinks');
    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => navLinks.classList.toggle('active'));
    }

    // Initialize systems
    initWasteDetection();
    initCameraControls();
    initChatbot();
    initCameraFeed();
});

// Camera Feed Initialization
function initCameraFeed() {
    const videoElement = document.getElementById('videoElement');
    const cameraLoading = document.getElementById('cameraLoading');

    if (videoElement && cameraLoading) {
        videoElement.onload = function() {
            cameraLoading.style.display = 'none';
        };
        
        videoElement.onerror = function() {
            cameraLoading.innerHTML = '<p>Error loading camera feed. Please refresh the page.</p>';
        };
        
        // Check if feed loads within 5 seconds
        setTimeout(() => {
            if (videoElement.naturalWidth === 0) {
                cameraLoading.innerHTML = '<p>Camera feed not available. Please check connection.</p>';
            }
        }, 5000);
    }
}

// Waste Detection System
function initWasteDetection() {
    const binValues = { green: 0, blue: 0, red: 0 };
    const maxBinValue = 100;
    const incrementValue = 20;
    const detectedItems = { green: [], blue: [], red: [] };
    const notificationSent = { green: false, blue: false, red: false };

    function addWasteToBin(wasteType, itemName) {
        const binColor = 
            wasteType === 'biodegradable' ? 'green' :
            wasteType === 'non-biodegradable' ? 'blue' : 'red';

        if (binValues[binColor] < maxBinValue) {
            binValues[binColor] = Math.min(binValues[binColor] + incrementValue, maxBinValue);
            updateBinUI(binColor);
            detectedItems[binColor].push(itemName);
            updateBinItems(binColor);
            animateBin(binColor);
            updateDetectionInfo(itemName, wasteType);
            
            if (binValues[binColor] >= maxBinValue && !notificationSent[binColor]) {
                handleBinFull(binColor);
                notificationSent[binColor] = true;
            }
        }
    }

    function handleBinFull(binColor) {
        const binType = binColor === 'green' ? 'Biodegradable' : 
                       binColor === 'blue' ? 'Non-Biodegradable' : 'Chemical';
        
        fetch(`/bin_full/${binColor}`)
            .then(response => response.json())
            .then(data => {
                showBinAlert(binType, data.status === "success");
                if (data.status === "success") playNotificationSound();
            })
            .catch(() => showBinAlert(binType, false));
    }

    function updateBinUI(binColor) {
        const fillElement = document.getElementById(binColor + 'Fill');
        const valueElement = document.getElementById(binColor + 'Value');
        if (fillElement && valueElement) {
            fillElement.style.width = binValues[binColor] + '%';
            valueElement.textContent = binValues[binColor];
        }
    }

    function updateBinItems(binColor) {
        const itemsBox = document.getElementById(binColor + 'Items');
        if (itemsBox) {
            itemsBox.innerHTML = '';
            detectedItems[binColor].forEach(item => {
                const itemTag = document.createElement('span');
                itemTag.className = 'item-tag';
                itemTag.textContent = item;
                itemsBox.appendChild(itemTag);
            });
        }
    }

    function animateBin(binColor) {
        const bin = document.getElementById(binColor + 'Bin');
        if (bin) {
            bin.classList.add('shake');
            setTimeout(() => bin.classList.remove('shake'), 500);
        }
    }

    function updateDetectionInfo(itemName, wasteType) {
        const binType = 
            wasteType === "biodegradable" ? "Green (Biodegradable)" :
            wasteType === "non-biodegradable" ? "Blue (Non-Biodegradable)" : 
            "Red (Chemical)";
        
        document.getElementById('detected-object').textContent = itemName;
        document.getElementById('bin-type').textContent = binType;
        document.getElementById('waste-category').textContent = 
            wasteType.charAt(0).toUpperCase() + wasteType.slice(1);
    }

    function resetBins() {
        ['green', 'blue', 'red'].forEach(color => {
            binValues[color] = 0;
            detectedItems[color] = [];
            notificationSent[color] = false;
            updateBinUI(color);
            updateBinItems(color);
        });
        updateDetectionInfo('None', 'Not Detected');
    }

    // Event Listeners
    document.getElementById('resetBinsBtn')?.addEventListener('click', resetBins);
    document.getElementById('random-fill')?.addEventListener('click', function() {
        const wasteTypes = ['biodegradable', 'non-biodegradable', 'chemical'];
        const items = {
            biodegradable: ["Banana Peel", "Apple Core", "Vegetable Scraps"],
            nonBiodegradable: ["Plastic Bottle", "Newspaper", "Aluminum Can"],
            chemical: ["Battery", "Medicine", "Paint Can"]
        };
        const randomType = wasteTypes[Math.floor(Math.random() * wasteTypes.length)];
        const randomItem = items[randomType][Math.floor(Math.random() * items[randomType].length)];
        addWasteToBin(randomType, randomItem);
    });

    setInterval(() => {
        fetch("/get_detected_objects")
            .then(response => response.json())
            .then(data => {
                if (Array.isArray(data)) {
                    data.forEach(([item, type]) => addWasteToBin(type, item));
                }
            })
            .catch(console.error);
    }, 2000);
}

// Camera Controls
function initCameraControls() {
    const controls = {
        'cam-preview': '/request_preview_switch',
        'flip-horizontal': '/request_flipH_switch',
        'use-model': '/request_model_switch',
        'exposure-down': '/request_exposure_down',
        'exposure-up': '/request_exposure_up',
        'contrast-down': '/request_contrast_down',
        'contrast-up': '/request_contrast_up',
        'reset-cam': '/reset_camera'
    };

    Object.entries(controls).forEach(([id, endpoint]) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    const response = await fetch(endpoint);
                    if (!response.ok) throw new Error('Request failed');
                    const data = await response.json();
                    console.log(`${id} control activated`, data);
                } catch (error) {
                    console.error(`Error with ${id} control:`, error);
                }
            });
        }
    });
}

// Chatbot System
function initChatbot() {
    const chatbotBtn = document.getElementById('chatbotBtn');
    const chatContainer = document.getElementById('chatbotContainer');
    if (!chatbotBtn || !chatContainer) return;

    chatbotBtn.addEventListener('click', () => chatContainer.classList.toggle('active'));
    document.getElementById('chatCloseBtn')?.addEventListener('click', () => chatContainer.classList.remove('active'));
    
    function sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        if (!message) return;
        
        addMessage(message, 'user');
        input.value = '';
        
        setTimeout(() => {
            const responses = {
                waste: "Our system automatically sorts waste into biodegradable, non-biodegradable, and chemical bins.",
                full: "Full bins trigger email alerts to maintenance staff.",
                help: "Contact support@eco-rakshak.com for assistance."
            };
            const response = 
                message.toLowerCase().includes('waste') ? responses.waste :
                message.toLowerCase().includes('full') ? responses.full :
                responses.help;
            addMessage(response, 'bot');
        }, 500);
    }

    function addMessage(text, sender) {
        const messages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.textContent = text;
        messages.appendChild(messageDiv);
        messages.scrollTop = messages.scrollHeight;
    }

    document.getElementById('chatSendBtn')?.addEventListener('click', sendMessage);
    document.getElementById('chatInput')?.addEventListener('keypress', (e) => e.key === 'Enter' && sendMessage());
}

// Notification System
function showBinAlert(binType, success) {
    const alert = document.createElement('div');
    alert.className = `bin-alert ${success ? 'success' : 'error'}`;
    alert.innerHTML = `
        <div class="alert-content">
            <span class="alert-icon">${success ? '✓' : '⚠️'}</span>
            <span>${binType} bin ${success ? 'notification sent' : 'notification failed'}</span>
        </div>
    `;
    document.body.appendChild(alert);
    setTimeout(() => {
        alert.classList.add('fade-out');
        setTimeout(() => alert.remove(), 500);
    }, 5000);
}

function playNotificationSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = 800;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
        osc.stop(ctx.currentTime + 1);
    } catch (e) {
        console.log("Audio notification failed", e);
    }
}