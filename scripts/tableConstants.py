MONTHS = [
    {'month': 8, 'year':2021, 'name':'August'}, 
    {'month': 9, 'year':2021, 'name': 'September'}, 
    {'month': 10, 'year':2021, 'name': 'October'}, 
    {'month': 11, 'year':2021, 'name': 'November'}, 
    {'month': 12, 'year':2021, 'name': 'December'}, 
    {'month': 1, 'year':2022, 'name': 'January'}, 
    {'month': 2, 'year':2022, 'name': 'February'}, 
    {'month': 3, 'year':2022, 'name': 'March'},
    {'month': 4, 'year':2022, 'name': 'April'}, 
    {'month': 5, 'year':2022, 'name': 'May'}, 
    {'month': 6, 'year':2022, 'name': 'June'}, 
]

CATEGORIES = [
    ['ANIMALS','PETS','ANIMALS'],
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

PHONES_TO_PERSON = {
    'BE2026': 'chimu',
    'SM-G970U':'shirleyWhirley',
    'iPhone 11': 'jiusus',
    'Pixel 3': 'bugBoy',
    'Pixel 5a': 'bugBoy',
    'iPhone 12': 'girlBoss',
    'iPhone X': 'me',
    'iPhone 8': 'girlBoss',
    'moto g(7) plus': 'chimu',
    'A6013': 'yuppie',
    'ONEPLUS A6013': 'yuppie',
    'foodie': 'jiusus',
    'iphone 7': 'dumbestKid',
    'Canon EOS R6': 'other'
}

NAMES = ['me', 'girlBoss', 'bugBoy', 'jiusus', 'chimu', 'shirleyWhirley', 'yuppie', 'dumbestKid', 'emily', 'other']

statDict = {
    'asSubject': 0,
    'asPhototaker': 0
}

emptyOverallStats = {
    'chimu':dict(statDict),
    'shirleyWhirley': dict(statDict),
    'jiusus':dict(statDict),
    'me':dict(statDict),
    'girlBoss':dict(statDict),
    'bugBoy':dict(statDict),
    'yuppie':dict(statDict),
    'emily':dict(statDict),
    'dumbestKid':dict(statDict),
    'other': dict(statDict),
    'total':0
}