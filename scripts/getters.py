import json, requests
import endpoints
import gpWrapper
import matrixToolkit
import startJSONHandlers
import tableConstants
from workflowToolkit import WorkflowSteps

def init_gp_server():
    googlePhotosAPI = gpWrapper.GooglePhotosApi()
    creds = googlePhotosAPI.run_local_server()
    gpRequestHeader = {
        'content-type': 'application/json',
        'Authorization': 'Bearer {}'.format(creds.token)
    }
    return (googlePhotosAPI, gpRequestHeader)

def writeToFile(f, mediaItems):
    for item in mediaItems:
        try:
            f.write('%s\n' %item['id'])
        except:
            print('!!!! WARNING: Write error !!!!')

def get_hd_people_pics(gpRequestHeader):
    print('Downloading HD pics...')
    try:
        res = requests.request("GET", endpoints.GET_LIBRARIES, headers=gpRequestHeader)
        albumID = res.json()['albums'][1]['id']
    except:
        print('!!!! WARNING: Library request error !!!!') 
        print(res)
        return WorkflowSteps.ERROR.value
    
    payload = {
      "albumId": albumID,
      "pageSize": "25"
    }
    res = requests.request("POST", endpoints.MEDIA_ITEMS,  data=json.dumps(payload), headers=gpRequestHeader)
    res = res.json()
    if 'error' in res:
        print('!!!! WARNING: Library request error !!!!')
        print(res)
        return WorkflowSteps.ERROR.value
    numPics = 0
    with open('./scripts/idFiles/picIDs.txt', 'w+') as f:
        while 'nextPageToken' in res:
            if 'mediaItems' in res:
                writeToFile(f, res['mediaItems'])
            numPics += len(res['mediaItems'])
            payload = {
              "albumId": albumID,
              "pageSize": "25",
              "pageToken": res['nextPageToken'],
            }
            res = requests.request("POST", endpoints.MEDIA_ITEMS,  data=json.dumps(payload), headers=gpRequestHeader)
            res = res.json()
            if 'error' in res:
              errorCode = res['error']['code']
              if errorCode == 401:
                _, gpRequestHeader = init_gp_server()
                res = requests.request("POST", endpoints.MEDIA_ITEMS,  data=json.dumps(payload), headers=gpRequestHeader)
                res = res.json()
              else:
                print('!!!! WARNING: Library request error !!!!')
                print(res)
                startJSONHandlers.writeJSON({
                  'startingStep': WorkflowSteps.GET_HD_PICS,
                  'totalPicCount': matrixToolkit.getOldTotalPicCount()
                }, 'workflowStart')
                return WorkflowSteps.ERROR
    f.close()
    print('Download complete!')
    return WorkflowSteps.ANALYZE_HD_PICS

def get_month_pics(monthEntry, monthIndex, gpRequestHeader):
    payload = {
      "filters": {
        "dateFilter": {
          "dates": [
            {
              "month": monthEntry['month'],
              "year": monthEntry['year']
            }
           ]
            }
          },
        "pageSize": "25"
    }
    
    res = requests.request("POST", endpoints.MEDIA_ITEMS,  data=json.dumps(payload), headers=gpRequestHeader)
    res = res.json()
    if 'error' in res:
        print('!!!! WARNING: Library request error !!!!')
        print(res)
        startJSONHandlers.writeJSON({
          'startingMonthIndex': monthIndex,
        }, 'getter/month')
        startJSONHandlers.writeJSON({
          'startingStep': WorkflowSteps.GET_MONTH_PICS,
          'totalPicCount': matrixToolkit.getOldTotalPicCount()
        }, 'workflowStart')
        return WorkflowSteps.ERROR
        
    with open('./scripts/idFiles/months/'+monthEntry['name']+'PicIDs.txt', 'w+') as f:
        while 'nextPageToken' in res:
            if 'mediaItems' in res:
                writeToFile(f, res['mediaItems'])
            payload = {
              "filters": {
                "dateFilter": {
                  "dates": [
                    {
                      "month": monthEntry['month'],
                      "year": monthEntry['year']
                    }
                   ]
                }
              },
              "pageSize": "25",
              "pageToken": res['nextPageToken']
            }
            res = requests.request("POST", endpoints.MEDIA_ITEMS,  data=json.dumps(payload), headers=gpRequestHeader)
            res = res.json()
            if 'error' in res:
              errorCode = res['error']['code']
              if errorCode == 401:
                _, gpRequestHeader = init_gp_server()
                res = requests.request("POST", endpoints.MEDIA_ITEMS,  data=json.dumps(payload), headers=gpRequestHeader)
                res = res.json()
              elif errorCode == 429:
                print("Reached quota")
                startJSONHandlers.writeJSON({"startingMonthIndex":monthIndex}, "getter/month")
                startJSONHandlers.writeJSON({"workflowStart":WorkflowSteps.GET_MONTH_PICS}, 'workflowStart')
                return WorkflowSteps.ERROR
              else:
                print('!!!! WARNING: Library request error !!!!')
                print(res)
                startJSONHandlers.writeJSON({"startingMonthIndex":monthIndex}, "getter/month")
                startJSONHandlers.writeJSON({
                  "workflowStart":WorkflowSteps.GET_MONTH_PICS,
                  "totalPicCount": matrixToolkit.getOldTotalPicCount()
                }, 'workflowStart')
                return WorkflowSteps.ERROR
    f.close()
    return {'value': 13}
    
    
    

def get_all_month_pics(gpRequestHeader):
    print('Downloading pics with monthly filter...')
    startingMonthIndex = startJSONHandlers.getJSON('getter/month')
    for monthIndex, monthEntry in enumerate(tableConstants.MONTHS[startingMonthIndex:]):
        val = get_month_pics(monthEntry, monthIndex+startingMonthIndex, gpRequestHeader)
        if val == WorkflowSteps.ERROR.value:
          return WorkflowSteps.ERROR.value
    startJSONHandlers.writeJSON({"startingMonthIndex":0}, "getter/month")
    print('Download complete!')
    return WorkflowSteps.ANALYZE_MONTH_PICS
   
        
        
def get_category_pics(category, categoryIndex, gpRequestHeader):
    categoryLabel = category[0]
    if len(category)>1:
        categoryLabel = category[-1]
        category = category[0:len(category)-1]
    payload = {
      "filters": {
        "contentFilter": {
          "includedContentCategories": category
        }
      },
      "pageSize": "25"
    }
    
    res = requests.request("POST", endpoints.MEDIA_ITEMS,  data=json.dumps(payload), headers=gpRequestHeader)
    res = res.json()
    if 'error' in res:
        print('!!!! WARNING: Library request error !!!!')
        print(res)
        startJSONHandlers.writeJSON({
          'startingMonthIndex': categoryIndex,
        }, 'getter/category')
        startJSONHandlers.writeJSON({
          'startingStep': WorkflowSteps.GET_CATEGORY_PICS,
          'totalPicCount': matrixToolkit.getOldTotalPicCount()
        }, 'workflowStart')
        return WorkflowSteps.ERROR
    with open('./scripts/idFiles/categories/'+categoryLabel+'PicIDs.txt', 'w+') as f:
        while 'nextPageToken' in res:
            if 'mediaItems' in res:
                writeToFile(f, res['mediaItems'])
            payload = {
              "filters": {
                "contentFilter": {
                  "includedContentCategories": category
                }
              },
              "pageSize": "25",
              "pageToken": res['nextPageToken']
            }
            
            res = requests.request("POST", endpoints.MEDIA_ITEMS,  data=json.dumps(payload), headers=gpRequestHeader)
            res = res.json()
            if 'error' in res:
              errorCode = res['error']['code']
              if errorCode == 401:
                _, gpRequestHeader = init_gp_server()
                res = requests.request("POST", endpoints.MEDIA_ITEMS,  data=json.dumps(payload), headers=gpRequestHeader)
                res = res.json()
              elif errorCode == 429:
                print("Quota reached")
                startJSONHandlers.writeJSON({"startingCategoryIndex":categoryIndex}, "getter/category")
                startJSONHandlers.writeJSON({"startingStep":WorkflowSteps.GET_CATEGORY_PICS}, "workflowStart")
                return WorkflowSteps.ERROR
              else:
                print('!!!! WARNING: Library request error !!!!')
                print(res)
                startJSONHandlers.writeJSON({"startingCategoryIndex":categoryIndex}, "getter/category")
                startJSONHandlers.writeJSON({"startingStep":WorkflowSteps.GET_CATEGORY_PICS}, "workflowStart")
                return WorkflowSteps.ERROR
    f.close()
    return {'value': 13}
    
def get_all_category_pics(gpRequestHeader):
    print('Downloading pics with category filter...')
    startingCategoryIndex = startJSONHandlers.getJSON('getter/category')
    for categoryIndex, category in enumerate(tableConstants.CATEGORIES[startingCategoryIndex:]):
        val = get_category_pics(category, categoryIndex+startingCategoryIndex, gpRequestHeader)
        if val == WorkflowSteps.ERROR.value:
          return WorkflowSteps.ERROR.value
    startJSONHandlers.writeJSON({"startingCategoryIndex":0}, "getter/category")
    print('Download complete!')
    return WorkflowSteps.ANALYZE_CATEGORY_PICS