document.addEventListener('DOMContentLoaded', function() {
    const state1 = document.getElementById('state1');
    const state2 = document.getElementById('state2');
    const state3 = document.getElementById('state3');
    const state4 = document.getElementById('state4');
    const cameraFeedInactive = state1.querySelector('.camera-feed.inactive');
    const manualBtns = document.querySelectorAll('.manual-btn');
    const testErrorBtn = document.querySelector('.test-error-btn');
    
    let cameraStream = null;
    let cameraStream2 = null;
    let cameraStream3 = null;
    
    // Нажатие на камеру для начала сканирования
    cameraFeedInactive.addEventListener('click', startScanning);
    
    // Нажатие на весь main (кроме уже обработанных элементов)
    document.querySelector('main').addEventListener('click', function(e) {
        // Если клик на camera-feed.inactive, он уже обработан
        if (!e.target.closest('.camera-feed.inactive') && 
            !e.target.closest('.yellow-btn') &&
            !e.target.closest('.error-btn') &&
            state1.classList.contains('active')) {
            startScanning();
        }
    });
    
    // Кнопка "Найти вручную" возвращает на начальный экран
    manualBtns.forEach(btn => {
        btn.addEventListener('click', resetToState1);
    });
    
    // Кнопка для тестирования ошибки идентификации
    testErrorBtn.addEventListener('click', function() {
        // Запускаем камеру для состояния 4
        startCameraForState4();
        
        state2.classList.remove('active');
        state4.classList.add('active');
    });
    
    async function startScanning() {
        try {
            // Запускаем камеру для состояния 2
            await startCameraForState2();
            
            // Переходим к состоянию 2 (загрузка)
            state1.classList.remove('active');
            state2.classList.add('active');
            
            // Через 5 секунд переходим к состоянию 4 (ошибка), если не перешли к состоянию 3
            const errorTimeout = setTimeout(async () => {
                if (state2.classList.contains('active')) {
                    // Запускаем камеру для состояния 4
                    await startCameraForState4();
                    
                    state2.classList.remove('active');
                    state4.classList.add('active');
                    
                    // Останавливаем камеру состояния 2
                    stopCamera(cameraStream);
                }
            }, 5000);
            
            // Отменяем таймаут ошибки если успешно перешли к результату
            setTimeout(async () => {
                clearTimeout(errorTimeout);
                if (state2.classList.contains('active')) {
                    // Запускаем камеру для состояния 3
                    await startCameraForState3();
                    
                    state2.classList.remove('active');
                    state3.classList.add('active');
                    
                    // Останавливаем камеру состояния 2
                    stopCamera(cameraStream);
                }
            }, 1000);
            
        } catch (error) {
            console.error('Ошибка при запуске камеры:', error);
            // Если камера не доступна, показываем состояние 4
            state1.classList.remove('active');
            state4.classList.add('active');
        }
    }
    
    function resetToState1() {
        // Останавливаем все камеры
        stopCamera(cameraStream);
        stopCamera(cameraStream2);
        stopCamera(cameraStream3);
        
        // Возвращаемся к состоянию 1
        state2.classList.remove('active');
        state3.classList.remove('active');
        state4.classList.remove('active');
        state1.classList.add('active');
    }
    
    async function startCameraForState2() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Используем заднюю камеру
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });
            
            const videoElement = document.getElementById('camera-stream');
            videoElement.srcObject = stream;
            cameraStream = stream;
            
            return stream;
        } catch (error) {
            console.error('Ошибка доступа к камере:', error);
            throw error;
        }
    }
    
    async function startCameraForState3() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });
            
            const videoElement = document.getElementById('camera-stream-2');
            videoElement.srcObject = stream;
            cameraStream2 = stream;
            
            return stream;
        } catch (error) {
            console.error('Ошибка доступа к камере для состояния 3:', error);
            throw error;
        }
    }
    
    async function startCameraForState4() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });
            
            const videoElement = document.getElementById('camera-stream-3');
            videoElement.srcObject = stream;
            cameraStream3 = stream;
            
            return stream;
        } catch (error) {
            console.error('Ошибка доступа к камере для состояния 4:', error);
            throw error;
        }
    }
    
    function stopCamera(stream) {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    }
});