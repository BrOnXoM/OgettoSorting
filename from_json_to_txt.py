import json
import os

def convert_labelme_to_yolo(json_dir, classes):
    print(f"Start from {json_dir}...")
    for json_file in os.listdir(json_dir):
        if not json_file.endswith('.json'):
            continue
        with open(os.path.join(json_dir, json_file), 'r', encoding='utf-8') as f:
            data = json.load(f)
        img_w, img_h = data['imageWidth'], data['imageHeight']
        yolo_lines = []
        for shape in data['shapes']:
            label = shape['label']
            if label not in classes:
                print(f"Warning: label '{label}' not in classes list. Skipping.")
                continue
            class_id = classes.index(label)

            p1, p2 = shape['points']
            x_min, y_min = p1
            x_max, y_max = p2
            dw = 1. / img_w
            dh = 1. / img_h
            x_center = (x_min + x_max) / 2.0
            y_center = (y_min + y_max) / 2.0
            width = x_max - x_min
            height = y_max - y_min
            x_center = x_center * dw
            width = width * dw
            y_center = y_center * dh
            height = height * dh
            yolo_lines.append(f"{class_id} {x_center} {y_center} {width} {height}\n")

        txt_path = os.path.join(json_dir, json_file.replace('.json', '.txt'))
        with open(txt_path, 'w', encoding='utf-8') as f:
            f.writelines(yolo_lines)
        print(f"Converted {json_file}")
    print("End. Succsess")
JSON_DIR = 'C:\\Users\\ASUS\\Desktop\\python\\ML\\data\\labels\\'
CLASSES = ['plastic', 'paper']
convert_labelme_to_yolo(JSON_DIR, CLASSES)
