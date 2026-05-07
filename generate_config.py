import os
import json

IMAGES_DIR = "images"
OUTPUT_JSON = "config.json"

IMAGE_EXTS = (".png", ".jpg", ".jpeg", ".webp")


def find_images(folder):
    """Return list of image files in folder."""
    files = []

    for f in sorted(os.listdir(folder)):
        if f.lower().endswith(IMAGE_EXTS):
            files.append(f)

    return files


subjects = []

for subject in sorted(os.listdir(IMAGES_DIR)):

    subject_path = os.path.join(IMAGES_DIR, subject)

    if not os.path.isdir(subject_path):
        continue

    print(f"\nProcessing {subject}")

    gt_path = None
    methods = []

    for method in sorted(os.listdir(subject_path)):

        method_path = os.path.join(subject_path, method)

        if not os.path.isdir(method_path):
            continue

        images = find_images(method_path)

        if not images:
            print(f"  WARNING: No images in {method}")
            continue

        # take FIRST image in folder
        img_file = images[0]

        rel_path = f"{subject}/{method}/{img_file}"

        print(f"  {method}: {img_file}")

        if method.upper() == "GT":
            gt_path = rel_path
        else:
            methods.append({
                "name": method,
                "file": rel_path
            })

    if gt_path is None:
        print(f"  ERROR: GT missing in {subject}")
        continue

    subjects.append({
        "name": subject,
        "gt": gt_path,
        "methods": methods
    })


with open(OUTPUT_JSON, "w") as f:
    json.dump({"subjects": subjects}, f, indent=2)

print("\nDone -> config.json generated")