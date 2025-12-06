// ========== НАЧАЛО ФАЙЛА script.js ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('Eco Assistant загружен с непрерывным сканированием');
    
    // Состояния
    const state1 = document.getElementById('state1');
    const state2 = document.getElementById('state2');
    const state3 = document.getElementById('state3');
    const state4 = document.getElementById('state4');
    const state5 = document.getElementById('state5');
    
    // Элементы
    const cameraFeedInactive = state1.querySelector('.camera-feed.inactive');
    const manualBtns = document.querySelectorAll('.manual-btn');
    const gotoManualBtn = document.getElementById('goto-manual');
    const testErrorBtn = document.querySelector('.test-error-btn');
    
    // Переменные
    let cameraStream = null;
    let resultTimeout = null;
    let scanInterval = null;
    let scanAttempts = 0;
    const MAX_SCAN_ATTEMPTS = 5;
    const SCAN_INTERVAL = 2000;

    // База данных отходов
    const wasteDatabase = {
        // ПЕРЕРАБАТЫВАЕМЫЙ ПЛАСТИК (Контейнер 1 - Зеленый)
        pet_bottle: {
            name: "ПЭТ-бутылка",
            category: "Пластик",
            bin: "recycle",
            icon: "icons/pet-icon.png",
            description: "Прозрачные бутылки от напитков",
            rules: "Чистые, без органических загрязнений",
            instructions: [
                "Промыть водой от остатков",
                "Снять этикетку", 
                "Смять бутылку",
                "Закрутить крышку",
                "Выбросить в перерабатываемый пластик"
            ],
            preparation: "Жестательно смятая, без органики"
        },
        hdpe_bottle: {
            name: "Флаконы HDPE",
            category: "Пластик", 
            bin: "recycle",
            icon: "icons/hdpe-icon.png",
            description: "Флаконы от шампуня, бытовой химии",
            rules: "Маркировка 2, без остатков химии",
            instructions: [
                "Промыть водой",
                "Снять наклейки",
                "Смять",
                "Выбросить в перерабатываемый пластик"
            ],
            preparation: "Чистые, можно без маркировки"
        },
        hdpe_bag: {
            name: "Пакеты HDPE",
            category: "Пластик", 
            bin: "recycle",
            icon: "icons/hdpe-bag-icon.png",
            description: "Плотные пакеты, плёнка, пупырка",
            rules: "Чистые, сухие",
            instructions: [
                "Убедиться в чистоте",
                "Собрать в один пакет",
                "Сплющить",
                "Выбросить в перерабатываемый пластик"
            ],
            preparation: "Без остатков продукта"
        },
        pp_clean: {
            name: "Ёмкости PP (чистые)",
            category: "Пластик",
            bin: "recycle",
            icon: "icons/pp-icon.png",
            description: "Контейнеры, стаканы, вёдра",
            rules: "ВСЕ наклейки сняты, чистые",
            instructions: [
                "Снять ВСЕ наклейки",
                "Промыть водой",
                "Снять термоусадочную плёнку",
                "Выбросить в перерабатываемый пластик"
            ],
            preparation: "Только если все наклейки сняты!"
        },

        // НЕ ПЕРЕРАБАТЫВАЕМЫЙ ПЛАСТИК (Контейнер 2 - Оранжевый)
        pp_dirty: {
            name: "Ёмкости PP (грязные)",
            category: "Пластик",
            bin: "waste",
            icon: "icons/pp-dirty-icon.png",
            description: "Контейнеры с наклейками или загрязнениями",
            rules: "Наклейки не снимаются или есть жирные загрязнения",
            instructions: [
                "Не пытаться снять неотделяемые наклейки",
                "Если есть жирные загрязнения - не мыть",
                "Выбросить в неперерабатываемые отходы"
            ],
            preparation: "Весь предмет целиком в неперерабатываемое"
        },
        pet_other: {
            name: "Другой ПЭТ",
            category: "Пластик",
            bin: "waste",
            icon: "icons/pet-other-icon.png",
            description: "Белые бутылки, от масла, стаканы, контейнеры",
            rules: "Не принимается в переработку",
            instructions: [
                "Не нужно промывать",
                "Выбросить в неперерабатываемые отходы"
            ],
            preparation: "Целиком в неперерабатываемое"
        },
        foam_food: {
            name: "Пенопласт из-под еды",
            category: "Пластик",
            bin: "waste",
            icon: "icons/ps-icon.png",
            description: "Лотки, посуда, упаковка от еды",
            rules: "Загрязнён органическими остатками",
            instructions: [
                "Не пытаться очистить",
                "Выбросить в неперерабатываемые отходы"
            ],
            preparation: "Целиком в неперерабатываемое"
        },
        special_plastic: {
            name: "Особый пластик",
            category: "Пластик",
            bin: "waste",
            icon: "icons/mixed-icon.png",
            description: "Блистеры, зубные щётки, карты, тюбики",
            rules: "Не массовый перерабатываемый пластик",
            instructions: [
                "Чеки складывать отдельно",
                "Тюбики разрезать вдоль",
                "Выбросить в неперерабатываемые отходы"
            ],
            preparation: "Если нет спецконтейнера - в отходы"
        },

        // БУМАГА (Контейнер 3 - Желтый)
        paper_clean: {
            name: "Бумага и картон",
            category: "Бумага",
            bin: "paper",
            icon: "icons/paper-icon.png",
            description: "Газеты, журналы, картон, упаковка",
            rules: "Сухая, чистая, без скотча и скоб",
            instructions: [
                "Удалить скотч и скобы",
                "Сплющить коробки",
                "Не мокрая!",
                "Выбросить в бумагу"
            ],
            preparation: "Чистый, сухой, без плёнки"
        },
        cardboard: {
            name: "Картон",
            category: "Бумага",
            bin: "paper",
            icon: "icons/cardboard-icon.png",
            description: "Коробки, упаковка",
            rules: "Без жирных загрязнений, плёнки",
            instructions: [
                "Сплющить коробки",
                "Удалить скотч и плёнку",
                "Выбросить в бумагу"
            ],
            preparation: "Чистый, сухой"
        }
    };

    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    initManualSelectionPage();
    addScanStyles();

    // ========== ОБРАБОТЧИКИ СОБЫТИЙ ==========
    cameraFeedInactive.addEventListener('click', startScanning);
    
    document.querySelector('main').addEventListener('click', function(e) {
        if (state1.classList.contains('active') && 
            !e.target.closest('.yellow-btn') && 
            !e.target.closest('.error-btn')) {
            startScanning();
        }
    });
    
    manualBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            goToManualSelection();
        });
    });
    
    if (testErrorBtn) {
        testErrorBtn.addEventListener('click', function() {
            stopContinuousScanning();
            if (resultTimeout) {
                clearTimeout(resultTimeout);
                resultTimeout = null;
            }
            
            state2.classList.remove('active');
            state4.classList.add('active');
        });
    }

    // ========== НЕПРЕРЫВНОЕ СКАНИРОВАНИЕ ==========
    async function startScanning() {
        console.log('🔍 Начало непрерывного сканирования');
        
        try {
            if (cameraStream) {
                redirectCameraStream(2);
            } else {
                await startCamera();
                redirectCameraStream(2);
            }
            
            state1.classList.remove('active');
            state2.classList.add('active');
            
            startContinuousScanning();
            
        } catch (error) {
            console.error('❌ Ошибка камеры:', error);
            showError('Не удалось получить доступ к камере. Выберите категорию вручную.');
        }
    }
    
    function startContinuousScanning() {
        scanAttempts = 0;
        addScanIndicators();
        updateAttemptCounter();
        
        const loadingText = document.querySelector('#state2 .loading-text');
        
        scanInterval = setInterval(async () => {
            if (!state2.classList.contains('active')) {
                stopContinuousScanning();
                return;
            }
            
            scanAttempts++;
            updateAttemptCounter();
            
            if (scanAttempts > MAX_SCAN_ATTEMPTS) {
                console.log(`❌ Максимум попыток (${MAX_SCAN_ATTEMPTS})`);
                stopContinuousScanning();
                showError('Не удалось распознать объект. Попробуйте другой ракурс или выберите вручную.');
                return;
            }
            
            console.log(`📸 Попытка ${scanAttempts}/${MAX_SCAN_ATTEMPTS}`);
            
            if (loadingText) {
                loadingText.textContent = `Сканирование... Попытка ${scanAttempts}/${MAX_SCAN_ATTEMPTS}`;
            }
            
            try {
                const imageData = await captureImage();
                
                if (imageData) {
                    console.log(`✅ Снимок ${scanAttempts} готов, отправка в ML...`);
                    
                    const result = await sendToMLAPI(imageData);
                    
                    if (result.success) {
                        console.log(`✅ Распознано на попытке ${scanAttempts}!`);
                        stopContinuousScanning();
                        removeScanIndicators();
                        processMLResult(result);
                    } else {
                        console.log(`🔄 Попытка ${scanAttempts}: ${result.message}`);
                        
                        if (scanAttempts === MAX_SCAN_ATTEMPTS) {
                            stopContinuousScanning();
                            removeScanIndicators();
                            showError('Не удалось распознать объект. Попробуйте другой ракурс или выберите вручную.');
                        }
                    }
                }
                
            } catch (error) {
                console.error(`❌ Ошибка на попытке ${scanAttempts}:`, error);
                
                if (scanAttempts === MAX_SCAN_ATTEMPTS) {
                    stopContinuousScanning();
                    removeScanIndicators();
                    showError('Ошибка сканирования. Выберите категорию вручную.');
                }
            }
            
        }, SCAN_INTERVAL);
        
        setTimeout(() => {
            if (scanInterval) {
                clearInterval(scanInterval);
                startContinuousScanning();
            }
        }, 100);
    }
    
    function stopContinuousScanning() {
        if (scanInterval) {
            clearInterval(scanInterval);
            scanInterval = null;
            scanAttempts = 0;
            console.log('🛑 Сканирование остановлено');
            removeScanIndicators();
        }
    }

    // ========== ML API ФУНКЦИИ ==========
    async function sendToMLAPI(imageData) {
        try {
            const response = await fetch('/api/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageData })
            });
            
            return await response.json();
            
        } catch (error) {
            console.error('❌ Ошибка ML API:', error);
            return {
                success: false,
                message: 'Ошибка соединения с нейросетью'
            };
        }
    }
    
    function processMLResult(result) {
        if (result.success && result.best_prediction) {
            const prediction = result.best_prediction;
            let wasteData = matchPredictionToDatabase(prediction);
            
            updateResultPage(wasteData);
            state2.classList.remove('active');
            state3.classList.add('active');
            
            console.log(`🎯 Распознано на попытке ${scanAttempts}: ${wasteData.name}`);
            showScanSuccessFeedback(scanAttempts);
            
        } else {
            showError(result.message || 'Объект не распознан. Выберите категорию вручную.');
        }
    }
    
    function matchPredictionToDatabase(prediction) {
        const classMapping = {
            'plastic': ['pet_bottle', 'hdpe_bottle', 'hdpe_bag', 'pp_clean'],
            'paper': ['paper_clean', 'cardboard'],
            '0': ['pet_bottle', 'hdpe_bottle', 'hdpe_bag', 'pp_clean'],
            '1': ['paper_clean', 'cardboard']
        };
        
        let wasteKeys = classMapping[prediction.class] || [];
        
        for (let key of wasteKeys) {
            if (wasteDatabase[key]) {
                return wasteDatabase[key];
            }
        }
        
        return {
            name: prediction.name || "Объект",
            category: prediction.category || "Неизвестно",
            bin: prediction.bin || "waste",
            instructions: prediction.instructions || ["Выбросить в соответствующий контейнер"],
            icon: "icons/mixed-icon.png",
            description: "Распознано нейросетью",
            rules: "Следуйте инструкциям",
            preparation: "Обычная подготовка"
        };
    }

    // ========== РАБОТА С ИЗОБРАЖЕНИЯМИ ==========
    async function captureImage() {
        const video = document.getElementById('camera-stream');
        
        if (!video || video.videoWidth === 0) {
            throw new Error("Видео не готово");
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Рамка и номер попытки
        ctx.strokeStyle = scanAttempts === 1 ? '#4CAF50' : '#FF9800';
        ctx.lineWidth = 3;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(20, 20, 80, 40);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px Arial';
        ctx.fillText(`${scanAttempts}/${MAX_SCAN_ATTEMPTS}`, 30, 45);
        
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.font = '16px Arial';
        ctx.fillText('Eco Assistant AI', 20, canvas.height - 30);
        
        return canvas.toDataURL('image/jpeg', 0.7);
    }

    // ========== ВИЗУАЛЬНЫЕ ЭФФЕКТЫ ==========
    function addScanStyles() {
        if (!document.getElementById('scan-styles')) {
            const styleEl = document.createElement('style');
            styleEl.id = 'scan-styles';
            styleEl.textContent = `
                @keyframes pulse-scan {
                    0% { opacity: 0.3; border-color: #4CAF50; }
                    50% { opacity: 1; border-color: #8BC34A; border-width: 4px; }
                    100% { opacity: 0.3; border-color: #4CAF50; }
                }
                .scan-indicator {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 85%;
                    height: 85%;
                    border: 3px dashed #4CAF50;
                    border-radius: 15px;
                    animation: pulse-scan 2s infinite;
                    pointer-events: none;
                    z-index: 10;
                    box-shadow: 0 0 20px rgba(76, 175, 80, 0.3);
                }
                .attempt-counter {
                    position: absolute;
                    top: 25px;
                    right: 25px;
                    background: linear-gradient(135deg, #4CAF50, #45a049);
                    color: white;
                    padding: 12px 18px;
                    border-radius: 25px;
                    font-weight: bold;
                    font-size: 20px;
                    z-index: 11;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    min-width: 90px;
                    text-align: center;
                    transition: all 0.3s ease;
                }
                .attempt-counter.warning { background: linear-gradient(135deg, #FF9800, #F57C00); }
                .attempt-counter.danger { background: linear-gradient(135deg, #f44336, #d32f2f); }
                @keyframes success-flash {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
                    50% { box-shadow: 0 0 40px 20px rgba(76, 175, 80, 0.6); }
                }
                .success-flash { animation: success-flash 0.8s ease; }
            `;
            document.head.appendChild(styleEl);
        }
    }
    
    function addScanIndicators() {
        const cameraFeed = state2.querySelector('.camera-feed.active');
        if (cameraFeed) {
            removeScanIndicators();
            
            const scanIndicator = document.createElement('div');
            scanIndicator.className = 'scan-indicator';
            cameraFeed.appendChild(scanIndicator);
            
            const attemptCounter = document.createElement('div');
            attemptCounter.className = 'attempt-counter';
            attemptCounter.id = 'attempt-counter';
            attemptCounter.textContent = `0/${MAX_SCAN_ATTEMPTS}`;
            cameraFeed.appendChild(attemptCounter);
        }
    }
    
    function updateAttemptCounter() {
        const counter = document.getElementById('attempt-counter');
        if (counter) {
            counter.textContent = `${scanAttempts}/${MAX_SCAN_ATTEMPTS}`;
            
            if (scanAttempts === 1) {
                counter.className = 'attempt-counter';
            } else if (scanAttempts <= 3) {
                counter.className = 'attempt-counter warning';
            } else {
                counter.className = 'attempt-counter danger';
            }
        }
    }
    
    function removeScanIndicators() {
        const scanIndicator = state2.querySelector('.scan-indicator');
        const attemptCounter = document.getElementById('attempt-counter');
        if (scanIndicator) scanIndicator.remove();
        if (attemptCounter) attemptCounter.remove();
    }
    
    function showScanSuccessFeedback(attempts) {
        const cameraFeed = state2.querySelector('.camera-feed.active');
        if (cameraFeed) {
            cameraFeed.classList.add('success-flash');
            setTimeout(() => {
                cameraFeed.classList.remove('success-flash');
            }, 1000);
        }
    }

    // ========== ОСНОВНЫЕ ФУНКЦИИ ==========
    function updateResultPage(wasteData) {
        console.log('Обновляем результат:', wasteData.name);
        
        const infoText = document.querySelector('#state3 .info-text');
        const instructions = document.querySelector('#state3 .instructions');
        
        if (infoText) infoText.textContent = wasteData.name;
        
        if (instructions) {
            instructions.innerHTML = '';
            wasteData.instructions.forEach(instruction => {
                const div = document.createElement('div');
                div.className = 'instruction';
                div.textContent = `- ${instruction}`;
                instructions.appendChild(div);
            });
        }
        
        highlightBin(wasteData.bin);
        showBinIndicator(wasteData.bin, wasteData.name);
        redirectCameraStream(3);
    }
    
    function highlightBin(binType) {
        document.querySelectorAll('.progress-segment').forEach(segment => {
            segment.classList.remove('active');
        });
        
        let binElement;
        switch(binType) {
            case 'recycle': binElement = document.getElementById('bin-recycle'); break;
            case 'waste': binElement = document.getElementById('bin-waste'); break;
            case 'paper': binElement = document.getElementById('bin-paper'); break;
        }
        
        if (binElement) binElement.classList.add('active');
    }
    
    function showBinIndicator(binType, wasteName) {
        const oldIndicator = document.querySelector('.bin-indicator');
        if (oldIndicator) oldIndicator.remove();
        
        let cameraContainer;
        if (state3.classList.contains('active')) {
            cameraContainer = state3.querySelector('.camera-container');
        } else if (state5.classList.contains('active')) {
            cameraContainer = state5.querySelector('.camera-container');
        }
        
        if (!cameraContainer) return;
        
        const indicator = document.createElement('div');
        indicator.className = 'bin-indicator';
        
        let binText, binColor, icon;
        switch(binType) {
            case 'recycle':
                binText = 'В ПЕРЕРАБАТЫВАЕМЫЙ ПЛАСТИК';
                binColor = '#4CAF50';
                icon = '♻️';
                break;
            case 'waste':
                binText = 'В НЕПЕРЕРАБАТЫВАЕМЫЕ ОТХОДЫ';
                binColor = '#FF5722';
                icon = '🚫';
                break;
            case 'paper':
                binText = 'В БУМАГУ';
                binColor = '#FFC107';
                icon = '📄';
                break;
        }
        
        indicator.setAttribute('data-bin-type', binType);
        indicator.innerHTML = `
            <div class="bin-indicator-content">
                <div class="bin-indicator-icon">${icon}</div>
                <div class="bin-indicator-text">${binText}</div>
            </div>
        `;
        indicator.style.backgroundColor = binColor;
        cameraContainer.appendChild(indicator);
    }
    
    async function startCamera() {
        try {
            const constraints = {
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'environment'
                },
                audio: false
            };
            
            cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('📹 Камера запущена');
            
        } catch (error) {
            try {
                cameraStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false
                });
                console.log('📹 Камера запущена (любая доступная)');
                
            } catch (secondError) {
                console.error('❌ Не удалось получить доступ к камере:', secondError);
                throw secondError;
            }
        }
    }
    
    function redirectCameraStream(stateNumber) {
        if (!cameraStream) return;
        
        let videoElement;
        switch(stateNumber) {
            case 2: videoElement = document.getElementById('camera-stream'); break;
            case 3: videoElement = document.getElementById('camera-stream-2'); break;
            case 4: videoElement = document.getElementById('camera-stream-3'); break;
            case 5: videoElement = document.getElementById('camera-stream-4'); break;
        }
        
        if (videoElement) {
            videoElement.srcObject = cameraStream;
            videoElement.play().catch(e => console.log('Ошибка воспроизведения:', e));
        }
    }
    
    function showError(message) {
        const errorDesc = document.querySelector('.error-description');
        if (errorDesc) {
            errorDesc.innerHTML = message;
        }
        state1.classList.remove('active');
        state4.classList.add('active');
        
        if (cameraStream) {
            redirectCameraStream(4);
        }
    }

    // ========== РУЧНОЙ ВЫБОР ==========
    function initManualSelectionPage() {
        const plasticTypes = {
            'pet': 'pet_bottle',
            'hdpe': 'hdpe_bottle', 
            'pvc': 'special_plastic',
            'ldpe': 'hdpe_bag',
            'pp': 'pp_clean',
            'ps': 'foam_food',
            'paper': 'paper_clean' 
        };
        
        const plasticItems = document.querySelectorAll('.plastic-type-item');
        
        plasticItems.forEach(item => {
            item.addEventListener('click', function() {
                const plasticType = this.dataset.type;
                const wasteType = plasticTypes[plasticType];
                
                if (!wasteType) return;
                
                plasticItems.forEach(i => i.classList.remove('selected'));
                this.classList.add('selected');
                
                setTimeout(() => {
                    showManualSelectionResult(wasteType);
                }, 1000);
            });
        });
    }
    
    function showManualSelectionResult(wasteType) {
        const wasteData = wasteDatabase[wasteType];
        if (!wasteData) return;
        
        updateResultPage(wasteData);
        state5.classList.remove('active');
        state3.classList.add('active');
    }
    
    function goToManualSelection() {
        console.log('Переход к ручному выбору');
        stopContinuousScanning();
        
        if (resultTimeout) {
            clearTimeout(resultTimeout);
            resultTimeout = null;
        }
        
        if (!cameraStream) {
            startCamera().then(() => {
                redirectCameraStream(5);
            }).catch(error => {
                console.log('Камера недоступна, но продолжаем без нее');
            });
        } else {
            redirectCameraStream(5);
        }
        
        state1.classList.remove('active');
        state2.classList.remove('active');
        state3.classList.remove('active');
        state4.classList.remove('active');
        state5.classList.add('active');
    }
    
    function goBackFromManual() {
        console.log('Возврат из ручного выбора');
        state5.classList.remove('active');
        state1.classList.add('active');
        stopCamera();
    }
    
    function resetToState1() {
        console.log('Сброс к состоянию 1');
        stopContinuousScanning();
        
        if (resultTimeout) {
            clearTimeout(resultTimeout);
            resultTimeout = null;
        }
        
        stopCamera();
        
        state2.classList.remove('active');
        state3.classList.remove('active');
        state4.classList.remove('active');
        state5.classList.remove('active');
        state1.classList.add('active');
    }
    
    function stopCamera() {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => {
                track.stop();
            });
            cameraStream = null;
            console.log('📹 Камера остановлена');
        }
    }

    // ========== ГЛОБАЛЬНЫЕ ФУНКЦИИ ==========
    window.goBackFromManual = goBackFromManual;
    window.resetToState1 = resetToState1;
    window.goToManualSelection = goToManualSelection;
    
    // Тестовая функция
    window.testMLAPI = async function() {
        console.log("🧪 Тестирование ML API...");
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(100, 100, 200, 300);
        ctx.fillStyle = '#388E3C';
        ctx.fillRect(180, 70, 40, 40);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 40px Arial';
        ctx.fillText('PLASTIC', 130, 250);
        
        const testImage = canvas.toDataURL('image/jpeg', 0.8);
        
        try {
            const result = await sendToMLAPI(testImage);
            if (result.success) {
                console.log("✅ Тест ML API выполнен");
                alert(`Тест успешен! Распознано: ${result.best_prediction.name}`);
            } else {
                console.log("⚠️ Тест не распознал объект");
                alert("Тест: объект не распознан (это нормально для тестового изображения)");
            }
        } catch (error) {
            console.error("❌ Тест ML API не удался:", error);
            alert("Тест не удался: " + error.message);
        }
    };
});
// ========== КОНЕЦ ФАЙЛА script.js ==========