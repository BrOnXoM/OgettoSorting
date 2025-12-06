import os

def replace_class_index_in_folder(label_dir, old_index, new_index):
    print(f"Начинаю замену индекса {old_index} на {new_index} в {label_dir}...")
    count = 0
    for filename in os.listdir(label_dir):
        if filename.endswith('.txt'):
            filepath = os.path.join(label_dir, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            new_lines = []
            changed = False

            for line in lines:
                parts = line.strip().split()
                if parts and parts[0] == str(old_index):
                    parts[0] = str(new_index)
                    new_lines.append(" ".join(parts) + "\n")
                    changed = True
                else:
                    new_lines.append(line)
            if changed:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.writelines(new_lines)
                count += 1
    print(f"Готово. Обновлено {count} файлов в папке {label_dir}.")
# !!! УКАЗАН ВАШ ТОЧНЫЙ ПУТЬ !!!
PAPER_LABELS_DIR = 'C:\\Users\\ASUS\\Desktop\\arhiv\\train\\labels\\'

# Заменяем индекс 0 (старый) на индекс 1 (новый)
replace_class_index_in_folder(PAPER_LABELS_DIR, old_index=0, new_index=1)
