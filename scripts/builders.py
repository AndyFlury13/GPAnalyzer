import requests
from workflowToolkit import WorkflowSteps
import tableConstants
import getters
import os
import endpoints
import startJSONHandlers
import matrixToolkit


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
    destination_folder = './scripts/downloads/'
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
        'file': open('./scripts/downloads/imgToRecognize.jpg', 'rb'),
    }

    res = requests.post('http://localhost:8000/api/v1/recognition/recognize?face_plugins=landmarks, gender, age', headers=headers, files=files)
    return res.json()

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
            
            return str(errorCode), ''
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

def subjectWFError():
    ## Update builder subject start json
    startJSONHandlers.writeJSON({
        'startingIndex': 0,
    }, 'builder/subject')

    ## Update workflow start json
    startJSONHandlers.writeJSON({
        'startingStep': WorkflowSteps.ANALYZE_HD_PICS,
        'totalPicCount': matrixToolkit.getOldTotalPicCount()
    }, 'workflowStart')

    ## Reset the subject matrices matrix
    matrixToolkit.resetMatrix(tableConstants.NAMES, tableConstants.NAMES, 'client', 'takerSubject')
    matrixToolkit.resetMatrix(tableConstants.NAMES, tableConstants.NAMES, 'client', 'subjectTaker')
    matrixToolkit.resetMatrix(tableConstants.NAMES, tableConstants.NAMES, 'client', 'picturedWith')
    matrixToolkit.resetOverallStatsJSON()

def createSubjectMatrices(gpRequestHeader):
    maxPics=False
    picturedWithMatrix, takerSubjectMatrix = matrixToolkit.getMatrix('picturedWith'), matrixToolkit.getMatrix('takerSubject')
    overallStats = matrixToolkit.getOverallStatsJSON()
    print('Building subject-taker and photographed with matrices...')
    idFile = open('./scripts/idFiles/picIDs.txt', 'r')
    startJSON = startJSONHandlers.getJSON("builders/subject")
    start = startJSON['startingIndex']
    if maxPics:
        ids = idFile.readlines()[start:maxPics]
    else:
        ids = idFile.readlines()[start:]
    
    for entry in enumerate(ids):
        imgIDNum, imgID = entry[0]+start, entry[1][:-1]
        (pictureTaker, url) = getPictureTaker(imgID, gpRequestHeader)
        if pictureTaker == 429:
            matrixToolkit.writeMatrix(picturedWithMatrix, 'picturedWith')
            matrixToolkit.writeMatrix(takerSubjectMatrix, 'takerSubject')

            startJSONHandlers.writeJSON({'startingIndex': imgIDNum}, 'builder/subject')
            startJSONHandlers.writeJSON({
                'startingStep': WorkflowSteps.ANALYZE_HD_PICS,
                'totalPicCount':matrixToolkit.getOldTotalPicCount()
            },
            'workflowStart')
            return WorkflowSteps.ERROR
        elif pictureTaker == 'video':
            continue
        elif isinstance(pictureTaker, int):
            subjectWFError()
            return WorkflowSteps.ERROR
        else:
            try:
                recognitionRes = recognizeFace(url)
                matrices = (picturedWithMatrix, takerSubjectMatrix, overallStats, None)
                processRecognition(recognitionRes, pictureTaker, matrices, imgID)
            except Exception as e:
                print("!!!! WARNING: recognition api call failure in subject matrices creation !!!!")
                print(e)
                print(recognitionRes)
                subjectWFError()
                return WorkflowSteps.ERROR
        imgIDNum += 1
    idFile.close()
    subjectTakerMatrix = takerSubjectMatrix.T
    subjectTakerMatrix.index.name = 'client'
    matrixToolkit.writeMatrix(picturedWithMatrix, 'picturedWith')
    matrixToolkit.writeMatrix(takerSubjectMatrix, 'takerSubject')
    matrixToolkit.writeMatrix(subjectTakerMatrix, 'subjectTaker')
    startJSONHandlers.writeJSON({'startingIndex':0}, 'builder/subject')
    print('Matrices built!')
    return WorkflowSteps.GET_MONTH_PICS


def monthWFError():
    ## Update builder month start json
    startJSONHandlers.writeJSON({
        'startingMonthIndex': 0,
        'startingIndex':0
    }, 'builder/month')

    ## Update workflow start json
    startJSONHandlers.writeJSON({
        'startingStep': WorkflowSteps.ANALYZE_MONTH_PICS,
        'totalPicCount': matrixToolkit.getOldTotalPicCount()
    }, 'workflowStart')

    ## Reset month matrices
    matrixToolkit.resetMatrix(tableConstants.NAMES, [month['name'] for month in tableConstants.MONTHS], 'client', 'pictureBySubjectByMonth')
    matrixToolkit.resetMatrix(tableConstants.NAMES, [month['name'] for month in tableConstants.MONTHS], 'client', 'pictureOfSubjectByMonth')
    
def createMonthMatrices(gpRequestHeader):
    pictureBySubjectByMonth = matrixToolkit.getMatrix('pictureBySubjectByMonth')
    pictureOfSubjectByMonth = matrixToolkit.getMatrix('pictureOfSubjectByMonth')
    print('Building monthly matrices...')
    startJSON = startJSONHandlers.getJSON("builder/month")
    monthStart, lineStart = startJSON['startingMonthIndex'], startJSON['startingIndex']
    for monthNum, monthEntry in enumerate(tableConstants.MONTHS[monthStart:]):
        print(monthEntry['name'])
        idFile = open('./scripts/idFiles/months/'+monthEntry['name']+'PicIDs.txt', 'r')
        monthNum += monthStart
        ids = idFile.readlines()[lineStart:]
        for monthIDNum, imgID in enumerate(ids):
            monthIDNum, imgID = monthIDNum + lineStart, imgID[:-1] # Cut out the EOL token
            (pictureTaker, url) = getPictureTaker(imgID, gpRequestHeader)
            if pictureTaker == 'video':
                continue
            elif pictureTaker == '429':
                matrixToolkit.writeMatrix(pictureBySubjectByMonth, 'pictureBySubjectByMonth')
                matrixToolkit.writeMatrix(pictureOfSubjectByMonth, 'pictureOfSubjectByMonth')

                ## Write the month start JSON
                startJSONHandlers.writeJSON({
                    "startingMonthIndex":monthNum,
                    "startingIndex":monthIDNum
                }, 'builder/month')
                
                ## Write the wf start JSON
                startJSONHandlers.writeJSON({
                    'startingStep': WorkflowSteps.ANALYZE_MONTH_PICS,
                    'totalPicCount':matrixToolkit.getOldTotalPicCount()
                },
                'workflowStart')

                return WorkflowSteps.ERROR
            elif isinstance(pictureTaker, int):
                print('Error code:', pictureTaker)
                monthWFError()
                return WorkflowSteps.ERROR
            else:
                pictureBySubjectByMonth.at[pictureTaker, monthEntry['name']]+=imgID+','
                try:
                    recognitionRes = recognizeFace(url)
                    matrices = (None, None, None, pictureOfSubjectByMonth)
                    processRecognition(recognitionRes, pictureTaker, matrices, imgID, monthEntry['name'])
                except Exception as e:
                    print("!!!! WARNING: recognition api call failure in month matrix creation !!!!")
                    print(e)
                    print(recognitionRes)
                    monthWFError()
                    return WorkflowSteps.ERROR

    matrixToolkit.writeMatrix(pictureBySubjectByMonth, 'pictureBySubjectByMonth')
    matrixToolkit.writeMatrix(pictureOfSubjectByMonth, 'pictureOfSubjectByMonth')
    startJSON = {
        "startingMonthIndex":0,
        "startingIndex":0
    }
    startJSONHandlers.writeJSON(startJSON, 'builder/month')
    print('Matrices built!')
    return WorkflowSteps.GET_CATEGORY_PICS

def categoryWFError():
    matrixToolkit.resetMatrix(tableConstants.NAMES, [category[-1] for category in tableConstants.CATEGORIES], 'client', 'subjectCategory')

    startJSONHandlers.writeJSON({
        "startingCategoryIndex": 0,
        "startingIndex":0
    }, 'builder/category')

    ## Update WF start JSON
    startJSONHandlers.writeJSON({
        "startingStep": WorkflowSteps.ANALYZE_CATEGORY_PICS,
        "totalPicCount": matrixToolkit.getOldTotalPicCount()
    }, 'workflowStart')

        
def createCategoryMatrix(gpRequestHeader):
    subjectCategory = matrixToolkit.getMatrix('subjectCategory')
    print('Building category matrix...')
    startJSON = startJSONHandlers.getJSON('builder/category')
    categoryStart, lineStart = startJSON["startingCategoryIndex"], startJSON["startingIndex"]

    for categoryNum, category in enumerate(tableConstants.CATEGORIES[categoryStart:]):
        idFile = open('./scripts/idFiles/categories/'+category[-1]+'PicIDs.txt', 'r')
        categoryNum += categoryStart
        ids = idFile.readlines()[lineStart:]
        for imgIDNum, imgID in enumerate(ids):
            imgIDNum, imgID = imgIDNum + lineStart, imgID[:-1] #Parse out EOL token
            (pictureTaker, _) = getPictureTaker(imgID, gpRequestHeader)
            if pictureTaker == 'video':
                 continue
            elif pictureTaker == '429':
                matrixToolkit.writeMatrix(subjectCategory, 'subjectCategory')

                ## Update cateogry start JSON
                startJSONHandlers.writeJSON({
                    "startingCategoryIndex": categoryNum,
                    "startingIndex":imgIDNum
                }, 'builder/category')

                ## Update WF start JSON
                startJSONHandlers.writeJSON({
                    "startingStep": WorkflowSteps.ANALYZE_CATEGORY_PICS,
                    "totalPicCount": matrixToolkit.getOldTotalPicCount()
                }, 'workflowStart')

                return WorkflowSteps.ERROR
            elif isinstance(pictureTaker, int):
                categoryWFError(categoryNum, imgIDNum)
                return WorkflowSteps.ERROR
            subjectCategory.at[pictureTaker, category[-1]]+=imgID+','
        idFile.close()
    matrixToolkit.writeMatrix(subjectCategory, 'subjectCategory')
    startJSON = {
        "startingCategoryIndex": 0,
        "startingIndex":0
    }
    startJSONHandlers.writeJSON(startJSON, 'builder/category')
    print('Matrix built!')
    return WorkflowSteps.FINISH_OVERALL_STATS

def getTotalPicCount(gpRequestHeader):
    try:
        res = requests.request("GET", endpoints.GET_LIBRARIES, headers=gpRequestHeader)
        res.json()
        albumID = res.json()['albums'][1]['id']
        res = requests.request("GET", endpoints.GET_LIBRARIES+'/'+albumID, headers=gpRequestHeader)
        res = res.json()
    except:
        print('!!!! WARNING: Library request error !!!!') 
        print(res)

        startJSONHandlers.writeJSON({
            'startingStep':WorkflowSteps.FINISH_OVERALL_STATS,
            'totalPicCount': matrixToolkit.getOldTotalPicCount()
        }, 'workflowStart')

        return WorkflowSteps.ERROR
    return int(res['mediaItemsCount'])

def finishOverallStatsJSON(gpRequestHeader):
    print("Requesting total pic count...")
    totalPictures = getTotalPicCount(gpRequestHeader)
    if totalPictures.value == WorkflowSteps.ERROR.value:
        return WorkflowSteps.ERROR
    overallCounts = matrixToolkit.getOverallStatsJSON()
    overallCounts['total'] = totalPictures
    matrixToolkit.writeOverallStatsJSON(overallCounts)
    print("Overall stats JSON created!")
    startJSONHandlers.writeJSON({
        'startingStep':WorkflowSteps.GET_HD_PICS,
        'totalPicCount': totalPictures
    }, 'workflowStart')
    return WorkflowSteps.COMPLETE