from enum import Enum

class WorkflowSteps(Enum):
    GET_HD_PICS = "GET_HD_PICS"
    ANALYZE_HD_PICS = "ANALYZE_HD_PICS"
    GET_MONTH_PICS = "GET_MONTH_PICS"
    ANALYZE_MONTH_PICS = "ANALYZE_MONTH_PICS"
    GET_CATEGORY_PICS = "GET_CATEGORY_PICS"
    ANALYZE_CATEGORY_PICS = "ANALYZE_CATEGORY_PICS"
    FINISH_OVERALL_STATS = "FINISH_OVERALL_STATS"
    ERROR = "CURSE YOU PERRY THE PLATYPUS"
    COMPLETE = "I WILL BECOME OVERLORD OF THE TRI STATE AREAAAAAAA"