import type { StatementReportData } from "./types";

export const mockStatementReportData: StatementReportData = {
  suspect_id: "sus_gavin",
  suspect_name: "Gavin Thornwood",
  case_no: "HOM-2024-1012",
  date: "October 13, 2024",
  reporting_officer: "Det. Sarah Mitchell",
  filed_by: "Napa County Sheriff",
  statement_text:
    'Subject Gavin Thornwood presented himself in formal attire with impeccable posture, displaying the family signet ring prominently on his right hand. His demeanor was controlled and businesslike throughout the initial portion of the interview, though he maintained intense eye contact that appeared calculated to establish authority.\n\nSubject stated he spent the evening welcoming guests and discussing harvest results with various family friends. He cleared his throat before explaining, "As the eldest, I have certain responsibilities," noting that he had been preparing remarks for the formal toast. Subject described mingling extensively before the event\'s centerpiece moment. When asked about the critical timeframe, subject emphasized he was delivering the harvest toast to the assembled guests, witnessed by dozens of attendees. He stated, "The estate\'s legacy must be preserved," while gesturing as if holding a wine glass.\n\nSubject\'s voice became noticeably higher pitched when discussing Antonio\'s role at the estate. He characterized their relationship as professional, stating Antonio had been knowledgeable about viticulture. However, subject began twisting his signet ring repeatedly when pressed about disagreements. He deflected, invoking business terminology about operational decisions and his father\'s wishes regarding estate management.\n\nWhen asked about other family members, subject straightened his cuffs and stated, "This vintage of decision requires careful aging." He expressed pointed concerns about Sophia Thornwood, describing her presence in the family as recent and her influence over his father as troubling. Subject stated, "Tradition is not a constraint, it\'s a foundation," suggesting that certain individuals did not understand or respect the family\'s heritage. His tone became markedly colder when discussing her specifically.\n\nSubject maintained he discovered Antonio sometime after concluding his hosting duties and immediately alerted the gathering. He expressed full cooperation with the investigation.',
  signature: "Detective Sarah Mitchell",
  signature_date: "October 13, 2024",
};

export const StatementReportDefaults = {
  object: mockStatementReportData,
};
