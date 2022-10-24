import json

def writeJSON(startJSON, path):
    with open("./scripts/idFiles/startingIndices/"+path+".json", "w") as fp:
        json.dump(startJSON , fp) 
    fp.close()

def getJSON(path):
    startJSON = {}
    with open('./scripts/idFiles/startingPoints/'+path+".json") as f_in:
        startJSON = json.load(f_in)
    f_in.close()
    return startJSON