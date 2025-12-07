from flask import Flask, request, jsonify, send_from_directory
from ultralytics import YOLO
import base64
import io
from PIL import Image
import numpy as np
import cv2
import yaml
import json
from datetime import datetime
import os
import collections

app = Flask(__name__, static_folder='.')

print("=" * 50)
print("🚀 Запуск Eco Assistant ML API с МНОЖЕСТВЕННЫМИ ДЕТЕКЦИЯМИ")
print("=" * 50)

# Загружаем модель
model = None
model_classes = {}

try:
    model_path = "ML/runs/detect/train3/weights/best.pt"
    print(f"📦 Загружаю модель: {model_path}")
    model = YOLO(model_path)
    model_classes = model.names
    print(f"✅ Модель загружена успешно!")
    print(f"📊 Классы: {model_classes}")
    print(f"🎯 Всего классов: {len(model_classes)}")
except Exception as e:
    print(f"❌ Ошибка загрузки модели: {e}")
    model = None

# Загружаем конфигурацию
config = {}
try:
    with open("ML/data.yaml", 'r') as f:
        config = yaml.safe_load(f)
    print(f"📄 Конфигурация загружена: {config.get('names', [])}")
except Exception as e:
    print(f"⚠️ Не удалось загрузить конфигурацию: {e}")

# Файл для статистики
STATS_FILE = "statistics.json"

def ensure_stats_file():
    """Создает файл статистики если его нет"""
    if not os.path.exists(STATS_FILE):
        default_stats = {
            "total": 0,
            "recycle": 0,
            "paper": 0,
            "waste": 0,
            "level": 1,
            "progress": 0,
            "last_updated": datetime.now().isoformat()
        }
        with open(STATS_FILE, 'w') as f:
            json.dump(default_stats, f, indent=2)

# Статические файлы
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/api/health')
def health():
    """Проверка здоровья сервиса"""
    return jsonify({
        "status": "healthy",
        "model_loaded": model is not None,
        "classes_count": len(model_classes) if model else 0,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/predict', methods=['POST'])
def predict():
    """Предсказание типа отхода с МНОЖЕСТВЕННЫМИ ДЕТЕКЦИЯМИ"""
    try:
        data = request.json
        if not data or 'image' not in data:
            return jsonify({
                "success": False,
                "error": "No image provided"
            }), 400
        
        # Декодируем base64 изображение
        image_data = data['image'].split(',')[1] if ',' in data['image'] else data['image']
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        
        # Конвертируем в numpy array
        img_np = np.array(image)
        print(f"📸 Получено изображение: {img_np.shape}")
        print("🤖 Начинаю анализ с МНОЖЕСТВЕННЫМИ детекциями...")
        
        if model is None:
            # Тестовый ответ для демонстрации
            import random
            classes = ['plastic', 'paper']
            test_class = random.choice(classes)
            return jsonify({
                "success": True,
                "best_prediction": {
                    "class": 0 if test_class == 'plastic' else 1,
                    "name": test_class,
                    "confidence": random.uniform(0.7, 0.95)
                },
                "message": f"Тестовое распознавание: {test_class}"
            })
        
        # УВЕЛИЧИВАЕМ КОЛИЧЕСТВО ДЕТЕКЦИЙ
        # Параметр max_det увеличиваем до 10-15
        results = model.predict(img_np, conf=0.15, verbose=False, max_det=15)
        
        # Собираем ВСЕ детекции
        all_detections = []
        class_counter = collections.Counter()
        confidence_by_class = collections.defaultdict(list)
        
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    confidence = float(box.conf[0])
                    class_id = int(box.cls[0])
                    class_name = model_classes.get(class_id, "unknown")
                    
                    detection = {
                        "class": class_id,
                        "name": class_name,
                        "confidence": confidence,
                        "bbox": box.xyxy[0].tolist() if hasattr(box, 'xyxy') else []
                    }
                    all_detections.append(detection)
                    class_counter[class_name] += 1
                    confidence_by_class[class_name].append(confidence)
        
        print(f"📊 Всего детекций: {len(all_detections)}")
        print(f"📈 Статистика по классам: {dict(class_counter)}")
        
        # УЛУЧШЕННЫЙ АЛГОРИТМ ВЫБОРА:
        # 1. Если есть детекции - анализируем статистику
        # 2. Берем класс с наибольшим количеством детекций
        # 3. Если количества равны - берем класс с наибольшей средней уверенностью
        # 4. Минимум 5 детекций для уверенного ответа
        
        best_class = None
        best_confidence = 0
        
        if class_counter:
            # Находим класс с максимальным количеством детекций
            max_count = max(class_counter.values())
            candidates = [cls for cls, count in class_counter.items() if count == max_count]
            
            if len(candidates) == 1:
                # Один кандидат - выбираем его
                best_class = candidates[0]
                # Средняя уверенность для этого класса
                if confidence_by_class[best_class]:
                    best_confidence = sum(confidence_by_class[best_class]) / len(confidence_by_class[best_class])
            else:
                # Несколько кандидатов с одинаковым количеством
                # Выбираем по максимальной средней уверенности
                best_avg_confidence = 0
                for cls in candidates:
                    if confidence_by_class[cls]:
                        avg_conf = sum(confidence_by_class[cls]) / len(confidence_by_class[cls])
                        if avg_conf > best_avg_confidence:
                            best_avg_confidence = avg_conf
                            best_class = cls
                            best_confidence = avg_conf
        
        # Формируем результат
        if best_class and len(all_detections) >= 5:  # Минимум 5 детекций
            # Находим лучшую детекцию для этого класса
            best_detection = None
            for det in all_detections:
                if det['name'] == best_class:
                    if best_detection is None or det['confidence'] > best_detection['confidence']:
                        best_detection = det
            
            if best_detection:
                class_id = 0 if best_class == 'plastic' else 1 if best_class == 'paper' else -1
                
                print(f"✅ ФИНАЛЬНЫЙ РЕЗУЛЬТАТ: {best_class}")
                print(f"   Количество детекций: {class_counter[best_class]}")
                print(f"   Средняя уверенность: {best_confidence:.2%}")
                print(f"   Лучшая уверенность: {best_detection['confidence']:.2%}")
                
                return jsonify({
                    "success": True,
                    "best_prediction": {
                        "class": class_id,
                        "name": best_class,
                        "confidence": best_detection['confidence']
                    },
                    "statistics": {
                        "total_detections": len(all_detections),
                        "class_counts": dict(class_counter),
                        "avg_confidence": best_confidence,
                        "detection_details": [
                            {"class": d['name'], "confidence": d['confidence']} 
                            for d in all_detections[:10]  # Первые 10 для отладки
                        ]
                    },
                    "message": f"Распознан: {best_class} (на основе {class_counter[best_class]} детекций)"
                })
        
        # Если недостаточно детекций или не удалось определить
        print(f"⚠️ Недостаточно детекций или низкая уверенность")
        print(f"   Всего детекций: {len(all_detections)}")
        print(f"   Распределение: {dict(class_counter)}")
        
        if all_detections:
            # Если есть хоть какие-то детекции
            # Выбираем самую уверенную
            best_detection = max(all_detections, key=lambda x: x['confidence'])
            if best_detection["confidence"] > 0.35:
                return jsonify({
                    "success": True,
                    "best_prediction": {
                        "class": best_detection['class'],
                        "name": best_detection['name'],
                        "confidence": best_detection['confidence']
                    },
                    "warning": "Мало детекций, результат может быть неточным",
                    "message": f"Возможно: {best_detection['name']}"
                })
        
        return jsonify({
            "success": False,
            "message": "Не удалось определить объект",
            "details": {
                "total_detections": len(all_detections),
                "class_distribution": dict(class_counter)
            },
            "suggestion": "Попробуйте другой ракурс, лучшее освещение или выберите вручную"
        })
            
    except Exception as e:
        print(f"❌ Ошибка предсказания: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "Ошибка обработки изображения"
        }), 500

@app.route('/api/stats/update', methods=['POST'])
def update_stats():
    """Обновление статистики геймификации"""
    try:
        ensure_stats_file()
        stats_data = request.json
        
        # Загружаем текущую статистику
        with open(STATS_FILE, 'r') as f:
            current_stats = json.load(f)
        
        # Обновляем статистику
        for key in ['total', 'recycle', 'paper', 'waste', 'level', 'progress']:
            if key in stats_data:
                current_stats[key] = stats_data[key]
        
        current_stats['last_updated'] = datetime.now().isoformat()
        
        # Сохраняем обновленную статистику
        with open(STATS_FILE, 'w') as f:
            json.dump(current_stats, f, indent=2)
        
        print(f"📊 Статистика обновлена: {current_stats}")
        
        return jsonify({
            "success": True,
            "message": "Статистика обновлена",
            "stats": current_stats,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Ошибка обновления статистики: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400

@app.route('/api/stats/get', methods=['GET'])
def get_stats():
    """Получение статистики"""
    try:
        ensure_stats_file()
        
        with open(STATS_FILE, 'r') as f:
            stats = json.load(f)
        
        return jsonify({
            "success": True,
            "statistics": stats,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Ошибка получения статистики: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    print("\n" + "=" * 50)
    print("🌐 Веб-приложение доступно по адресу: http://localhost:5000")
    print("📊 API эндпоинты:")
    print("   GET  /api/health - проверка здоровья")
    print("   POST /api/predict - распознавание отходов (МНОЖЕСТВЕННЫЕ ДЕТЕКЦИИ)")
    print("   POST /api/stats/update - обновление статистики")
    print("   GET  /api/stats/get - получение статистики")
    print("=" * 50 + "\n")
    
    # Создаем необходимые папки
    os.makedirs('meadow', exist_ok=True)
    os.makedirs('icons', exist_ok=True)
    
    app.run(host='0.0.0.0', port=5000, debug=False)
