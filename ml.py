import cv2
from ultralytics import YOLO

# ... (ваш код загрузки модели и CONF_THRESHOLD) ...
model_path = 'C:/Users/ASUS/Desktop/python/ML/runs/detect/train/weights/besti.pt'
model = YOLO(model_path)
CONF_THRESHOLD = 0.7 # Пример значения

cap = cv2.VideoCapture(0)


# Проверка, установилось ли разрешение (опционально)
width = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
height = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
print(f"Текущее разрешение камеры: {width}x{height}")

# ---------------------------------------------

while cap.isOpened():
    camera, frame = cap.read()

    if camera:
        # ... (остальной код обработки кадра) ...
        results = model(frame, conf=CONF_THRESHOLD)
        annotated_frame = results[0].plot()
        cv2.imshow("Object Detection", annotated_frame)
        if cv2.waitKey(1) & 0xFF == ord('p'):
            break
    else:
        break

cap.release()
cv2.destroyAllWindows()
