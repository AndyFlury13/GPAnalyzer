import getters
import builders
import tableConstants
import startJSONHandlers
import matrixToolkit
from workflowToolkit import WorkflowSteps


gpEndpoint, gpRequestHeader = getters.init_gp_server()
WORKFLOW_ARGUMENTS={
    "GET_HD_PICS":[gpRequestHeader],
    "ANALYZE_HD_PICS":[gpRequestHeader],
    "GET_MONTH_PICS":[gpRequestHeader],
    "ANALYZE_MONTH_PICS":[gpRequestHeader],
    "GET_CATEGORY_PICS":[gpRequestHeader],
    "ANALYZE_CATEGORY_PICS":[gpRequestHeader],
    "FINISH_OVERALL_STATS":[gpRequestHeader]
}

WORKFLOW_FUNCTIONS={
    "GET_HD_PICS":getters.get_hd_people_pics,
    "ANALYZE_HD_PICS":builders.createSubjectMatrices,
    "GET_MONTH_PICS":getters.get_all_month_pics,
    "ANALYZE_MONTH_PICS":builders.createMonthMatrices,
    "GET_CATEGORY_PICS":getters.get_all_category_pics,
    "ANALYZE_CATEGORY_PICS":builders.createCategoryMatrix,
    "FINISH_OVERALL_STATS":builders.finishOverallStatsJSON
}

MATRIX_RESET_ARGS = {
    'subjectCategory': [tableConstants.NAMES, [category[-1] for category in tableConstants.CATEGORIES], 'client', 'subjectCategory'],
    'picturedWith': [tableConstants.NAMES, tableConstants.NAMES, 'client', 'picturedWith'],
    'takerSubject': [tableConstants.NAMES, tableConstants.NAMES, 'client', 'takerSubject'],
    'subjectTaker': [tableConstants.NAMES, tableConstants.NAMES, 'client', 'subjectTaker'],
    'pictureBySubjectByMonth':[tableConstants.NAMES, [month['name'] for month in tableConstants.MONTHS], 'client', 'pictureBySubjectByMonth'],
    'pictureOfSubjectByMonth': [tableConstants.NAMES, [month['name'] for month in tableConstants.MONTHS], 'client', 'pictureOfSubjectByMonth']
}

def fakeBackendInator():
    workflowStartJSON = startJSONHandlers.getJSON("workflowStart")
    nextStep = workflowStartJSON["startingStep"]
    if workflowStartJSON["totalPicCount"] != builders.getTotalPicCount(gpRequestHeader):
        for matrix in MATRIX_RESET_ARGS.keys():
            matrixToolkit.resetMatrix(*MATRIX_RESET_ARGS[matrix])
    while nextStep != WorkflowSteps.COMPLETE.value and nextStep != WorkflowSteps.ERROR.value:
        workflowStep = WORKFLOW_FUNCTIONS.get(nextStep, "Invalid Input")
        workFlowStepArgs = WORKFLOW_ARGUMENTS.get(nextStep, "Invalid input")
        nextStep = workflowStep(*workFlowStepArgs).value

fakeBackendInator()
        