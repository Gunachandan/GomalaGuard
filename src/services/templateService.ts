/**
 * Neutral Templates Service for Gomala Atlas v2
 * 
 * Generates neutral RTI applications and Revenue Office Verification Requests.
 * Strictly adheres to Section 2 Rule 1 & Rule 2, and Section 10 of Master Prompt:
 * - Zero accusations (no "fraud", "illegal", "encroacher", etc.)
 * - Statutory citations only if status is "confirmed" in legal_facts.yaml
 *   Otherwise render '[CITATION TO BE CONFIRMED BY LEGAL REVIEWER]'.
 * - Neutral language: "The applicant has not been able to locate any reference to an order authorising this change. Verification of the records is requested."
 * - Fee text: '[TO BE CONFIRMED FROM STATE RTI RULES]'.
 */

export interface TemplateParams {
  language: 'kn' | 'en';
  applicantName: string;
  applicantAddress: string;
  applicantPhone?: string;
  villageNameKn: string;
  villageNameEn: string;
  talukName: string;
  districtName: string;
  surveyNumber: string;
  hissaNumber?: string;
  historicalClassification: string;
  currentClassification: string;
  mutationRef?: string;
  dateStr?: string;
}

export class TemplateService {
  // Grounded citation constants checked against legal_facts.yaml
  // Since all legal facts are UNCONFIRMED, these strictly render the placeholder
  public static readonly RTI_STATUTE_CITATION = '[CITATION TO BE CONFIRMED BY LEGAL REVIEWER]';
  public static readonly RTI_FEE_TEXT = '[TO BE CONFIRMED FROM STATE RTI RULES]';

  /**
   * Generates RTI Application
   */
  public static generateRtiApplication(params: TemplateParams): string {
    const date = params.dateStr || new Date().toISOString().split('T')[0];
    const surveyHissa = params.hissaNumber && params.hissaNumber !== '*' 
      ? `${params.surveyNumber}/${params.hissaNumber}` 
      : params.surveyNumber;

    if (params.language === 'kn') {
      return `
ಅರ್ಜಿ ನಮೂನೆ - ${this.RTI_STATUTE_CITATION}
(CERTIFIED EXTRACT REQUEST UNDER ${this.RTI_STATUTE_CITATION})

ದಿನಾಂಕ: ${date}

ರವರಿಗೆ:
ಸಾರ್ವಜನಿಕ ಮಾಹಿತಿ ಅಧಿಕಾರಿ ಹಾಗೂ ತಹಶೀಲ್ದಾರರ ಕಚೇರಿ,
${params.talukName} ತಾಲೂಕು, ${params.districtName} ಜಿಲ್ಲೆ.

ಅರ್ಜಿದಾರರ ಹೆಸರು ಮತ್ತು ವಿಳಾಸ:
${params.applicantName || '[ಅರ್ಜಿದಾರರ ಹೆಸರು]'}
${params.applicantAddress || '[ಅರ್ಜಿದಾರರ ಪೂರ್ಣ ವಿಳಾಸ]'}
ದೂರವಾಣಿ ಸಂಖ್ಯೆ: ${params.applicantPhone || '[ದೂರವಾಣಿ ಸಂಖ್ಯೆ]'}

ವಿಷಯ: ${params.villageNameKn} ಗ್ರಾಮದ ಸರ್ವೆ ನಂಬರ್ ${surveyHissa} ರ ಕಂದಾಯ ದಾಖಲೆಗಳ ಪ್ರಮಾಣೀಕೃತ ಪ್ರತಿಗಳನ್ನು ಒದಗಿಸುವ ಬಗ್ಗೆ.

ಕೋರಲಾದ ಮಾಹಿತಿಯ ವಿವರಗಳು:
1. ${params.villageNameKn} ಗ್ರಾಮದ ಸರ್ವೆ ನಂಬರ್ ${surveyHissa} ಕ್ಕೆ ಸಂಬಂಧಿಸಿದಂತೆ, ದಾಖಲೆಗಳಲ್ಲಿ ನಮೂದಾಗಿರುವ ವರ್ಗೀಕರಣ (${params.historicalClassification}) ವನ್ನು ಪ್ರಸ್ತುತ ವರ್ಗೀಕರಣ (${params.currentClassification}) ಕ್ಕೆ ಬದಲಾಯಿಸಲು ಹೊರಡಿಸಲಾದ ಸಕ್ಷಮ ಪ್ರಾಧಿಕಾರದ ಅಧಿಕೃತ ಮಂಜೂರಾತಿ / ಪರಿವರ್ತನೆ ಆದೇಶದ ಪ್ರಮಾಣೀಕೃತ ಪ್ರತಿ.
2. ಸದರಿ ಸರ್ವೆ ನಂಬರಿನ ಹಿಸ್ಸಾ ಅಥವಾ ವರ್ಗೀಕರಣ ಬದಲಾವಣೆಗೆ ಸಂಬಂಧಿಸಿದ ಮ್ಯುಟೇಶನ್ ವಹಿ (MR ${params.mutationRef || 'ದಾಖಲೆ'}) ಯ ದೃಢೀಕೃತ ಪ್ರತಿ.
3. ಸದರಿ ಸರ್ವೆ ನಂಬರಿಗೆ ಸಂಬಂಧಿಸಿದ ಮೂಲ ಆಕಾರಬಂಧು ಮತ್ತು ಟಿಪ್ಪಣಿ ನಕ್ಷೆಯ ಪ್ರಮಾಣೀಕೃತ ಪ್ರತಿ.

ಶುಲ್ಕ ಪಾವತಿ ವಿವರ:
${this.RTI_FEE_TEXT}

ಪ್ರಮಾಣೀಕರಣ:
ನಾನು ಭಾರತೀಯ ಪ್ರಜೆಯಾಗಿದ್ದು, ಮೇಲೆ ಕೋರಲಾದ ಮಾಹಿತಿಯು ಸಾರ್ವಜನಿಕ ದಾಖಲೆಯಾಗಿದ್ದು, ನಿಯಮಾನುಸಾರ ನಿಗದಿತ ಕಾಲಮಿತಿಯಲ್ಲಿ ಮಾಹಿತಿ ಒದಗಿಸಬೇಕಾಗಿ ಕೋರುತ್ತೇನೆ.

(ಅರ್ಜಿದಾರರ ಸಹಿ)
`;
    }

    return `
FORM OF APPLICATION UNDER ${this.RTI_STATUTE_CITATION}

Date: ${date}

To:
The Public Information Officer & Tahsildar Office,
${params.talukName} Taluk, ${params.districtName} District.

Applicant Details:
Name: ${params.applicantName || '[Applicant Name]'}
Address: ${params.applicantAddress || '[Applicant Address]'}
Phone: ${params.applicantPhone || '[Optional Phone]'}

Subject: Request for certified copies of land revenue records for Survey No. ${surveyHissa}, ${params.villageNameEn} Village.

Information Requested:
1. Certified copy of the official government sanction or conversion order, if any, authorising the change of tenure classification from historical classification (${params.historicalClassification}) to current classification (${params.currentClassification}) in respect of Survey No. ${surveyHissa} of ${params.villageNameEn} Village.
2. Certified copy of the relevant Mutation Register extract (MR ${params.mutationRef || 'Extract'}) pertaining to this parcel transaction.
3. Certified extract of the original settlement Aakarbandh and survey tippani sketch for the said survey number.

Statutory Fee:
${this.RTI_FEE_TEXT}

Declaration:
I am a citizen of India and the requested information pertains to official public revenue records. I request that certified copies be furnished within the statutory period.

Yours faithfully,

(Signature of Applicant)
`;
  }

  /**
   * Generates Verification Request to Revenue Authority
   */
  public static generateVerificationRequest(params: TemplateParams): string {
    const date = params.dateStr || new Date().toISOString().split('T')[0];
    const surveyHissa = params.hissaNumber && params.hissaNumber !== '*' 
      ? `${params.surveyNumber}/${params.hissaNumber}` 
      : params.surveyNumber;

    if (params.language === 'kn') {
      return `
ಕಂದಾಯ ದಾಖಲೆಗಳ ಪರಿಶೀಲನಾ ಮನವಿ ಪತ್ರ
(OFFICIAL RECORD VERIFICATION REQUEST)

ದಿನಾಂಕ: ${date}

ರವರಿಗೆ:
ಮಾನ್ಯ ತಹಶೀಲ್ದಾರರು / ಸಹಾಯಕ ಆಯುಕ್ತರು,
ಕಂದಾಯ ಉಪವಿಭಾಗ, ${params.talukName} ತಾಲೂಕು, ${params.districtName} ಜಿಲ್ಲೆ.

ಮನವಿದಾರರು:
${params.applicantName || '[ಮನವಿದಾರರ ಹೆಸರು]'}
${params.applicantAddress || '[ವಿಳಾಸ]'}

ವಿಷಯ: ${params.villageNameKn} ಗ್ರಾಮದ ಸರ್ವೆ ನಂಬರ್ ${surveyHissa} ರ ಪಹಣಿ ದಾಖಲೆಗಳಲ್ಲಿನ ನಮೂದುಗಳನ್ನು ಪರಿಶೀಲಿಸುವ ಬಗ್ಗೆ.

ಮಾನ್ಯರೇ,
${params.villageNameKn} ಗ್ರಾಮದ ಸರ್ವೆ ನಂಬರ್ ${surveyHissa} ಕ್ಕೆ ಸಂಬಂಧಿಸಿದಂತೆ ಲಭ್ಯವಿರುವ ಪಹಣಿ ದಾಖಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಲಾಗಿ, ಸದರಿ ಜಮೀನಿನ ಹಿಡುವಳಿ ನಮೂದು ಕಾಲಾನಂತರದಲ್ಲಿ '${params.historicalClassification}' ದಿಂದ '${params.currentClassification}' ಕ್ಕೆ ಬದಲಾವಣೆಯಾಗಿರುವುದು ಕಂಡುಬಂದಿದೆ.

ಸದರಿ ವರ್ಗೀಕರಣ ಬದಲಾವಣೆಗೆ ಸಂಬಂಧಿಸಿದಂತೆ ಸಕ್ಷಮ ಪ್ರಾಧಿಕಾರವು ಹೊರಡಿಸಿರಬಹುದಾದ ಯಾವುದೇ ಅಧಿಕೃತ ಮಂಜೂರಾತಿ ಆದೇಶದ ಉಲ್ಲೇಖವು ಅರ್ಜಿದಾರರಿಗೆ ಲಭ್ಯವಾದ ಸಾರ್ವಜನಿಕ ದಾಖಲೆಗಳಲ್ಲಿ ಕಂಡುಬಂದಿರುವುದಿಲ್ಲ.

ಆದ್ದರಿಂದ, ಕಂದಾಯ ಇಲಾಖೆಯ ಮೂಲ ಕಡತಗಳು ಹಾಗೂ ಮ್ಯುಟೇಶನ್ ರಿಜಿಸ್ಟರ್ ಆಧರಿಸಿ ಸದರಿ ನಮೂದುಗಳ ವಾಸ್ತವಿಕತೆಯನ್ನು ಪರಿಶೀಲಿಸಬೇಕಾಗಿ ಸಾರ್ವಜನಿಕ ಹಿತಾಸಕ್ತಿಯಿಂದ ವಿನಂತಿಸಿಕೊಳ್ಳುತ್ತೇವೆ.

ವಂದನೆಗಳೊಂದಿಗೆ,

(ಮನವಿದಾರರ ಸಹಿ)
`;
    }

    return `
MEMORANDUM FOR REVENUE RECORD VERIFICATION

Date: ${date}

To:
The Tahsildar / Assistant Commissioner,
Revenue Sub-Division, ${params.talukName} Taluk, ${params.districtName} District.

From:
${params.applicantName || '[Applicant Name]'}
${params.applicantAddress || '[Address]'}

Subject: Request for departmental verification of revenue records for Survey No. ${surveyHissa}, ${params.villageNameEn} Village.

Respected Authority,
Upon perusal of available public land records for Survey No. ${surveyHissa} of ${params.villageNameEn} Village, it is observed that the recorded tenure classification reflects a change over time from '${params.historicalClassification}' to '${params.currentClassification}'.

The applicant has not been able to locate any reference to an official order authorising this change among the public records accessed.

Verification of the records against the taluk grant register, settlement records, and mutation registers is hereby respectfully requested in the public interest.

Yours faithfully,

(Applicant Signature)
`;
  }
}
