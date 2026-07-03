import React from "react";
import PrintPage from "../../../../atoms/print/PrintPage/PrintPage";
import styles from "./AutopsyReport.module.css";
import type { AutopsyReportProps } from "./types";
import { mockAutopsyReportData } from "./defaults";
import bodyOutlinePng from "../ForensicsReport/assets/body.png";

function Checkbox({ value, label }: { value: string | undefined; label: string }) {
  const checked = (value ?? "").trim() === "X";
  return (
    <span className={styles.checkbox}>
      <span className={styles.checkboxBox}>{checked ? "X" : "\u00A0"}</span>
      <span className={styles.checkboxLabel}>{label}</span>
    </span>
  );
}

function MedicalSeal({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="47" stroke="currentColor" strokeWidth="2" />
      <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="0.75" />
      <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
      {/* Caduceus — simplified */}
      <line x1="50" y1="22" x2="50" y2="78" stroke="currentColor" strokeWidth="1.5" />
      <path d="M40 32 Q50 38 60 32" stroke="currentColor" strokeWidth="1" fill="none" />
      <path d="M40 40 Q50 46 60 40" stroke="currentColor" strokeWidth="1" fill="none" />
      <circle cx="42" cy="28" r="4" stroke="currentColor" strokeWidth="0.75" fill="none" />
      <circle cx="58" cy="28" r="4" stroke="currentColor" strokeWidth="0.75" fill="none" />
      <path d="M44 24 L40 20" stroke="currentColor" strokeWidth="0.75" />
      <path d="M56 24 L60 20" stroke="currentColor" strokeWidth="0.75" />
      {/* Wings */}
      <path d="M38 30 L28 26 L24 28 L30 32" stroke="currentColor" strokeWidth="0.6" fill="none" />
      <path d="M62 30 L72 26 L76 28 L70 32" stroke="currentColor" strokeWidth="0.6" fill="none" />
      <text x="50" y="64" textAnchor="middle" fontSize="5" fontFamily="serif" fontWeight="bold" fill="currentColor">
        MEDICAL
      </text>
      <text x="50" y="70" textAnchor="middle" fontSize="5" fontFamily="serif" fontWeight="bold" fill="currentColor">
        EXAMINER
      </text>
    </svg>
  );
}

export default function AutopsyReport({ object }: AutopsyReportProps) {
  const d = object || mockAutopsyReportData;

  React.useEffect(() => {
    const fontId = "gravity-autopsy-report-fonts";
    if (!document.getElementById(fontId)) {
      const link = document.createElement("link");
      link.id = fontId;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Special+Elite&family=Caveat:wght@400;700&family=Playfair+Display:wght@700;900&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  return (
    <div className={styles.document}>
      <PrintPage size="letter">
        <div className={styles.pageContent}>
          <div className={styles.pageBorder}>
            {/* Form number */}
            <div className={styles.formNumber}>Form ME-7 Rev. 2024</div>

            {/* Confidential Stamp — bottom right only */}
            <div className={styles.confidentialStampBottom}>
              <div className={styles.confidentialRect}>Confidential</div>
            </div>

            {/* Header with seal */}
            <div className={styles.header}>
              <MedicalSeal className={styles.seal} />
              <div className={styles.headerText}>
                <div className={styles.headerDept}>Office of the Mortal Case Police Department</div>
                <div className={styles.headerSubDept}>Medical Examiner</div>
                <div className={styles.headerRule} />
                <div className={styles.headerTitle}>Report of Investigation by County Medical Examiner</div>
              </div>
              <MedicalSeal className={styles.seal} />
            </div>

            {/* Row 1: Decedent | Race | Sex | Age */}
            <div className={styles.formGrid}>
              <div className={`${styles.formCell} ${styles.formCellWide}`}>
                <span className={styles.formLabel}>1. Name of Decedent (Last, First, Middle)</span>
                <span className={styles.formValue}>{d.decedent}</span>
              </div>
              <div className={styles.formCell}>
                <span className={styles.formLabel}>2. Race</span>
                <span className={styles.formValue}>{d.race}</span>
              </div>
              <div className={styles.formCell}>
                <span className={styles.formLabel}>3. Sex</span>
                <span className={styles.formValue}>{d.sex}</span>
              </div>
              <div className={styles.formCell}>
                <span className={styles.formLabel}>4. Age</span>
                <span className={styles.formValue}>{d.age}</span>
              </div>
            </div>

            {/* Row 2: Date/Time of Death | Place of Death */}
            <div className={styles.formGrid}>
              <div className={`${styles.formCell} ${styles.formCellMed}`}>
                <span className={styles.formLabel}>5. Date and Time of Death</span>
                <span className={styles.formValue}>{d.time_of_death}</span>
              </div>
              <div className={`${styles.formCell} ${styles.formCellWide}`}>
                <span className={styles.formLabel}>6. Place of Death (Location)</span>
                <span className={styles.formValue}>{d.place}</span>
              </div>
            </div>

            {/* Type of Death */}
            <div className={styles.sectionDivider}>7. Type of Death</div>
            <div className={styles.typeOfDeathBar}>
              <Checkbox value={d.type_of_death_trauma} label="Trauma" />
              <Checkbox value={d.type_of_death_suicide} label="Suicide" />
              <Checkbox value={d.type_of_death_suddenly} label="Suddenly, when in apparent health" />
              <Checkbox value={d.type_of_death_found_dead} label="Found Dead" />
              <Checkbox value={d.type_of_death_suspicious} label="Suspicious / Unusual" />
              <Checkbox value={d.type_of_death_unusual} label="Unusual" />
              <Checkbox value={d.type_of_death_unnatural} label="Unnatural" />
            </div>

            {/* Comment */}
            <div className={styles.narrativeBlock}>
              <div className={styles.narrativeLabel}>8. Comment / Circumstances</div>
              <div className={styles.narrativeText}>{d.comment}</div>
            </div>

            {/* Description of Body */}
            <div className={styles.sectionDivider}>9. Description of Body</div>
            <div className={styles.formGrid}>
              <div className={styles.formCell}>
                <span className={styles.formLabel}>Height</span>
                <span className={styles.formValue}>{d.body_height}</span>
              </div>
              <div className={styles.formCell}>
                <span className={styles.formLabel}>Weight</span>
                <span className={styles.formValue}>{d.body_weight}</span>
              </div>
              <div className={styles.formCell}>
                <span className={styles.formLabel}>Hair</span>
                <span className={styles.formValue}>{d.body_hair}</span>
              </div>
              <div className={styles.formCell}>
                <span className={styles.formLabel}>Eyes</span>
                <span className={styles.formValue}>{d.body_eyes}</span>
              </div>
            </div>
            <div className={styles.formGrid}>
              <div className={`${styles.formCell} ${styles.formCellMed}`}>
                <span className={styles.formLabel}>Clothing</span>
                <span className={styles.formValue}>{d.body_clothes}</span>
              </div>
              <div className={`${styles.formCell} ${styles.formCellMed}`}>
                <span className={styles.formLabel}>Accessories / Personal Effects</span>
                <span className={styles.formValue}>{d.body_accessories}</span>
              </div>
            </div>

            {/* Middle: Marks/Wounds + Tox on left, Body Diagram on right */}
            <div className={styles.middleSection}>
              <div className={styles.middleLeft}>
                <div className={styles.narrativeBlock}>
                  <div className={styles.narrativeLabel}>10. Marks, Wounds, and External Findings</div>
                  <div className={styles.narrativeText}>{d.marks_and_wounds}</div>
                </div>
                <div className={styles.narrativeBlock}>
                  <div className={styles.narrativeLabel}>11. Toxicology Results</div>
                  <div className={styles.narrativeText}>{d.toxicology_results}</div>
                </div>
              </div>
              <div className={styles.middleRight}>
                <img src={bodyOutlinePng} alt="Body outline diagram" className={styles.bodyOutlineImg} />
              </div>
            </div>

            {/* Cause + Further Action */}
            <div className={styles.causeRow}>
              <div className={styles.causeCol}>
                <div className={styles.narrativeLabel}>12. Probable Cause of Death</div>
                <div className={styles.narrativeText}>{d.probable_cause_of_death}</div>
              </div>
              <div className={styles.causeCol}>
                <div className={styles.narrativeLabel}>13. Further Action Recommended</div>
                <div className={styles.narrativeText}>{d.further_action}</div>
              </div>
            </div>

            {/* Declaration */}
            <div className={styles.declaration}>
              I hereby declare that, upon notification of the death described herein, I took charge of the body and
              conducted an inquiry into the cause and manner of death in accordance with Section 22-4515 of the code,
              and that the information contained in this report is true and accurate to the best of my knowledge and
              belief.
            </div>

            {/* Signature Row */}
            <div className={styles.signatureRow}>
              <div className={styles.signatureCol}>
                <div className={styles.signatureValue}>{d.date}</div>
                <div className={styles.signatureLine} />
                <div className={styles.signatureLabel}>14. Date</div>
              </div>
              <div className={`${styles.signatureCol} ${styles.signatureColWide}`}>
                <div className={styles.signatureValue}>{d.place_of_investigation}</div>
                <div className={styles.signatureLine} />
                <div className={styles.signatureLabel}>15. Place of Investigation</div>
              </div>
              <div className={`${styles.signatureCol} ${styles.signatureColWide}`}>
                <div className={styles.signatureHandwritten}>{d.signature}</div>
                <div className={styles.signatureLine} />
                <div className={styles.signatureLabel}>16. Signature of County Medical Examiner</div>
              </div>
            </div>
          </div>
        </div>
      </PrintPage>
    </div>
  );
}
