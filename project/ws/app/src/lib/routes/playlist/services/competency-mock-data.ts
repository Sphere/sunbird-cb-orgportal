/**
 * Competency Mock Data
 * 
 * This file provides sample competency data for development and testing purposes.
 * It mimics what we'll eventually get from the real competency API.
 * 
 * Why we need this:
 * - The actual API integration is still in progress
 * - This lets us build and test the UI without waiting for the backend
 * - Makes it easier to develop offline or when the API is unavailable
 * 
 * What's inside:
 * - Two sample competencies: "Pregnancy Identification" and "Birth Planning and Preparedness"
 * - Each competency has 5 levels (L1-L5) representing different skill stages
 * - The structure matches exactly what the real API will return
 * 
 * Note: Once the API is live, we'll swap this out for real data calls in competency-api.service.ts
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
                    "id": 100,
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
                    "id": 102,
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
                },
                {
                    "id": 103,
                    "type": "competency",
                    "name": "Clinical Risk Management",
                    "description": "Identifies and mitigates clinical risks in patient care",
                    "language": "en",
                    "additionalProperties": {},
                    "status": "Active",
                    "source": null,
                    "level": "C99",
                    "levelId": 0,
                    "entityType": "Domain",
                    "area": "Clinical Governance",
                    "createdDate": "2025-10-07T00:00:00.000+0000",
                    "createdBy": "admin",
                    "updatedDate": "2025-10-07T00:00:00.000+0000",
                    "updatedBy": "admin",
                    "reviewedDate": "2025-10-07T00:00:00.000+0000",
                    "reviewedBy": "reviewer",
                    "translation": null,
                    "code": "C99",
                    "children": [
                        {
                            "code": "C99_L1",
                            "level": "L1",
                            "levelId": 1,
                            "name": "Identifies basic risks",
                            "description": "Recognizes common hazards in the clinical environment",
                            "language": "en",
                            "id": 673,
                            "additionalProperties": { "parentCompetency": "Clinical Risk Management" },
                            "type": "level",
                            "status": "Active"
                        },
                        {
                            "code": "C99_L2",
                            "level": "L2",
                            "levelId": 2,
                            "name": "Reports incidents",
                            "description": "correctly logs clinical incidents and near-misses",
                            "language": "en",
                            "id": 674,
                            "additionalProperties": { "parentCompetency": "Clinical Risk Management" },
                            "type": "level",
                            "status": "Active"
                        },
                        {
                            "code": "C99_L3",
                            "level": "L3",
                            "levelId": 3,
                            "name": "Conducts risk assessments",
                            "description": "Performs routine risk assessments for assigned patients",
                            "language": "en",
                            "id": 675,
                            "additionalProperties": { "parentCompetency": "Clinical Risk Management" },
                            "type": "level",
                            "status": "Active"
                        },
                        {
                            "code": "C99_L4",
                            "level": "L4",
                            "levelId": 4,
                            "name": "Analyzes root causes",
                            "description": "Participates in root cause analysis of adverse events",
                            "language": "en",
                            "id": 676,
                            "additionalProperties": { "parentCompetency": "Clinical Risk Management" },
                            "type": "level",
                            "status": "Active"
                        },
                        {
                            "code": "C99_L5",
                            "level": "L5",
                            "levelId": 5,
                            "name": "Develops safety protocols",
                            "description": "Creates and implements department-wide safety protocols",
                            "language": "en",
                            "id": 677,
                            "additionalProperties": { "parentCompetency": "Clinical Risk Management" },
                            "type": "level",
                            "status": "Active"
                        }
                    ]
                },
                {
                    "id": 104,
                    "type": "competency",
                    "name": "Digital Health Literacy",
                    "description": "Effectively uses digital tools for patient management",
                    "language": "en",
                    "additionalProperties": {},
                    "status": "Active",
                    "source": null,
                    "level": "C100",
                    "levelId": 0,
                    "entityType": "Domain",
                    "area": "Technology",
                    "createdDate": "2025-10-07T00:00:00.000+0000",
                    "createdBy": "admin",
                    "updatedDate": "2025-10-07T00:00:00.000+0000",
                    "updatedBy": "admin",
                    "reviewedDate": "2025-10-07T00:00:00.000+0000",
                    "reviewedBy": "reviewer",
                    "translation": null,
                    "code": "C100",
                    "children": [
                        {
                            "code": "C100_L1",
                            "level": "L1",
                            "levelId": 1,
                            "name": "Uses basic EMR",
                            "description": "Enters basic patient data into Electronic Medical Records",
                            "language": "en",
                            "id": 678,
                            "additionalProperties": { "parentCompetency": "Digital Health Literacy" },
                            "type": "level",
                            "status": "Active"
                        },
                        {
                            "code": "C100_L2",
                            "level": "L2",
                            "levelId": 2,
                            "name": "Navigates digital portals",
                            "description": "Retrieves lab reports and histories from digital portals",
                            "language": "en",
                            "id": 679,
                            "additionalProperties": { "parentCompetency": "Digital Health Literacy" },
                            "type": "level",
                            "status": "Active"
                        },
                        {
                            "code": "C100_L3",
                            "level": "L3",
                            "levelId": 3,
                            "name": "Troubleshoots entry errors",
                            "description": "Identifies and corrects data entry errors in the system",
                            "language": "en",
                            "id": 680,
                            "additionalProperties": { "parentCompetency": "Digital Health Literacy" },
                            "type": "level",
                            "status": "Active"
                        },
                        {
                            "code": "C100_L4",
                            "level": "L4",
                            "levelId": 4,
                            "name": "Uses telemedicine tools",
                            "description": "Conducts remote consultations using telemedicine software",
                            "language": "en",
                            "id": 681,
                            "additionalProperties": { "parentCompetency": "Digital Health Literacy" },
                            "type": "level",
                            "status": "Active"
                        },
                        {
                            "code": "C100_L5",
                            "level": "L5",
                            "levelId": 5,
                            "name": "Optimizes workflows",
                            "description": "Suggests and implements digital workflow improvements",
                            "language": "en",
                            "id": 682,
                            "additionalProperties": { "parentCompetency": "Digital Health Literacy" },
                            "type": "level",
                            "status": "Active"
                        }
                    ]
                },
                {
                    "id": 105,
                    "type": "competency",
                    "name": "Empathy in Patient Care",
                    "description": "Demonstrates empathetic communication with patients",
                    "language": "en",
                    "additionalProperties": {},
                    "status": "Active",
                    "source": null,
                    "level": "C101",
                    "levelId": 0,
                    "entityType": "Behavioral",
                    "area": "Soft Skills",
                    "createdDate": "2025-10-07T00:00:00.000+0000",
                    "createdBy": "admin",
                    "updatedDate": "2025-10-07T00:00:00.000+0000",
                    "updatedBy": "admin",
                    "reviewedDate": "2025-10-07T00:00:00.000+0000",
                    "reviewedBy": "reviewer",
                    "translation": null,
                    "code": "C101",
                    "children": [
                        {
                            "code": "C101_L1",
                            "level": "L1",
                            "levelId": 1,
                            "name": "Listens actively",
                            "description": "Demonstrates active listening during patient interactions",
                            "language": "en",
                            "id": 683,
                            "additionalProperties": { "parentCompetency": "Empathy in Patient Care" },
                            "type": "level",
                            "status": "Active"
                        },
                        {
                            "code": "C101_L2",
                            "level": "L2",
                            "levelId": 2,
                            "name": "Validates feelings",
                            "description": "Acknowledges and validates patient concerns verbally",
                            "language": "en",
                            "id": 684,
                            "additionalProperties": { "parentCompetency": "Empathy in Patient Care" },
                            "type": "level",
                            "status": "Active"
                        },
                        {
                            "code": "C101_L3",
                            "level": "L3",
                            "levelId": 3,
                            "name": "Adjusts communication",
                            "description": "Adapts tone and language to patient emotional state",
                            "language": "en",
                            "id": 685,
                            "additionalProperties": { "parentCompetency": "Empathy in Patient Care" },
                            "type": "level",
                            "status": "Active"
                        },
                        {
                            "code": "C101_L4",
                            "level": "L4",
                            "levelId": 4,
                            "name": "Manages distress",
                            "description": "Effectively de-escalates situations with distressed patients",
                            "language": "en",
                            "id": 686,
                            "additionalProperties": { "parentCompetency": "Empathy in Patient Care" },
                            "type": "level",
                            "status": "Active"
                        },
                        {
                            "code": "C101_L5",
                            "level": "L5",
                            "levelId": 5,
                            "name": "Mentors empathy",
                            "description": "Trains junior staff in empathetic communication techniques",
                            "language": "en",
                            "id": 687,
                            "additionalProperties": { "parentCompetency": "Empathy in Patient Care" },
                            "type": "level",
                            "status": "Active"
                        }
                    ]
                }
            ]
        }
    }
}
