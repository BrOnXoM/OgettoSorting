document.addEventListener('DOMContentLoaded', function() {
    console.log('Скрипт загружен');
    
    const state1 = document.getElementById('state1');
    const state2 = document.getElementById('state2');
    const state3 = document.getElementById('state3');
    const state4 = document.getElementById('state4');
    const state5 = document.getElementById('state5');
    const cameraFeedInactive = state1.querySelector('.camera-feed.inactive');
    const manualBtns = document.querySelectorAll('.manual-btn');
    const gotoManualBtn = document.getElementById('goto-manual');
    const testErrorBtn = document.querySelector('.test-error-btn');
    
    let cameraStream = null;
    let resultTimeout = null;

    // База данных отходов с 3-контейнерной системой
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
            preparation: "Желательно смятая, без органики"
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

    // Инициализация
    initManualSelectionPage();

    // Обработчики событий
    cameraFeedInactive.addEventListener('click', startScanning);
    
    document.querySelector('main').addEventListener('click', function(e) {
        if (state1.classList.contains('active') && 
            !e.target.closest('.yellow-btn') && 
            !e.target.closest('.error-btn')) {
            startScanning();
        }
    });
    
    // Кнопки "Найти вручную"
    manualBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            goToManualSelection();
        });
    });
    
    // Кнопка теста ошибки
    if (testErrorBtn) {
        testErrorBtn.addEventListener('click', function() {
            if (resultTimeout) {
                clearTimeout(resultTimeout);
                resultTimeout = null;
            }
            
            state2.classList.remove('active');
            state4.classList.add('active');
        });
    }

    // Основные функции
    async function startScanning() {
        console.log('Начало сканирования');
        
        try {
            if (cameraStream) {
                redirectCameraStream(2);
            } else {
                await startCamera();
                redirectCameraStream(2);
            }
            
            state1.classList.remove('active');
            state2.classList.add('active');
            
            resultTimeout = setTimeout(() => {
                if (state2.classList.contains('active')) {
                    // По умолчанию показываем ПЭТ-бутылку
                    const defaultWaste = wasteDatabase['pet_bottle'];
                    
                    // Обновляем информацию на странице 3
                    updateResultPage(defaultWaste);
                    
                    // Переходим к состоянию 3
                    state2.classList.remove('active');
                    state3.classList.add('active');
                }
            }, 1000);
            
        } catch (error) {
            console.error('Ошибка камеры:', error);
            showError('Не удалось получить доступ к камере. Выберите категорию вручную.');
        }
    }
    
    // Показать результат сканирования
    function showScanResult(wasteType) {
        const wasteData = wasteDatabase[wasteType];
        
        if (!wasteData) return;
        
        // Обновляем информацию на странице 3
        updateResultPage(wasteData);
        
        // Переходим к состоянию 3
        state2.classList.remove('active');
        state3.classList.add('active');
    }
    
    function updateResultPage(wasteData) {
        console.log('Обновляем страницу результата для:', wasteData.name);
        
        const infoText = document.querySelector('#state3 .info-text');
        const instructions = document.querySelector('#state3 .instructions');
        
        if (infoText) {
            infoText.textContent = wasteData.name;
            console.log('Обновили текст объекта:', wasteData.name);
        }
        
        if (instructions) {
            instructions.innerHTML = '';
            wasteData.instructions.forEach(instruction => {
                const div = document.createElement('div');
                div.className = 'instruction';
                div.textContent = `- ${instruction}`;
                instructions.appendChild(div);
            });
            console.log('Добавили инструкции:', wasteData.instructions.length);
        }
        
        // Подсветка нужного контейнера
        highlightBin(wasteData.bin);
        console.log('Подсветили контейнер:', wasteData.bin);
        
        // Показываем большой яркий индикатор контейнера ВНУТРИ камеры
        console.log('Вызываем showBinIndicator...');
        showBinIndicator(wasteData.bin, wasteData.name);
        
        // Перенаправляем камеру
        redirectCameraStream(3);
    }
    
    // Подсветка контейнера
    function highlightBin(binType) {
        // Убираем активный класс у всех контейнеров
        document.querySelectorAll('.progress-segment').forEach(segment => {
            segment.classList.remove('active');
        });
        
        // Добавляем активный класс нужному контейнеру
        let binElement;
        switch(binType) {
            case 'recycle':
                binElement = document.getElementById('bin-recycle');
                break;
            case 'waste':
                binElement = document.getElementById('bin-waste');
                break;
            case 'paper':
                binElement = document.getElementById('bin-paper');
                break;
        }
        
        if (binElement) {
            binElement.classList.add('active');
        }
    }
    
    // Показать большой индикатор контейнера ВНУТРИ камеры (горизонтальная полоска)
    function showBinIndicator(binType, wasteName) {
        console.log('Показываем индикатор для типа:', binType, wasteName);
        
        // Удаляем старый индикатор если есть
        const oldIndicator = document.querySelector('.bin-indicator');
        if (oldIndicator) {
            oldIndicator.remove();
            console.log('Удалили старый индикатор');
        }
        
        // Находим контейнер камеры на ТЕКУЩЕЙ активной странице
        let cameraContainer;
        let currentState;
        
        if (state3.classList.contains('active')) {
            cameraContainer = state3.querySelector('.camera-container');
            currentState = state3;
            console.log('Нашли камеру на state3');
        } else if (state5.classList.contains('active')) {
            cameraContainer = state5.querySelector('.camera-container');
            currentState = state5;
            console.log('Нашли камеру на state5');
        } else {
            console.error('Не нашли активную камеру!');
            return;
        }
        
        if (!cameraContainer) {
            console.error('Не найден camera-container!');
            return;
        }
        
        // Создаем новый индикатор
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
            default:
                binText = 'ОШИБКА КОНТЕЙНЕРА';
                binColor = '#9E9E9E';
                icon = '❓';
        }
        
        // Устанавливаем атрибут типа сразу
        indicator.setAttribute('data-bin-type', binType);
        
        indicator.innerHTML = `
            <div class="bin-indicator-content">
                <div class="bin-indicator-icon">${icon}</div>
                <div class="bin-indicator-text">${binText}</div>
            </div>
        `;
        
        // Устанавливаем стиль фона
        indicator.style.backgroundColor = binColor;
        
        // Добавляем индикатор внутрь контейнера камеры
        cameraContainer.appendChild(indicator);
        console.log('Добавили индикатор в камеру:', indicator);
        
        // Принудительно применяем стили
        setTimeout(() => {
            indicator.style.display = 'flex';
            indicator.style.visibility = 'visible';
            indicator.style.opacity = '1';
        }, 10);
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
            console.log('Камера запущена');
            
        } catch (error) {
            try {
                cameraStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false
                });
                console.log('Камера запущена (любая доступная)');
                
            } catch (secondError) {
                console.error('Не удалось получить доступ ни к одной камере:', secondError);
                throw secondError;
            }
        }
    }
    
    function redirectCameraStream(stateNumber) {
        if (!cameraStream) return;
        
        let videoElement;
        switch(stateNumber) {
            case 2:
                videoElement = document.getElementById('camera-stream');
                break;
            case 3:
                videoElement = document.getElementById('camera-stream-2');
                break;
            case 4:
                videoElement = document.getElementById('camera-stream-3');
                break;
            case 5:
                videoElement = document.getElementById('camera-stream-4');
                break;
        }
        
        if (videoElement) {
            videoElement.srcObject = cameraStream;
            videoElement.play().catch(e => console.log('Ошибка воспроизведения:', e));
        }
    }
    
    function goToManualSelection() {
        console.log('Переход к ручному выбору');
        
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
            console.log('Камера остановлена');
            
            const videoElements = [
                document.getElementById('camera-stream'),
                document.getElementById('camera-stream-2'),
                document.getElementById('camera-stream-3'),
                document.getElementById('camera-stream-4')
            ];
            
            videoElements.forEach(video => {
                if (video) {
                    video.srcObject = null;
                    video.pause();
                }
            });
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

    // Инициализация страницы ручного выбора
    function initManualSelectionPage() {
        // Назначаем обработчики для каждого типа пластика
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
                
                // Добавляем класс выбранного элемента
                plasticItems.forEach(i => i.classList.remove('selected'));
                this.classList.add('selected');
                
                // Через 1 секунду показываем результат
                setTimeout(() => {
                    showManualSelectionResult(wasteType);
                }, 1000);
            });
        });
    }


    // Добавьте эту функцию и вызовите её при загрузке
    function debugIndicators() {
        console.log('=== DEBUG ИНДИКАТОРОВ ===');
        console.log('state3 активен?', state3.classList.contains('active'));
        console.log('state5 активен?', state5.classList.contains('active'));
        
        const cameraContainer3 = state3.querySelector('.camera-container');
        const cameraContainer5 = state5.querySelector('.camera-container');
        
        console.log('Камера в state3:', cameraContainer3);
        console.log('Камера в state5:', cameraContainer5);
        console.log('Стили camera-container state3:', window.getComputedStyle(cameraContainer3).position);
        console.log('Стили camera-container state5:', window.getComputedStyle(cameraContainer5).position);
        
        const indicators = document.querySelectorAll('.bin-indicator');
        console.log('Найдено индикаторов:', indicators.length);
        indicators.forEach((ind, i) => {
            console.log(`Индикатор ${i}:`, ind);
            console.log(`  Стили:`, window.getComputedStyle(ind).position, window.getComputedStyle(ind).visibility);
        });
    }

// Вызовите в конце DOMContentLoaded:
debugIndicators();
    
    // Результат ручного выбора
    function showManualSelectionResult(wasteType) {
        const wasteData = wasteDatabase[wasteType];
        
        if (!wasteData) return;
        
        updateResultPage(wasteData);
        state5.classList.remove('active');
        state3.classList.add('active');
    }

    // Глобальные функции
    window.goBackFromManual = goBackFromManual;
    window.resetToState1 = resetToState1;
    window.goToManualSelection = goToManualSelection;

    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('manual-btn')) {
            if (state3.classList.contains('active') || state4.classList.contains('active')) {
                goToManualSelection();
            }
        }
    });
});