import json
import random
import pandas as pd
import tableConstants

def randomizeIDs(idString):
    idList = idString.split(",")
    random.shuffle(idList)
    idList = [i for i in idList if i]
    return ','.join(idList)


"""
    Write the given matrices to csvs with the given names, and write the next run's starting
    index to the file with the given startingIndexName.
"""
def writeMatrix(matrix, name):
    matrix = matrix.applymap(randomizeIDs)
    if name == 'takerSubject':
        matrix.T.to_csv("data/subjectTaker.csv")
    matrix.to_csv("data/%s.csv" %name)

"""
    Reset the given matrices by writing empty matrices to the csvs with the given names.
"""
def resetMatrix(rowLabels, columnLabels, indexName, fileName):
    matrix = pd.DataFrame('', index=rowLabels, columns=columnLabels)
    matrix.index.name = indexName
    matrix.to_csv('data/%s.csv' %fileName)

def resetOverallStatsJSON():
    writeOverallStatsJSON(tableConstants.emptyOverallStats)

def getMatrix(fileName):
    matrix = pd.read_csv('./scripts/data/%s.csv' %fileName, index_col=0)
    matrix = matrix.fillna('')
    return matrix
    
def getOverallStatsJSON():
    overallStats = {}
    with open('./scripts/data/overallStats.json') as f_in:
        overallStats = json.load(f_in)
    f_in.close()
    return overallStats

def writeOverallStatsJSON(overallStats):
    with open("./scripts/data/overallStats.json", "w") as fp:
        json.dump(overallStats , fp) 
    fp.close()

def getOldTotalPicCount():
    startJSON = {}
    with open("./scripts/idFiles/workflowStart.json", "w") as fp:
        json.dump(startJSON , fp) 
    fp.close()
    return startJSON['totalPicCount']