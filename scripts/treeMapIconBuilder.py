import numpy as np
from PIL import Image, ImageColor
import os
import re

def convertColors(filename, newBodyColor, newBgColor):
    im = Image.open('treemapPics/original/'+filename + '.png')
    thresh = 128
    im = im.convert('L')
    im = im.point(lambda x: 0 if x<thresh else 255, '1')
    im = im.convert('RGBA')
    
    data = np.array(im)


    red, green, blue = data[:,:,0], data[:,:,1], data[:,:,2]
    bodyMask = (red == 0) & (green == 0) & (blue == 0)
    data[:,:,:3][bodyMask] = ImageColor.getcolor(newBodyColor, "RGB") 

    bgMask = (red == 255) & (green == 255) & (blue == 255)
    data[:,:,:3][bgMask] = ImageColor.getcolor(newBgColor, "RGB")

    im = Image.fromarray(data)
    im.save("../../scrappyBookFrontend/firebaseShell/treeMapPics/modified/"+filename+"_modified.png")
    
def tile(filename):
    im = Image.open('../treemapPics/modified/'+filename+'_modified.png')
    width, height = im.size
    new_im = Image.new('RGB', (26*width,26*height))
    for i in range(0,26*width, width):
        for j in range(0,26*height, height):
            im.thumbnail((width,height))
            new_im.paste(im, (i,j))
    new_im = new_im.resize((10*width,10*height))
    new_im.save("../treemapPics/tiles/"+filename+"_tile.png")

def tileAll():
    directory='treemapPics/modified'
    for filename in os.listdir(directory):
        f = os.path.join(directory, filename)
        # checking if it is a file
        if os.path.isfile(f):
            t = re.search('[A-Z]+', filename)
            tile(t.group())

categories = [
    ['ANIMALS,PETS','ANIMALS'],
    ['FASHION'],
    ['LANDMARKS'],
    ['ARTS'],
    ['FLOWERS','GARDENS','LANDSCAPES', 'NATURE'],
    ['BIRTHDAYS'],
    ['FOOD'],
    ['NIGHT'],
    ['SELFIES'],
    ['CITYSCAPES', 'HOUSES', 'CITYSCAPES'],
    ['PEOPLE'],
    ['SPORT'],
    ['HOLIDAYS'],
    ['CRAFTS'],
    ['PERFORMANCES'],
    ['TRAVEL'],
    ['RECEIPTS','WEDDINGS','WHITEBOARDS','SCREENSHOTS','UTILITY','DOCUMENTS', 'MISC']
]
name = 'name' # define the key variables here to make importing from JS file easier
color = 'color'
sizeModifier = 'sizeModifier'
CATEGORIES = [
  { name: 'ANIMALS', color: '#00ff42', sizeModifier: 1 },
  { name: 'FASHION', color: '#00fd64', sizeModifier: 1 },
  { name: 'LANDMARKS', color: '#00fb81', sizeModifier: 1.7 },
  { name: 'ARTS', color: '#00f89c', sizeModifier: 1 },
  { name: 'NATURE', color: '#00f5b4', sizeModifier: 0.9 },
  { name: 'BIRTHDAYS', color: '#00f1ca', sizeModifier: 1 },
  { name: 'FOOD', color: '#00ecde', sizeModifier: 0.9 },
  { name: 'NIGHT', color: '#00e8ef', sizeModifier: 1 },
  { name: 'SELFIES', color: '#00e2fe', sizeModifier: 0.7 },
  { name: 'CITYSCAPES', color: '#00dcff', sizeModifier: 1.1 },
  { name: 'PEOPLE', color: '#00d6ff', sizeModifier: 1 },
  { name: 'SPORT', color: '#00cfff', sizeModifier: 1 },
  { name: 'HOLIDAYS', color: '#00c8ff', sizeModifier: 1.3 },
  { name: 'CRAFTS', color: '#00c0ff', sizeModifier: 1 },
  { name: 'PERFORMANCES', color: '#00b8ff', sizeModifier: 1.3 },
  { name: 'TRAVEL', color: '#00b0ff', sizeModifier: 1.4 },
  { name: 'MISC', color: '#52a8ff', sizeModifier: 1 },
]

bodyColor = '#333333'
TREEMAP_COLORS = [
    {
        'body':bodyColor,
        'bg': CATEGORIES[0]['color']
    },
    {
        'body':bodyColor,
        'bg': CATEGORIES[1]['color']
    },
    {
        'body':bodyColor,
        'bg': CATEGORIES[2]['color']
    },
    {
        'body':bodyColor,
        'bg': CATEGORIES[3]['color']
    },
    {
        'body':bodyColor,
        'bg': CATEGORIES[4]['color']
    },
    {
        'body':bodyColor,
        'bg': CATEGORIES[5]['color']
    },
    {
        'body':bodyColor,
        'bg': CATEGORIES[6]['color']
    },
    {
        'body':bodyColor,
        'bg': CATEGORIES[7]['color']
    },
    {
        'body':bodyColor,
        'bg': CATEGORIES[8]['color']
    },
    {
        'body':bodyColor,
        'bg': CATEGORIES[9]['color']
    },
    {
        'body':bodyColor,
        'bg': CATEGORIES[10]['color']
    },
    {
        'body':bodyColor,
        'bg': CATEGORIES[11]['color']
    },
    {
        'body':bodyColor,
        'bg': CATEGORIES[12]['color']
    },
    {
        'body':bodyColor,
        'bg': CATEGORIES[13]['color']
    },
    {
        'body':bodyColor,
        'bg': CATEGORIES[14]['color']
    },
    {
        'body':bodyColor,
        'bg': CATEGORIES[15]['color']
    },
    {
        'body':bodyColor,
        'bg': CATEGORIES[16]['color']
    }
]

categoryAndColor = zip(categories, TREEMAP_COLORS)
def convertAll():
    for c in list(categoryAndColor):
        categoryName, colors = c
        convertColors(categoryName[-1], colors['body'], colors['bg'])
convertAll()