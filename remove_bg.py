from PIL import Image

def remove_black_background(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()

    newData = []
    # JPEGs have compression artifacts, so pure black might be slightly off
    threshold = 35 
    for item in datas:
        # If it's heavily dark, make it transparent
        if item[0] < threshold and item[1] < threshold and item[2] < threshold:
            newData.append((0, 0, 0, 0))
        else:
            newData.append(item)

    img.putdata(newData)
    img.save(output_path, "PNG")

if __name__ == "__main__":
    remove_black_background("public/logo.jpeg", "public/logo.png")
    print("Background successfully removed and saved to logo.png!")
