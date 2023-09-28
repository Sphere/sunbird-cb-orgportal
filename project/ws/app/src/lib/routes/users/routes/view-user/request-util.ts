import get from 'lodash/get'
import find from 'lodash/find'

// import { changeformat } from '../../../../project/ws/app/src/public-api'
export const constructReq = (form: any, userProfileData: any, userAgent: any, userCookies: any) => {
  const userid = userProfileData.userId || userProfileData.id || ''
  const profileReq = {
    id: userid,
    userId: userid,
    personalDetails: {
      firstname: get(form, 'firstname') ? form.firstname : userProfileData.personalDetails.firstname,
      middlename: get(form, 'middlename') ? form.middlename : userProfileData.personalDetails.middlename,
      surname: get(form, 'surname') ? form.surname : userProfileData.personalDetails.surname,
      about: get(form, 'about') ? form.about : userProfileData.personalDetails.about,
      photo: get(form, 'photo') !== 'NaN - NaN - NaN' ? form.photo : userProfileData.personalDetails.photo,
      dob: get(form, 'dob') ? form.dob : userProfileData.personalDetails.dob,
      nationality: get(form, 'nationality') ? form.nationality : userProfileData.personalDetails.nationality,
      domicileMedium: get(form, 'domicileMedium') ? form.domicileMedium : userProfileData.personalDetails.domicileMedium,
      regNurseRegMidwifeNumber: get(form, 'regNurseRegMidwifeNumber') ? form.regNurseRegMidwifeNumber :
        userProfileData.personalDetails.regNurseRegMidwifeNumber,
      nationalUniqueId: userProfileData.nationalUniqueId,
      doctorRegNumber: userProfileData.doctorRegNumber,
      instituteName: userProfileData.instituteName,
      nursingCouncil: userProfileData.nursingCouncil,
      gender: get(form, 'gender') ? form.gender : userProfileData.personalDetails.gender,
      maritalStatus: get(form, 'maritalStatus') ? form.maritalStatus : userProfileData.personalDetails.maritalStatus,
      category: userProfileData.category,
      knownLanguages: get(form, 'knownLanguages') ? form.knownLanguages : userProfileData.personalDetails.knownLanguages,
      countryCode: userProfileData.countryCode,
      mobile: get(form, 'mobile') ? form.mobile : userProfileData.personalDetails.mobile,
      telephone: userProfileData.personalDetails.telephone,
      primaryEmail: userProfileData.personalDetails.primaryEmail,
      officialEmail: '',
      personalEmail: '',
      postalAddress: get(form, 'postalAddress') ? form.postalAddress : userProfileData.personalDetails.postalAddress,
      pincode: get(form, 'pincode') ? form.pincode : userProfileData.personalDetails.pincode,
      osName: userProfileData.personalDetails.osName ? userProfileData.personalDetails.osName : userAgent.OS,
      browserName: userProfileData.personalDetails.browserName ? userProfileData.personalDetails.browserName : userAgent.browserName,
      userCookie: userProfileData.personalDetails.userCookie ? userProfileData.personalDetails.userCookie : userCookies,

    },
    academics: get(form, 'courseDegree') ? populateAcademics(form, userProfileData) : populateAcademics(userProfileData),
    employmentDetails: {
      service: get(userProfileData, 'employmentDetails.service') || '',
      cadre: get(userProfileData, 'employmentDetails.cadre') || '',
      allotmentYearOfService: checkvalue(get(userProfileData, 'employmentDetails.allotmentYearOfService') || ''),
      dojOfService: getDateFromText(get(userProfileData, 'employmentDetails.dojOfService') || ''),
      payType: get(userProfileData, 'employmentDetails.payType') || '',
      civilListNo: get(userProfileData, 'employmentDetails.civilListNo') || '',
      employeeCode: checkvalue(get(userProfileData, 'employmentDetails.employeeCode') || ''),
      officialPostalAddress: checkvalue(get(userProfileData, 'employmentDetails.officialPostalAddress') || ''),
      pinCode: checkvalue(get(userProfileData, 'employmentDetails.pinCode') || ''),
    },
    professionalDetails: [...getOrganisationsHistory(form, userProfileData)],
    skills: {
      additionalSkills: get(form, 'skillAquiredDesc') ? form.skillAquiredDesc : get(userProfileData, 'skills.additionalSkills'),
      certificateDetails: get(form, 'certificationDesc') ? form.certificationDesc : get(userProfileData, 'skills.certificateDetails') || '',
    },
    interests: {
      professional: get(form, 'professional') ? form.professional : get(userProfileData, 'interests.professional'),
      hobbies: get(form, 'hobbies') ? form.hobbies : get(userProfileData, 'interests.hobbies'),
    },
  }
  return { profileReq }
}

export const populateAcademics = (data?: any, userProfileData?: any) => {
  if (data.academics && data.academics.length > 0) {
    const academics: any = []
    if (data.academics && Array.isArray(data.academics)) {
      data.academics.map((item: any) => {
        switch (item.type) {
          case 'X_STANDARD':
            academics.push({
              nameOfQualification: '',
              type: 'X_STANDARD',
              nameOfInstitute: item.nameOfInstitute,
              yearOfPassing: `${item.yearOfPassing
                }`,
            })
            break
          case 'XII_STANDARD':
            academics.push({
              nameOfQualification: '',
              type: 'XII_STANDARD',
              nameOfInstitute: item.nameOfInstitute,
              yearOfPassing: `${item.yearOfPassing
                }`,
            })
            break
          case 'GRADUATE':
            academics.push({
              nameOfQualification: '',
              type: 'GRADUATE',
              nameOfInstitute: item.nameOfInstitute,
              yearOfPassing: `${item.yearOfPassing
                }`,
            })
            break
          case 'POSTGRADUATE':
            academics.push({
              nameOfQualification: '',
              type: 'POSTGRADUATE',
              nameOfInstitute: item.nameOfInstitute,
              yearOfPassing: `${item.yearOfPassing
                }`,
            })
            break
        }
      })
    }
    return academics
  } {
    const academics: any = []
    academics.push(getClass10(data, userProfileData))
    academics.push(getClass12(data, userProfileData))
    academics.push(getDegree(data, userProfileData))
    academics.push(getPostDegree(data, userProfileData))
    return academics
  }
}

export const getClass10 = (data: any, userProfileData?: any) => {
  const class10 = find(userProfileData.academics, { type: 'X_STANDARD' })
  return ({
    nameOfQualification: '',
    type: 'X_STANDARD',
    nameOfInstitute: data.courseDegree ?
      data.schoolName10 : get(class10, 'nameOfInstitute') ? get(class10, 'nameOfInstitute') : '',
    yearOfPassing: data.courseDegree ? `${data.yop10
      }` : get(class10, 'yearOfPassing') ? get(class10, 'yearOfPassing') : '',
  })
}

export const getClass12 = (data: any, userProfileData?: any) => {
  const class12 = find(userProfileData.academics, { type: 'XII_STANDARD' })
  return ({
    nameOfQualification: '',
    type: 'XII_STANDARD',
    nameOfInstitute: data.courseDegree ? data.schoolName12 :
      get(class12, 'nameOfInstitute') ? get(class12, 'nameOfInstitute') : '',
    yearOfPassing: data.courseDegree ? `${data.yop12
      }` : get(class12, 'yearOfPassing') ? get(class12, 'yearOfPassing') : '',
  })
}

export const getDegree = (data: any, userProfileData?: any) => {
  const GRADUATE = find(userProfileData.academics, { type: 'GRADUATE' })
  return ({
    nameOfQualification: data.courseDegree
      && data.degreeName ? data.degreeName :
      get(GRADUATE, 'nameOfQualification') ?
        get(GRADUATE, 'nameOfQualification') : '',
    type: 'GRADUATE',
    nameOfInstitute: data.courseDegree && data.degreeInstitute ?
      data.degreeInstitute : get(GRADUATE, 'nameOfInstitute') ? get(GRADUATE, 'nameOfInstitute') : '',
    yearOfPassing: data.courseDegree ? `${data.yopDegree
      }` : get(GRADUATE, 'yearOfPassing') ? get(GRADUATE, 'yearOfPassing') : '',
  })
}

export const getPostDegree = (data: any, userProfileData?: any) => {
  const POSTGRADUATE = find(userProfileData.academics, { type: 'POSTGRADUATE' })
  return ({
    nameOfQualification: data.courseDegree
      && data.postDegreeName ? data.postDegreeName : get(POSTGRADUATE, 'nameOfQualification') ?
      get(POSTGRADUATE, 'nameOfQualification') : '',
    type: 'POSTGRADUATE',
    nameOfInstitute: data.courseDegree ? data.postDegreeInstitute :
      get(POSTGRADUATE, 'nameOfInstitute') ? get(POSTGRADUATE, 'nameOfInstitute') : '',
    yearOfPassing: data.courseDegree ? `${data.yopPostDegree
      }` : get(POSTGRADUATE, 'yearOfPassing') ? get(POSTGRADUATE, 'yearOfPassing') : '',
  })
}

export const getOrganisationsHistory = (form: any, userProfileData: any) => {
  const organisations: any = []
  const org = {
    orgType: get(form, 'orgType') ? form.orgType : userProfileData.professionalDetails[0].orgType,
    professionOtherSpecify: get(form, 'professionOtherSpecify') ? form.professionOtherSpecify :
      userProfileData.professionalDetails[0].professionOtherSpecify,
    orgOtherSpecify: get(form, 'orgOtherSpecify') ? form.orgOtherSpecify :
      userProfileData.professionalDetails[0].orgOtherSpecify,
    name: get(form, 'orgName', get(userProfileData, 'professionalDetails[0].name', '')),
    nameOther: form.orgNameOther,
    industry: form.industry,
    industryOther: form.industryOther,
    designation: get(form, 'designation') ? form.designation : userProfileData.professionalDetails[0].designation,
    profession: get(form, 'profession') ? form.profession : userProfileData.professionalDetails[0].profession,
    location: get(form, 'location') ? form.location : userProfileData.professionalDetails[0].location,
    responsibilities: '',
    doj: get(form, 'doj') ? form.doj : userProfileData.professionalDetails[0].doj,
    description: form.orgDesc,
    completePostalAddress: '',
    additionalAttributes: {},
    osid: get(userProfileData, 'professionalDetails[0].osid') || undefined,
    block: get(form, 'block') ? form.block : userProfileData.professionalDetails[0].block,
    subcentre: get(form, 'subcentre') ? form.subcentre : userProfileData.professionalDetails[0].subcentre,
  }
  organisations.push(org)
  return organisations
}

export const checkvalue = (value: any) => {
  if (value && value === 'undefined') {
    // tslint:disable-next-line:no-parameter-reassignment
    value = ''
  } else {
    return value
  }
}
export const getDateFromText = (dateString: string): any => {
  if (dateString) {
    const splitValues: string[] = dateString.split('-')
    const [dd, mm, yyyy] = splitValues
    const dateToBeConverted = `${yyyy}-${mm}-${dd}`
    return new Date(dateToBeConverted)
  }
  return ''
}
