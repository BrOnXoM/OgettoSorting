import base64
import requests
import numpy as np
import cv2

# Создаем тестовое изображение (зеленый прямоугольник)
img = np.zeros((480, 640, 3), dtype=np.uint8)
cv2.rectangle(img, (100, 100), (400, 300), (0, 255, 0), -1)  # Зеленый = пластик
cv2.putText(img, "PLASTIC", (150, 250), cv2.FONT_HERSHEY_SIMPLEX, 2, (255, 255, 255), 3)

# Конвертируем в base64
_, buffer = cv2.imencode('.jpg', img)
img_base64 = base64.b64encode(buffer).decode('utf-8')

# Отправляем запрос
response = requests.post('http://localhost:5000/api/predict', 
                         json={'image': img_base64},
                         timeout=10)

print(f"Статус: {response.status_code}")
print(f"Ответ: {response.json()}")
