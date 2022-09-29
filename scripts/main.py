import gpWrapper
import getters
import builders
import tableConstants
import requests


## Open connection with GP server and retrieve credentials
gpEndpoint, gpRequestHeader = getters.init_gp_server()

## Populate month matrices

builders.resetMatrix(tableConstants.NAMES, [month['name'] for month in tableConstants.MONTHS], 'client', 'pictureBySubjectByMonth')
builders.resetMatrix(tableConstants.NAMES, [month['name'] for month in tableConstants.MONTHS], 'client', 'picturedOfSubjectByMonth')
getters.get_all_month_pics(gpRequestHeader)
builders.createMonthMatrices(gpRequestHeader)

## Populate subject matrices

builders.resetMatrix(tableConstants.NAMES, tableConstants.NAMES, 'client', 'takerSubject')
builders.resetMatrix(tableConstants.NAMES, tableConstants.NAMES, 'client', 'subjectTaker')
builders.resetMatrix(tableConstants.NAMES, tableConstants.NAMES, 'client', 'picturedWith')
getters.get_hd_people_pics(gpRequestHeader)
builders.createSubjectMatrices(gpRequestHeader)

## Populate category matrices

getters.init_gp_server()
getters.get_all_category_pics(gpRequestHeader)
builders.resetMatrix(tableConstants.NAMES, [category[-1] for category in tableConstants.CATEGORIES], 'client', 'subjectCategory')
builders.createCategoryMatrix(gpRequestHeader)


## Populate overall stats json

getters.init_gp_server()
### Total pictures 

