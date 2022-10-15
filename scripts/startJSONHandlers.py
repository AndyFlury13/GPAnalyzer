import json

def writeJSON(startJSON, path):
    with open("idFiles/startingIndices/"+path+".json", "w") as fp:
        json.dump(startJSON , fp) 
    fp.close()

def getJSON(path):
    startJSON = {}
    with open('idFiles/startingPoints'+path+".json") as f_in:
        startJSON = json.load(f_in)
    f_in.close()
    return startJSON