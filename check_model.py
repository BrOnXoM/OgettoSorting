import sys
import os
sys.path.insert(0, '/var/www/eco-ml/.venv/lib/python3.12/site-packages')

try:
    from ultralytics import YOLO
    import yaml
    
    # Найдем лучшую модель
    model_files = []
    for root, dirs, files in os.walk("ML_new_temp"):
        for file in files:
            if file == "best.pt" or file.endswith(".pt"):
                model_files.append(os.path.join(root, file))
    
    print(f"Найдено {len(model_files)} моделей:")
    for i, f in enumerate(model_files[:5], 1):
        print(f"  {i}. {f}")
    
    if model_files:
        # Проверим первую модель
        model_path = model_files[0]
        print(f"\nПроверяю модель: {model_path}")
        
        try:
            model = YOLO(model_path)
            print(f"✅ Модель загружена успешно!")
            print(f"📊 Классы модели: {model.names}")
            print(f"🎯 Всего классов: {len(model.names)}")
            
            # Проверим data.yaml если есть
            yaml_files = []
            for root, dirs, files in os.walk("ML_new_temp"):
                for file in files:
                    if "data.yaml" in file or file.endswith(".yaml"):
                        yaml_files.append(os.path.join(root, file))
            
            if yaml_files:
                print(f"\n📁 Найдены YAML файлы:")
                for yaml_file in yaml_files[:3]:
                    try:
                        with open(yaml_file, 'r') as f:
                            data = yaml.safe_load(f)
                        print(f"  📄 {yaml_file}")
                        if 'names' in data:
                            print(f"    Классы: {data['names']}")
                        if 'nc' in data:
                            print(f"    Кол-во классов: {data['nc']}")
                    except:
                        pass
                        
        except Exception as e:
            print(f"❌ Ошибка загрузки модели: {e}")
    
    else:
        print("❌ Модели не найдены!")
        
except Exception as e:
    print(f"❌ Ошибка: {e}")
    import traceback
    traceback.print_exc()
