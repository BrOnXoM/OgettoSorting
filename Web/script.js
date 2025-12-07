document.addEventListener('DOMContentLoaded', function() {
 console.log('Eco Assistant загружен');
 
 const state1 = document.getElementById('state1');
 const state2 = document.getElementById('state2');
 const state3 = document.getElementById('state3');
 const state4 = document.getElementById('state4');
 
 const currentMeadowImage = document.getElementById('current-meadow-image');
 const progressFill = document.querySelector('.progress-fill');
 const levelValue = document.querySelector('.level-value');
 const currentProgress = document.querySelector('.current-progress');
 const totalProgress = document.querySelector('.total-progress');
 const stageNumber = document.querySelector('.stage-number');
 
 const binCounts = {
  recycle: document.querySelector('.bin-recycle .bin-count'),
  paper: document.querySelector('.bin-paper .bin-count'),
  waste: document.querySelector('.bin-waste .bin-count')
 };
 
 const totalStats = {
  total: document.querySelector('.total-stat:nth-child(1) .total-value'),
  sorted: document.querySelector('.total-stat:nth-child(2) .total-value'),
  percent: document.querySelector('.total-stat:nth-child(3) .total-value')
 };
 
 const resultObject = document.getElementById('result-object');
 const resultInstructions = document.getElementById('result-instructions');
 const scanAgainBtn = document.querySelector('.scan-again-btn');
 const scanTimer = document.getElementById('scan-timer');
 
 let statistics = {
  total: 0,
  recycle: 0,
  paper: 0,
  waste: 0,
  level: 1,
  progress: 0
 };
 
 const LEVEL_THRESHOLD = 100;
 const MEADOW_STAGES = [
  { level: 1, name: "Загрязненная", image: "meadow/level1.png" },
  { level: 2, name: "Очищается", image: "meadow/level2.png" },
  { level: 3, name: "Чистая", image: "meadow/level3.png" },
  { level: 4, name: "Цветет", image: "meadow/level4.png" },
  { level: 5, name: "Райский сад", image: "meadow/level5.png" }
 ];
 
 let cameraStream = null;
 let scanTimerInterval = null;
 let scanTimeout = null;
 const SCAN_DURATION = 15;
 let currentScanTime = SCAN_DURATION;

 const wasteDatabase = {
  pet_bottle: {
   name: "Пластик",
   category: "Пластик",
   bin: "recycle",
   icon: "icons/pet-icon.png",
   instructions: [
    "Открутите крышку",
    "Промойте водой",
    "Снимите этикетку",
    "Смять бутылку",
    "Выбросить в перерабатываемый пластик"
   ]
  },
  hdpe_bottle: {
   name: "Флаконы из плотного пластика",
   category: "Пластик",
   bin: "recycle",
   icon: "icons/hdpe-icon.png",
   instructions: [
    "Промыть водой",
    "Удалить наклейки",
    "Высушить",
    "Выбросить в перерабатываемый пластик"
   ]
  },
  paper_clean: {
   name: "Бумага и картон",
   category: "Бумага",
   bin: "paper",
   icon: "icons/paper-icon.png",
   instructions: [
    "Удалить скотч и скобы",
    "Снять полиэтиленовую плёнку",
    "Сплющить коробки",
    "Выбросить в контейнер для бумаги"
   ]
  },
  pp_clean: {
   name: "Пищевые контейнеры",
   category: "Пластик",
   bin: "recycle",
   icon: "icons/pp-icon.png",
   instructions: [
    "Снять наклейки",
    "Вымыть от остатков пищи",
    "Высушить",
    "Выбросить в перерабатываемый пластик"
   ]
  },
  dirty: {
   name: "Загрязнённый пластик",
   category: "Отходы",
   bin: "waste",
   icon: "icons/pp-dirty-icon.png",
   instructions: [
    "Удалите крупные остатки пищи",
    "Сложите компактно",
    "Выбросите в неперерабатываемые отходы"
   ]
  },
  other: {
   name: "Сложные отходы",
   category: "Отходы",
   bin: "waste",
   icon: "icons/mixed-icon.png",
   instructions: [
    "Удалите остатки продукта",
    "Сложите компактно",
    "Выбросите в неперерабатываемые отходы"
   ]
  }
 };

 loadStatistics();
 updateGamificationUI();
 initManualSelectionPage();

 function loadStatistics() {
  try {
   const savedStats = localStorage.getItem('ecoStatistics');
   if (savedStats) {
    statistics = JSON.parse(savedStats);
    console.log('📊 Статистика загружена:', statistics);
   }
  } catch (e) {
   console.log('⚠️ Не удалось загрузить статистику, используем значения по умолчанию');
  }
 }
 
 function saveStatistics() {
  try {
   localStorage.setItem('ecoStatistics', JSON.stringify(statistics));
  } catch (e) {
   console.log('⚠️ Не удалось сохранить статистику');
  }
 }
 
 function addToStatistics(binType) {
  statistics.total++;
  
  switch(binType) {
   case 'recycle': statistics.recycle++; break;
   case 'paper': statistics.paper++; break;
   case 'waste': statistics.waste++; break;
  }
  
  statistics.progress = (statistics.total % LEVEL_THRESHOLD);
  
  const newLevel = Math.floor(statistics.total / LEVEL_THRESHOLD) + 1;
  if (newLevel > statistics.level && newLevel <= MEADOW_STAGES.length) {
   statistics.level = newLevel;
  }
  
  updateGamificationUI();
  saveStatistics();
 }
 
 function updateGamificationUI() {
  const currentStage = MEADOW_STAGES[statistics.level - 1];
  if (currentStage) {
   const img = new Image();
   img.onload = function() {
    currentMeadowImage.style.backgroundImage = `url('${currentStage.image}')`;
    currentMeadowImage.style.backgroundSize = 'cover';
    currentMeadowImage.style.backgroundPosition = 'center center';
    currentMeadowImage.style.backgroundRepeat = 'no-repeat';
   };
   img.onerror = function() {
    currentMeadowImage.style.backgroundColor = '#FFF8E1';
    currentMeadowImage.style.backgroundImage = 'none';
   };
   img.src = currentStage.image;
   
   stageNumber.textContent = `Уровень ${statistics.level}`;
  }
  
  const progressPercentage = (statistics.progress / LEVEL_THRESHOLD) * 100;
  progressFill.style.width = `${progressPercentage}%`;
  
  levelValue.textContent = statistics.level;
  currentProgress.textContent = statistics.progress;
  totalProgress.textContent = LEVEL_THRESHOLD;
  
  binCounts.recycle.textContent = statistics.recycle;
  binCounts.paper.textContent = statistics.paper;
  binCounts.waste.textContent = statistics.waste;
  
  const sorted = statistics.recycle + statistics.paper;
  const percent = statistics.total > 0 ? Math.round((sorted / statistics.total) * 100) : 0;
  
  totalStats.total.textContent = statistics.total;
  totalStats.sorted.textContent = sorted;
  totalStats.percent.textContent = `${percent}%`;
 }

 function preloadMeadowImages() {
  MEADOW_STAGES.forEach(stage => {
   const img = new Image();
   img.src = stage.image;
  });
 }

 preloadMeadowImages();

 const cameraFeedInactive = state1.querySelector('.camera-feed.inactive');
 const manualBtns = document.querySelectorAll('.manual-btn');
 
 cameraFeedInactive.addEventListener('click', startScanning);
 
 manualBtns.forEach(btn => {
  btn.addEventListener('click', goToManualSelection);
 });
 
 if (scanAgainBtn) {
  scanAgainBtn.addEventListener('click', function() {
   stopScanning();
   state3.classList.remove('active');
   state1.classList.add('active');
  });
 }

 async function startScanning() {
  console.log('🔍 Начало сканирования');
  
  try {
   if (cameraStream) {
    redirectCameraStream(2);
   } else {
    await startCamera();
    redirectCameraStream(2);
   }
   
   state1.classList.remove('active');
   state2.classList.add('active');
   
   startScanTimer();
   startAutoDetection();
   
  } catch (error) {
   console.error('❌ Ошибка камеры:', error);
   goToManualSelection();
  }
 }
 
 function startScanTimer() {
  currentScanTime = SCAN_DURATION;
  updateTimerDisplay();
  
  scanTimerInterval = setInterval(() => {
   currentScanTime--;
   updateTimerDisplay();
   
   if (currentScanTime <= 0) {
    stopScanTimer();
    handleAutoDetectionTimeout();
   }
  }, 1000);
 }
 
 function updateTimerDisplay() {
  if (scanTimer) {
   scanTimer.textContent = `${currentScanTime} сек`;
  }
 }
 
 function stopScanTimer() {
  if (scanTimerInterval) {
   clearInterval(scanTimerInterval);
   scanTimerInterval = null;
  }
 }
 
 async function startAutoDetection() {
  console.log('🤖 Начало автоматического распознавания');
  
  let attempts = 0;
  const maxAttempts = 10;
  const attemptInterval = 1500;
  
  const detectionInterval = setInterval(async () => {
   attempts++;
   
   try {
    const imageData = await captureImage();
    const result = await sendToMLAPI(imageData);
    
    if (result.success) {
     console.log(`✅ Успешно распознано на попытке ${attempts}!`);
     clearInterval(detectionInterval);
     stopScanTimer();
     processMLResult(result);
    } else if (attempts >= maxAttempts) {
     clearInterval(detectionInterval);
    }
   } catch (error) {
    if (attempts >= maxAttempts) {
     clearInterval(detectionInterval);
    }
   }
  }, attemptInterval);
  
  scanTimeout = setTimeout(() => {
   clearInterval(detectionInterval);
   console.log('⏰ Время сканирования истекло');
  }, SCAN_DURATION * 1000);
 }
 
 function handleAutoDetectionTimeout() {
  const wasteData = wasteDatabase.dirty;
  updateResultPage(wasteData);
  
  if (resultObject) {
   resultObject.textContent = "Не удалось определить";
  }
  
  if (resultInstructions) {
   resultInstructions.innerHTML = `
    <div class="instruction">- Скорее всего, неперерабатываемый отход</div>
    <div class="instruction">- Выберите тип вручную</div>
    <div class="instruction">- Или выбросите в неперерабатываемые отходы</div>
   `;
  }
  
  state2.classList.remove('active');
  state3.classList.add('active');
  addToStatistics('waste');
 }
 
 function stopScanning() {
  stopScanTimer();
  if (scanTimeout) {
   clearTimeout(scanTimeout);
   scanTimeout = null;
  }
 }

 async function sendToMLAPI(imageData) {
  try {
   const response = await fetch('/api/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageData })
   });
   
   return await response.json();
   
  } catch (error) {
   return { success: false, message: 'Ошибка соединения' };
  }
 }
 
 function processMLResult(result) {
  if (result.success && result.best_prediction) {
   const prediction = result.best_prediction;
   let wasteData = matchPredictionToDatabase(prediction);
   
   updateResultPage(wasteData);
   state2.classList.remove('active');
   state3.classList.add('active');
   
   console.log(`🎯 Распознано: ${wasteData.name}`);
   addToStatistics(wasteData.bin);
   
  } else {
   handleAutoDetectionTimeout();
  }
 }
 
 function matchPredictionToDatabase(prediction) {
  const classMapping = {
   'plastic': ['pet_bottle', 'hdpe_bottle', 'pp_clean'],
   'paper': ['paper_clean'],
   '0': ['pet_bottle', 'hdpe_bottle', 'pp_clean'],
   '1': ['paper_clean']
  };
  
  let wasteKeys = classMapping[prediction.class] || [];
  
  for (let key of wasteKeys) {
   if (wasteDatabase[key]) {
    return wasteDatabase[key];
   }
  }
  
  return wasteDatabase.dirty;
 }

 function updateResultPage(wasteData) {
  if (resultObject) {
   resultObject.textContent = wasteData.name;
  }
  
  if (resultInstructions) {
   resultInstructions.innerHTML = '';
   
   if (wasteData.bin === 'paper') {
    const paperInstructions = [
     "Удалите скотч и металлические скобы",
     "Снимите полиэтиленовую плёнку с упаковок",
     "Сплющите коробки для экономии места",
     "Сложите компактно и выбросьте в бумагу"
    ];
    
    paperInstructions.forEach(instruction => {
     const div = document.createElement('div');
     div.className = 'instruction';
     div.textContent = instruction;
     resultInstructions.appendChild(div);
    });
   } else {
    wasteData.instructions.forEach(instruction => {
     const div = document.createElement('div');
     div.className = 'instruction';
     div.textContent = instruction;
     resultInstructions.appendChild(div);
    });
   }
  }
  
  highlightBin(wasteData.bin);
  updateBinNumber(wasteData.bin);
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
  
  if (binElement) {
   binElement.classList.add('active');
  }
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
  }
  
  if (videoElement) {
   videoElement.srcObject = cameraStream;
   videoElement.play().catch(e => console.log('Ошибка воспроизведения:', e));
  }
 }

 function initManualSelectionPage() {
  const plasticTypes = {
   'pet': 'pet_bottle',
   'hdpe': 'hdpe_bottle',
   'pp': 'pp_clean',
   'paper': 'paper_clean',
   'dirty': 'dirty',
   'other': 'other'
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
  addToStatistics(wasteData.bin);
  
  state4.classList.remove('active');
  state3.classList.add('active');
 }
 
 function goToManualSelection() {
  console.log('Переход к ручному выбору');
  stopScanning();
  
  if (!cameraStream) {
   startCamera().then(() => {
    redirectCameraStream(4);
   }).catch(error => {
    console.log('Камера недоступна');
   });
  } else {
   redirectCameraStream(4);
  }
  
  state1.classList.remove('active');
  state2.classList.remove('active');
  state3.classList.remove('active');
  state4.classList.add('active');
 }
 
 function goBackFromManual() {
  console.log('Возврат из ручного выбора');
  state4.classList.remove('active');
  state1.classList.add('active');
  stopCamera();
 }
 
 function stopCamera() {
  if (cameraStream) {
   cameraStream.getTracks().forEach(track => track.stop());
   cameraStream = null;
  }
 }

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
  
  return canvas.toDataURL('image/jpeg', 0.8);
 }
 
 function showBinIndicator(binType, wasteName) {
  const oldIndicator = document.querySelector('.bin-indicator');
  if (oldIndicator) oldIndicator.remove();
  
  let cameraContainer;
  if (state3.classList.contains('active')) {
   cameraContainer = state3.querySelector('.camera-container');
  } else if (state4.classList.contains('active')) {
   cameraContainer = state4.querySelector('.camera-container');
  }
  
  if (!cameraContainer) return;
  
  const indicator = document.createElement('div');
  indicator.className = 'bin-indicator';
  
  let binText, binColor, icon;
  switch(binType) {
   case 'recycle':
    binText = 'В КОНТЕЙНЕР ДЛЯ ПЛАСТИКА ♻️';
    binColor = '#4CAF50';
    icon = '♻️';
    break;
   case 'waste':
    binText = 'В ОБЩИЕ ОТХОДЫ 🚫';
    binColor = '#FF5722';
    icon = '🚫';
    break;
   case 'paper':
    binText = 'В КОНТЕЙНЕР ДЛЯ БУМАГИ 📄';
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

 window.addEventListener('beforeunload', function(e) {
  saveStatistics();
  if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
 });

 function updateBinNumber(binType) {
  document.querySelectorAll('.bin-number').forEach(num => {
   num.style.display = 'none';
  });
  
  let binNumberElement;
  switch(binType) {
   case 'recycle':
    binNumberElement = document.querySelector('#bin-recycle .bin-number');
    break;
   case 'waste':
    binNumberElement = document.querySelector('#bin-waste .bin-number');
    break;
   case 'paper':
    binNumberElement = document.querySelector('#bin-paper .bin-number');
    break;
  }
  
  if (binNumberElement) {
   binNumberElement.style.display = 'block';
   
   const binIndex = binNumberElement.getAttribute('data-bin-index');
   binNumberElement.textContent = `${binIndex}-й`;
  }
 }

 window.goBackFromManual = goBackFromManual;
 window.goToManualSelection = goToManualSelection;
 window.resetToState1 = function() {
  stopScanning();
  stopCamera();
  state2.classList.remove('active');
  state3.classList.remove('active');
  state4.classList.remove('active');
  state1.classList.add('active');
 };


 
});