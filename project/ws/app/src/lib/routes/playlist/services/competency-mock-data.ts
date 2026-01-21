/**
 * Mock Competency List Data
 * 
 * This file contains mock data for competency list API response.
 * This data simulates the response from: POST /apis/proxies/v8/entity/v1/upload
 * 
 * TODO: Once the real API is ready, replace this mock with actual API integration
 * in competency-api.service.ts
 * 
 * Response Structure:
 * - result.data.entity[]: Array of competency entities
 * - Each entity has: id, name, description, code, language, children (levels)
 * - Children represent competency levels (L1-L5)
 * 
 * @see https://api-docs/entity/v1/upload for API documentation
 */

export const MOCK_COMPETENCY_LIST_RESPONSE = {
    "id": "api.entity.upload",
    "ver": "v1",
    "ts": "2026-01-20T07:50:34.982865Z",
    "params": {
        "resmsgid": "97858733-a93b-4566-bba3-a21cb64aa44b",
        "msgid": "7cedc27b-70aa-42f8-9aa8-67292f7afa7c",
        "status": "SUCCESS",
        "err": null,
        "errmsg": null
    },
    "responseCode": "OK",
    "result": {
        "count": 1,
        "data": {
            "entity": [
                {
                    "id": 661,
                    "type": "competency",
                    "name": "Pregnancy Identification",
                    "description": "Conducts initial assessment to identify pregnancy, High risk pregnancy and estimate gestational age",
                    "language": "en",
                    "additionalProperties": {},
                    "status": "Active",
                    "source": null,
                    "level": "C97",
                    "levelId": 0,
                    "entityType": "Domain",
                    "area": "Clinical Care",
                    "createdDate": "2025-10-07T00:00:00.000+0000",
                    "createdBy": "admin",
                    "updatedDate": "2025-10-07T00:00:00.000+0000",
                    "updatedBy": "admin",
                    "reviewedDate": "2025-10-07T00:00:00.000+0000",
                    "reviewedBy": "reviewer",
                    "translation": null,
                    "code": "C97",
                    "children": [
                        {
                            "code": "C97_L1",
                            "level": "L1",
                            "levelId": 1,
                            "name": "Understands health of males and females",
                            "description": "Understands the anatomy/physiology of male reproductive, sexual health -Understands the female reproductive, sexual, menstrual and ovulatory health -Understands initial assessment protocols for PW during ANC -Understands HRP identification and protocol for tracking",
                            "language": "en",
                            "id": 662,
                            "additionalProperties": {
                                "parentCompetency": "Pregnancy Identification"
                            },
                            "type": "level",
                            "status": "Active"
                        },
                        {
                            "code": "C97_L2",
                            "level": "L2",
                            "levelId": 2,
                            "name": "Identifies pregnancy using Nischaya Kit",
                            "description": "Conducts pregnancy test using Nischaya kit -Interprets results accurately",
                            "language": "en",
                            "id": 663,
                            "additionalProperties": {
                                "parentCompetency": "Pregnancy Identification"
                            },
                            "type": "level",
                            "status": "Active"
                        },
                        {
                            "code": "C97_L3",
                            "level": "L3",
                            "levelId": 3,
                            "name": "Conducts initial assessment",
                            "description": "Conducts obstetric investigation of the woman as per protocol -Conducts menstrual history investigation of the woman as per protocol -Understands TD/booster doses",
                            "language": "en",
                            "id": 664,
                            "additionalProperties": {
                                "parentCompetency": "Pregnancy Identification"
                            },
                            "type": "level",
                            "status": "Active"
                        },
                        {
                            "code": "C97_L4",
                            "level": "L4",
                            "levelId": 4,
                            "name": "Identifies HRP and Estimates gestational age",
                            "description": "Identifies HRP based on initial assessments -Applies the principles to estimate EDD through LMP -Estimates EDD through initial assessment",
                            "language": "en",
                            "id": 665,
                            "additionalProperties": {
                                "parentCompetency": "Pregnancy Identification"
                            },
                            "type": "level",
                            "status": "Active"
                        },
                        {
                            "code": "C97_L5",
                            "level": "L5",
                            "levelId": 5,
                            "name": "Administers TD/booster as per protocol",
                            "description": "Administers TD/Booster dose as per regime -Assesses the level of risk of pregnancy based on initial assessment -Maintains a line list of HRP cases for follow-up care",
                            "language": "en",
                            "id": 666,
                            "additionalProperties": {
                                "parentCompetency": "Pregnancy Identification"
                            },
                            "type": "level",
                            "status": "Active"
                        }
                    ]
                },
                {
                    "id": 667,
                    "type": "competency",
                    "name": "Birth Planning and Preparedness",
                    "description": "Creates and implements Micro-birth Plans for PW",
                    "language": "en",
                    "additionalProperties": {},
                    "status": "Active",
                    "source": null,
                    "level": "C98",
                    "levelId": 0,
                    "entityType": "Domain",
                    "area": "Community Health",
                    "createdDate": "2025-10-07T00:00:00.000+0000",
                    "createdBy": "admin",
                    "updatedDate": "2025-10-07T00:00:00.000+0000",
                    "updatedBy": "admin",
                    "reviewedDate": "2025-10-07T00:00:00.000+0000",
                    "reviewedBy": "reviewer",
                    "translation": null,
                    "code": "C98",
                    "children": [
                        {
                            "code": "C98_L1",
                            "level": "L1",
                            "levelId": 1,
                            "name": "Understands components of registration for PW",
                            "description": "Understands components of registration for pregnant women",
                            "language": "en",
                            "id": 668,
                            "additionalProperties": {
                                "parentCompetency": "Birth Planning and Preparedness"
                            },
                            "type": "level",
                            "status": "Active"
                        },
                        {
                            "code": "C98_L2",
                            "level": "L2",
                            "levelId": 2,
                            "name": "Prepare schedule for PW/HRP",
                            "description": "Prepares schedule for TT injection and antenatal visits",
                            "language": "en",
                            "id": 669,
                            "additionalProperties": {
                                "parentCompetency": "Birth Planning and Preparedness"
                            },
                            "type": "level",
                            "status": "Active"
                        },
                        {
                            "code": "C98_L3",
                            "level": "L3",
                            "levelId": 3,
                            "name": "Provides referral support",
                            "description": "Identifies referral facilities and transport for beneficiary",
                            "language": "en",
                            "id": 670,
                            "additionalProperties": {
                                "parentCompetency": "Birth Planning and Preparedness"
                            },
                            "type": "level",
                            "status": "Active"
                        },
                        {
                            "code": "C98_L4",
                            "level": "L4",
                            "levelId": 4,
                            "name": "Manages patient issues",
                            "description": "Identifies patient issues and proposes mitigation strategies",
                            "language": "en",
                            "id": 671,
                            "additionalProperties": {
                                "parentCompetency": "Birth Planning and Preparedness"
                            },
                            "type": "level",
                            "status": "Active"
                        },
                        {
                            "code": "C98_L5",
                            "level": "L5",
                            "levelId": 5,
                            "name": "Conducts visits to counsel PW",
                            "description": "Conduct home visits to counsel pregnant woman on birth planning",
                            "language": "en",
                            "id": 672,
                            "additionalProperties": {
                                "parentCompetency": "Birth Planning and Preparedness"
                            },
                            "type": "level",
                            "status": "Active"
                        }
                    ]
                }
            ]
        }
    }
}
