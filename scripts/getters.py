import json, requests
import endpoints
import gpWrapper
import startJSONHandlers
import tableConstants

MAX_NUM_PICS = 5200000000

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
        return
    
    payload = {
      "albumId": albumID,
      "pageSize": "25"
    }
    res = requests.request("POST", endpoints.MEDIA_ITEMS,  data=json.dumps(payload), headers=gpRequestHeader)
    res = res.json()
    if 'error' in res:
        print('!!!! WARNING: Library request error !!!!')
        print(res)
        return
    numPics = 0
    with open('idFiles/picIDs.txt', 'w+') as f:
        while 'nextPageToken' in res and numPics < MAX_NUM_PICS:
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
                # END WORKFLOW
                return
    f.close()
    print('Download complete!')
    return numPics

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
        return
    numPics = 0
        
    with open('idFiles/months/'+monthEntry['name']+'PicIDs.txt', 'w+') as f:
        while 'nextPageToken' in res and numPics < MAX_NUM_PICS:
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
                startJSONHandlers.writeJSON({"month":monthIndex}, "getter/month")
                # UPDATE WORKFLOW START
                # END WORKFLOW
                return
              else:
                print('!!!! WARNING: Library request error !!!!')
                print(res)
                # END WORKFLOW
                return
            if 'mediaItems' in res:
                numPics += len(res['mediaItems'])
    f.close()
    startJSONHandlers.writeJSON({"month":0}, "getter/month")
    return numPics

def get_all_month_pics(gpRequestHeader):
    print('Downloading pics with monthly filter...')
    startingMonthIndex = startJSONHandlers.getJSON('getter/month')
    for monthIndex, monthEntry in enumerate(tableConstants.MONTHS[startingMonthIndex:]):
        get_month_pics(monthEntry, monthIndex+startingMonthIndex, gpRequestHeader)
    print('Download complete!')
        
        
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
        return
    numPics = 0
    with open('idFiles/categories/'+categoryLabel+'PicIDs.txt', 'w+') as f:
        while 'nextPageToken' in res and numPics < MAX_NUM_PICS:
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
                startJSONHandlers.writeJSON({"categoryStart":categoryIndex}, "getter/category")
                # UPDATE WORKFLOW START
                # END WORKFLOW
                return
              else:
                print('!!!! WARNING: Library request error !!!!')
                print(res)
                # END WORKFLOW
                return
            if 'mediaItems' in res:
                numPics += len(res['mediaItems'])
    f.close()
    startJSONHandlers.writeJSON({"categoryStart":0}, "getter/category")
    return numPics
    
def get_all_category_pics(gpRequestHeader):
    print('Downloading pics with category filter...')
    startingCategoryIndex = startJSONHandlers.getJSON('getter/category')
    for categoryIndex, category in enumerate(tableConstants.CATEGORIES[startingCategoryIndex:]):
        get_category_pics(category, categoryIndex+startingCategoryIndex, gpRequestHeader)
    print('Download complete!')