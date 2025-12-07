import sys
sys.path.insert(0, '/var/www/eco-ml/.venv/lib/python3.12/site-packages')

from ultralytics import YOLO
import os
import yaml

print("🔍 Проверка всех доступных моделей в ML/")
print("=" * 50)

# Находим все модели
model_files = []
for root, dirs, files in os.walk("ML"):
    for file in files:
        if file.endswith(".pt"):
            full_path = os.path.join(root, file)
            model_files.append(full_path)

print(f"Найдено {len(model_files)} моделей:\n")

for i, model_path in enumerate(model_files, 1):
    size_mb = os.path.getsize(model_path) / 1024 / 1024
    print(f"{i}. {model_path} ({size_mb:.1f} MB)")
    
    # Пробуем загрузить только лучшие модели
    if "best.pt" in model_path or size_mb > 5:
        try:
            model = YOLO(model_path)
            print(f"   ✅ Загружена | Классы: {model.names}")
            print(f"   📊 Всего классов: {len(model.names)}")
        except Exception as e:
            print(f"   ❌ Ошибка загрузки: {str(e)[:100]}...")
    print()

# Проверяем data.yaml
print("=" * 50)
print("📁 Проверка data.yaml:")
yaml_path = "ML/data.yaml"
if os.path.exists(yaml_path):
    with open(yaml_path, 'r') as f:
        data = yaml.safe_load(f)
    print(f"✅ data.yaml найден")
    print(f"   Классы: {data.get('names', 'Не указаны')}")
    print(f"   Кол-во классов: {data.get('nc', 'Не указано')}")
    print(f"   Пути тренировки: {data.get('train', 'Не указан')}")
else:
    print("❌ data.yaml не найден")

# Рекомендуемая модель
print("\n" + "=" * 50)
print("🏆 Рекомендуемая модель для использования:")
target_model = "ML/runs/detect/train3/weights/best.pt"
if os.path.exists(target_model):
    print(f"✅ {target_model}")
    try:
        model = YOLO(target_model)
        print(f"   Классы: {model.names}")
        print(f"   Размер: {os.path.getsize(target_model) / 1024 / 1024:.1f} MB")
    except:
        print("   ❌ Не удалось загрузить")
else:
    # Ищем альтернативу
    best_models = [m for m in model_files if "best.pt" in m and os.path.getsize(m) > 5000000]
    if best_models:
        print(f"✅ {best_models[0]}")
    else:
        print("❌ Подходящая модель не найдена")
