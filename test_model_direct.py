import sys
sys.path.insert(0, '/var/www/eco-ml/.venv/lib/python3.12/site-packages')

from ultralytics import YOLO
import cv2
import numpy as np

# Загружаем модель
model_path = "ML/runs/detect/train3/weights/best.pt"
print(f"Загружаю модель: {model_path}")

try:
    model = YOLO(model_path)
    print(f"✅ Модель загружена")
    print(f"Классы: {model.names}")
    
    # Создаем тестовое изображение (зеленый прямоугольник = пластик)
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    cv2.rectangle(img, (100, 100), (300, 300), (0, 255, 0), -1)  # Зеленый
    cv2.putText(img, "PLASTIC", (120, 200), cv2.FONT_HERSHEY_SIMPLEX, 2, (255, 255, 255), 3)
    
    # Предсказание
    results = model.predict(img, conf=0.5, verbose=False)
    
    print(f"\n📊 Результаты предсказания:")
    for result in results:
        boxes = result.boxes
        if boxes is not None:
            for box in boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                print(f"  Обнаружен: {model.names[cls_id]} ({conf:.2%})")
        else:
            print("  Ничего не обнаружено")
    
except Exception as e:
    print(f"❌ Ошибка: {e}")
    import traceback
    traceback.print_exc()
