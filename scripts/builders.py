import pandas as pd
import random
import requests
import json
import tableConstants
import getters
import os
import endpoints


"""
    Request image with imgID
    We can only download the image from baseURL if we have requested
    the url from GP API and make our download request within 60 minutes
"""

def requestIMG(imgID, gpRequestHeader):
    url = 'https://photoslibrary.googleapis.com/v1/mediaItems/'+imgID
    res = requests.request("GET", url, headers=gpRequestHeader)
    return res.json()

"""
    Download image and place in WD
"""
def downloadIMG(url, file_name='imgToRecognize.jpg'):
    downloadResponse = requests.get(url)
    destination_folder = './downloads/'
    with open(os.path.join(destination_folder, file_name), 'wb') as f:
        f.write(downloadResponse.content)
        f.close()

"""
    Request the CompreFace API to recognize faces
"""
def recognizeFace(url):
    downloadIMG(url)
    headers = {
        'x-api-key': '0bedc62b-b2a4-4eb2-8efd-b62cc275e23c',
    }

    files = {
        'file': open('./downloads/imgToRecognize.jpg', 'rb'),
    }

    res = requests.post('http://localhost:8000/api/v1/recognition/recognize?face_plugins=landmarks, gender, age', headers=headers, files=files)
    return res.json()

NAMES = ['me', 'girlBoss', 'bugBoy', 'jiusus', 'chimu', 'shirleyWhirley', 'yuppie', 'dumbestKid', 'emily', 'other']
RECOGNITION_THRESHOLD = .8 ## The similarity above which we allow a recognition

def getPictureTaker(imgID, gpRequestHeader):
    GPRes = requestIMG(imgID, gpRequestHeader) 
    try:
        mediaMetadata = GPRes['mediaMetadata']
    except:
        print('!!!! WARNING: GPRes error while trying to get picture taker')
        print(GPRes)
        errorCode = GPRes['error']['code']
        if errorCode == 401:
            getters.init_gp_server()
            GPRes = requestIMG(imgID, gpRequestHeader)
            mediaMetadata = GPRes['mediaMetadata']
        elif errorCode == 429:
            print('GP quota reached. Writing matrices to file...')
            return '429', ''
            
        else:
            return 'video', ''
    if 'photo' in mediaMetadata:
        photo = mediaMetadata['photo']
        if 'cameraModel' in photo:
            phoneType = photo['cameraModel']
            try:
                return tableConstants.PHONES_TO_PERSON[phoneType], GPRes['baseUrl']
            except:
                print('!!!! WARNING: Unrecognized camera')
                print(GPRes)
                downloadIMG(GPRes['baseUrl'], 'pictureTakerErr.jpg')
                return 'video', ''
        else:
            return 'jiusus', GPRes['baseUrl']
    else:
        return 'video', ''

"""
    Identify the faces in an image. Given the picture taker, increment the edge between
    pictureTaker and the face in the image.
    
"""
def processRecognition(res, pictureTaker, matrices, imgID, month=None):
    picturedWithMatrix, takerSubjectMatrix, subjectCounts, pictureOfSubjectByMonth = matrices
    if 'result' not in res:
        return
    results = res['result']
    subjects = []
    for result in results: ## Iterates through every face in picture
        possibleSubjects = result['subjects']
        if len(possibleSubjects) == 0:
            continue
        else:
            if possibleSubjects[0]['similarity'] < RECOGNITION_THRESHOLD:
                continue
            else:
                photoSubject = possibleSubjects[0]['subject']
                if photoSubject not in NAMES:
                    photoSubject = 'other'
                if month is None:
                    subjects.append(photoSubject)
                    takerSubjectMatrix.at[pictureTaker, photoSubject] += imgID+','
                    subjectCounts[photoSubject]['asSubject'] += 1
                    subjectCounts[pictureTaker]['asPhototaker'] += 1
                else:
                    pictureOfSubjectByMonth.at[photoSubject, month] += imgID+','
    subject_i, subject_j = 0, 1
    if month is None:
        while subject_i < len(subjects):
            firstSubject = subjects[subject_i]
            while subject_j < len(subjects):
                secondSubject = subjects[subject_j]
                picturedWithMatrix.at[firstSubject, secondSubject] += imgID+','
                picturedWithMatrix.at[secondSubject, firstSubject] += imgID+',' ## Make matrix symmetric for convenience
                subject_j += 1
            subject_i += 1
            subject_j = subject_i + 1

def createSubjectMatrices(gpRequestHeader):
    picturedWithMatrix, takerSubjectMatrix = getMatrix('picturedWith'), getMatrix('takerSubject')
    overallStats = getOverallStatsJSON()
    print('Building subject-taker and photographed with matrices...')
    idFile = open('idFiles/picIDs.txt', 'r')
    start = int(getStart("subject"))
    ids = idFile.readlines()[start:]
    
    for entry in enumerate(ids):
        imgIDNum, imgID = entry[0]+start, entry[1][:-1]
        (pictureTaker, url) = getPictureTaker(imgID, gpRequestHeader) # Cut out the EOL token
        if pictureTaker == '429':
            writeMatrix(picturedWithMatrix, 'picturedWith')
            writeMatrix(takerSubjectMatrix, 'takerSubject')
            writeStart(imgIDNum, 'subject')
            return
        if pictureTaker == 'video':
            continue
        else:
            try:
                recognitionRes = recognizeFace(url)
                matrices = (picturedWithMatrix, takerSubjectMatrix, overallStats, None)
                processRecognition(recognitionRes, pictureTaker, matrices, imgID)
            except Exception as e:
                print("!!!! WARNING: recognition api call failure in subject matrices creation !!!!")
                print(e)
                print(recognitionRes)
        imgIDNum += 1
    idFile.close()
    subjectTakerMatrix = takerSubjectMatrix.T
    subjectTakerMatrix.index.name = 'client'
    writeMatrix(picturedWithMatrix, 'picturedWith')
    writeMatrix(takerSubjectMatrix, 'takerSubject')
    writeMatrix(subjectTakerMatrix, 'subjectTaker')
    writeStart(0, 'subject')
    print('Matrices built!')

def randomizeIDs(idString):
    idList = idString.split(",")
    random.shuffle(idList)
    idList = [i for i in idList if i]
    return ','.join(idList)
    
def createMonthMatrices(gpRequestHeader):
    pictureBySubjectByMonth = getMatrix('pictureBySubjectByMonth')
    pictureOfSubjectByMonth = getMatrix('pictureOfSubjectByMonth')
    print('Building monthly matrices...')
    start = getStart('months')
    monthStart, lineStart = [int(i) for i in start.split(",")]
    for monthNum, monthEntry in enumerate(tableConstants.MONTHS[monthStart:]):
        monthIDNum, imgID = monthStart + lineStart, imgID[:-1] # Cut out the EOL token
        (pictureTaker, url) = getPictureTaker(imgID, gpRequestHeader)
        if pictureTaker == 'video':
             continue
        elif pictureTaker == '429':
            writeMatrix(pictureBySubjectByMonth, 'pictureBySubjectByMonth')
            writeMatrix(pictureOfSubjectByMonth, 'pictureOfSubjectByMonth')
            writeStart(str(monthNum)+','+str(monthIDNum), 'months')
            return
        pictureBySubjectByMonth.at[pictureTaker, monthEntry['name']]+=imgID+','
        try:
            recognitionRes = recognizeFace(url)
            matrices = (None, None, None, pictureOfSubjectByMonth)
            processRecognition(recognitionRes, pictureTaker, matrices, imgID, monthEntry['name'])
        except Exception as e:
            print("!!!! WARNING: recognition api call failure in month matrix creation !!!!")
            print(e)
            print(recognitionRes)
    writeMatrix(pictureBySubjectByMonth, 'pictureBySubjectByMonth')
    writeMatrix(pictureOfSubjectByMonth, 'pictureOfSubjectByMonth')
    writeStart(str(0)+','+str(0), 'months')
    print('Matrices built!')
        
def createCategoryMatrix(gpRequestHeader):
    subjectCategory = getMatrix('subjectCategory')
    print('Building category matrix...')
    start = getStart('categories')
    categoryStart, lineStart = [int(i) for i in start.split(",")]
    for categoryNum, category in enumerate(tableConstants.CATEGORIES[categoryStart:]):
        idFile = open('idFiles/categories/'+category[-1]+'PicIDs.txt', 'r')
        categoryNum += categoryStart
        ids = idFile.readlines()[lineStart:]
        for imgIDNum, imgID in enumerate(ids):
            imgIDNum, imgID = imgIDNum + lineStart, imgID[:-1]
            (pictureTaker, _) = getPictureTaker(imgID, gpRequestHeader)
            if pictureTaker == 'video':
                 continue
            elif pictureTaker == '429':
                writeMatrix(subjectCategory, 'subjectCategory')
                writeStart(str(categoryNum)+','+str(imgIDNum), 'categories')
                return
            subjectCategory.at[pictureTaker, category[-1]]+=imgID+','
        idFile.close()
    writeMatrix(subjectCategory, 'subjectCategory')
    writeStart(str(0)+','+str(0), 'categories')
    print('Matrix built!')
    
def getOverallStatsJSON():
    overallStats = {}
    with open('data/overallStats.json') as f_in:
        overallStats = json.load(f_in)
    f_in.close()
    return overallStats

def writeOverallStatsJSON(overallStats):
    with open("data/overallStats.json", "w") as fp:
        json.dump(overallStats , fp) 
    fp.close()


def createOverallJSON(gpRequestHeader):
    try:
        res = requests.request("GET", endpoints.GET_LIBRARIES, headers=gpRequestHeader)
        res.json()
        albumID = res.json()['albums'][1]['id']
    except:
        print('!!!! WARNING: Library request error !!!!') 
        print(res)

    res = requests.request("GET", endpoints.GET_LIBRARIES+'/'+albumID, headers=gpRequestHeader)
    print(res)
    res = res.json()
    totalPictures = int(res['mediaItemsCount'])
    overallCounts = getOverallStatsJSON()
    overallCounts['total'] = totalPictures
    writeOverallStatsJSON(overallCounts)

"""
    Write the given matrices to csvs with the given names, and write the next run's starting
    index to the file with the given startingIndexName.
"""
def writeMatrix(matrix, name):
    matrix = matrix.applymap(randomizeIDs)
    if name == 'takerSubject':
        matrix.T.to_csv("data/subjectTaker.csv")
    matrix.to_csv("data/%s.csv" %name)

def writeStart(start, startingIndexName):
    with open('idFiles/startingIndices/%s.txt' %startingIndexName, 'w+') as f:
        f.write('%s' %start)
    f.close()

"""
    Reset the given matrices by writing empty matrices to the csvs with the given names.
"""

def resetMatrix(rowLabels, columnLabels, indexName, fileName):
    matrix = pd.DataFrame('', index=rowLabels, columns=columnLabels)
    matrix.index.name = indexName
    matrix.to_csv('data/%s.csv' %fileName)

def resetJSON():
    writeOverallStatsJSON(tableConstants.emptyOverallStats)

def getMatrix(fileName):
    
    matrix = pd.read_csv('data/%s.csv' %fileName, index_col=0)
    matrix = matrix.fillna('')
    return matrix
                             
def getStart(name):
    start = ''
    with open('idFiles/startingIndices/%s.txt' %name) as f:
        start = f.readlines()[0] 
    f.close()
    return start
    
