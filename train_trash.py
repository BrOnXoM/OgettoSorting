from ultralytics import *
model = YOLO('runs/detect/train/weights/best2.pt')
print("training start")
# кол-во проходов  |  размер изображения  |  кол-во фото одновременно обрабатывающихся
result = model.train(data = 'data.yaml', epochs=50, imgsz=640, batch=8)
print("training end")
