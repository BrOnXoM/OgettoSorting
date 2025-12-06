import os
import glob

def create_empty_labels_in_separate_folder(image_dir, target_label_dir):
    if not os.path.exists(target_label_dir):
        os.makedirs(target_label_dir)
        print(f"Создана целевая папка: {target_label_dir}")

    images = []
    images.extend(glob.glob(os.path.join(image_dir, '*.jpg')))
    images.extend(glob.glob(os.path.join(image_dir, '*.jpeg')))
    images.extend(glob.glob(os.path.join(image_dir, '*.png')))
    print(f"Найдено {len(images)} изображений в {image_dir}.")
    if not images:
        print("ВНИМАНИЕ: Изображения не найдены. Проверьте путь и расширения файлов.")
        return

    for img_path in images:
        base_name = os.path.splitext(os.path.basename(img_path))[0]
        txt_path = os.path.join(target_label_dir, base_name + '.txt')

        with open(txt_path, 'w') as f:
            pass
    print("Готово. Все пустые файлы меток созданы в целевой папке.")

SOURCE_IMAGE_DIR = r'C:\Users\ASUS\Desktop\arhiv\train\images'
TARGET_LABEL_DIR = r'C:\Users\ASUS\Desktop\arhiv\train\labels'
# TARGET_LABEL_DIR = r'C:\Users\ASUS\Desktop\temp_empty_labels'


# Запускаем создание пустых меток
create_empty_labels_in_separate_folder(SOURCE_IMAGE_DIR, TARGET_LABEL_DIR)
