#!/usr/bin/env python3
"""
Re-upload product images to Medusa and update product thumbnails.
Usage: python3 scripts/reupload-product-images.py --images-dir /path/to/images/folder

The images folder should contain files named like:
  1.png, 2.png, ... 16.png
  OR any image files — the script will prompt you to match each product.
"""

import argparse
import json
import os
import sys
import time
import requests

BACKEND_URL = "https://api.promptrsa.com"
EMAIL = "admin@promptr.com"
PASSWORD = "ProTar1981"
BACKUP_FILE = os.path.join(os.path.dirname(__file__), "../backup_products_20260630.json")


def get_token():
    resp = requests.post(f"{BACKEND_URL}/auth/user/emailpass", json={"email": EMAIL, "password": PASSWORD})
    resp.raise_for_status()
    return resp.json()["token"]


def upload_image(token: str, image_path: str) -> str:
    """Upload image file and return the URL."""
    with open(image_path, "rb") as f:
        filename = os.path.basename(image_path)
        mime = "image/png" if filename.endswith(".png") else "image/jpeg"
        resp = requests.post(
            f"{BACKEND_URL}/admin/uploads",
            headers={"Authorization": f"Bearer {token}"},
            files={"files": (filename, f, mime)},
        )
    resp.raise_for_status()
    data = resp.json()
    # Medusa v2 returns { "files": [{ "url": "...", "id": "..." }] }
    files = data.get("files", [])
    if not files:
        raise ValueError(f"Upload response had no files: {data}")
    return files[0]["url"]


def update_product_thumbnail(token: str, product_id: str, thumbnail_url: str, image_url: str):
    """Update product thumbnail and images."""
    resp = requests.post(
        f"{BACKEND_URL}/admin/products/{product_id}",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={"thumbnail": thumbnail_url, "images": [{"url": image_url}]},
    )
    resp.raise_for_status()
    return resp.json()


def main():
    parser = argparse.ArgumentParser(description="Re-upload product images to Medusa")
    parser.add_argument("--images-dir", required=True, help="Directory containing product images")
    args = parser.parse_args()

    images_dir = os.path.expanduser(args.images_dir)
    if not os.path.isdir(images_dir):
        print(f"Error: {images_dir} is not a directory")
        sys.exit(1)

    # Load product list from backup
    if not os.path.exists(BACKUP_FILE):
        print(f"Error: backup file not found at {BACKUP_FILE}")
        sys.exit(1)

    with open(BACKUP_FILE) as f:
        backup = json.load(f)

    products = backup["products"]
    print(f"Found {len(products)} products in backup")

    # List available images
    image_files = sorted([
        f for f in os.listdir(images_dir)
        if f.lower().endswith((".png", ".jpg", ".jpeg", ".webp"))
    ])
    print(f"\nFound {len(image_files)} images in {images_dir}:")
    for i, f in enumerate(image_files):
        print(f"  [{i+1}] {f}")

    print("\nAuthentication...")
    token = get_token()
    print("✓ Logged in")

    results = []
    for product in products:
        print(f"\n{'='*50}")
        print(f"Product: {product['title']}")
        print(f"  ID: {product['id']}")
        print(f"  Old thumbnail: {product['thumbnail']}")

        img_input = input(f"\nEnter image number [1-{len(image_files)}] or path, or SKIP: ").strip()

        if img_input.upper() == "SKIP":
            print("  Skipped")
            continue

        # Resolve image path
        if img_input.isdigit():
            idx = int(img_input) - 1
            if 0 <= idx < len(image_files):
                image_path = os.path.join(images_dir, image_files[idx])
            else:
                print(f"  Invalid index. Skipping.")
                continue
        else:
            image_path = img_input if os.path.isabs(img_input) else os.path.join(images_dir, img_input)

        if not os.path.exists(image_path):
            print(f"  File not found: {image_path}. Skipping.")
            continue

        print(f"  Uploading: {os.path.basename(image_path)}...")
        try:
            url = upload_image(token, image_path)
            print(f"  ✓ Uploaded: {url}")

            update_product_thumbnail(token, product["id"], url, url)
            print(f"  ✓ Product updated")
            results.append({"product_id": product["id"], "title": product["title"], "new_url": url})
        except Exception as e:
            print(f"  ✗ Error: {e}")

    print(f"\n{'='*50}")
    print(f"Done. Updated {len(results)} products:")
    for r in results:
        print(f"  {r['title']}: {r['new_url']}")

    # Save results
    results_file = os.path.join(os.path.dirname(__file__), "../upload_results.json")
    with open(results_file, "w", encoding="utf-8") as f:
        json.dump({"timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"), "results": results}, f, ensure_ascii=False, indent=2)
    print(f"\nResults saved to: {results_file}")


if __name__ == "__main__":
    main()
