import React from "react";
import PrintPage from "../../../../atoms/print/PrintPage/PrintPage";
import styles from "./PoliceReport.module.css";
import type { PoliceReportProps } from "./types";
import { mockPoliceReportData } from "./defaults";

function PoliceShield({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M50 2L8 20V58C8 85 50 116 50 116C50 116 92 85 92 58V20L50 2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <path
        d="M50 10L16 25V56C16 78 50 106 50 106C50 106 84 78 84 56V25L50 10Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
      <line x1="50" y1="25" x2="50" y2="95" stroke="currentColor" strokeWidth="1" />
      <line x1="20" y1="55" x2="80" y2="55" stroke="currentColor" strokeWidth="1" />
      <text x="50" y="46" textAnchor="middle" fontSize="11" fontWeight="bold" fontFamily="serif" fill="currentColor">
        POLICE
      </text>
      <text x="50" y="72" textAnchor="middle" fontSize="8" fontFamily="serif" fill="currentColor">
        CASS
      </text>
      <text x="50" y="83" textAnchor="middle" fontSize="7" fontFamily="serif" fill="currentColor">
        COUNTY
      </text>
    </svg>
  );
}

export default function PoliceReport({ object }: PoliceReportProps) {
  const d = object || mockPoliceReportData;

  // Inject Google Fonts into main document (required for Shadow DOM)
  React.useEffect(() => {
    const fontId = "gravity-police-report-fonts";
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
      {/* PAGE 1 */}
      <PrintPage size="letter">
        <div className={styles.pageContent}>
          <div className={styles.pageBorder}>
            {/* Watermark */}
            <div className={styles.watermark}>OFFICIAL</div>

            {/* Header */}
            <div className={styles.header}>
              <PoliceShield className={styles.shield} />
              <div className={styles.departmentName}>
                <span className={styles.county}>Cass County</span>
                <div className={styles.headerRule} />
                <span className={styles.dept}>Police Department</span>
                <span className={styles.headerSubtext}>Office of the Chief of Police &bull; Established 1887</span>
              </div>
            </div>

            <div className={styles.reportTitle}>Incident Report</div>

            {/* Meta fields */}
            <div className={styles.metaGrid}>
              <div className={styles.metaCell}>
                <span className={styles.metaLabel}>Case No.</span>
                <span className={styles.metaValue}>{d.case_number}</span>
              </div>
              <div className={styles.metaCell}>
                <span className={styles.metaLabel}>Date Filed</span>
                <span className={styles.metaValue}>{d.date}</span>
              </div>
              <div className={`${styles.metaCell} ${styles.metaCellWide}`}>
                <span className={styles.metaLabel}>Reporting Officer</span>
                <span className={styles.metaValue}>{d.reporting_officer}</span>
              </div>
              <div className={`${styles.metaCell} ${styles.metaCellWide}`}>
                <span className={styles.metaLabel}>Location of Incident</span>
                <span className={styles.metaValue}>{d.location}</span>
              </div>
            </div>

            {/* Sections */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>Incident Summary</span>
              </div>
              <div className={styles.sectionBody}>
                <p>{d.incident_summary}</p>
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>Victim Information</span>
              </div>
              <div className={styles.sectionBody}>
                <p>{d.victim_information}</p>
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>Scene Description</span>
              </div>
              <div className={styles.sectionBody}>
                <p>{d.scene_description}</p>
              </div>
            </div>

            {/* Footer */}
            <div className={styles.pageFooter}>
              <span>CCPD Form 101-A</span>
              <span>Page 1 of 2</span>
              <span>Case {d.case_number}</span>
            </div>
          </div>
        </div>
      </PrintPage>

      {/* PAGE 2 */}
      <PrintPage size="letter">
        <div className={styles.pageContent}>
          <div className={styles.pageBorder}>
            {/* Watermark */}
            <div className={styles.watermark}>OFFICIAL</div>

            {/* Page 2 Header */}
            <div className={styles.page2Header}>
              <div className={styles.page2HeaderTop}>
                <PoliceShield className={styles.shieldSmall} />
                <div className={styles.page2HeaderText}>
                  <span className={styles.supplementalTitle}>Supplemental Report</span>
                  <span className={styles.page2CaseRef}>
                    Case No. {d.case_number} &mdash; {d.date}
                  </span>
                </div>
              </div>
              <div className={styles.page2Rule} />
            </div>

            {/* Sections */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>Discovery Details</span>
              </div>
              <div className={styles.sectionBody}>
                <p>{d.discovery_details}</p>
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>Initial Findings</span>
              </div>
              <div className={styles.sectionBody}>
                <p>{d.initial_findings}</p>
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>Next Steps</span>
              </div>
              <div className={styles.sectionBody}>
                <p>{d.next_steps}</p>
              </div>
            </div>

            {/* Signature Block */}
            <div className={styles.signatureBlock}>
              <div className={styles.signatureLeft}>
                <div className={styles.handwrittenSignature}>{d.signature || "Det. Marcus Webb"}</div>
                <div className={styles.signatureLine} />
                <div className={styles.signatureLabel}>Signature of Reporting Officer</div>
              </div>
              <div className={styles.signatureRight}>
                <div className={styles.typedName}>{d.signature_title || "Lead Detective"}</div>
                <div className={styles.signatureLine} />
                <div className={styles.signatureLabel}>Title / Rank</div>
              </div>
              <div className={styles.signatureDate}>
                <div className={styles.typedDate}>{d.date}</div>
                <div className={styles.signatureLine} />
                <div className={styles.signatureLabel}>Date</div>
              </div>
            </div>

            {/* Footer */}
            <div className={styles.pageFooter}>
              <span>CCPD Form 101-A</span>
              <span>Page 2 of 2</span>
              <span>Case {d.case_number}</span>
            </div>
          </div>
        </div>
      </PrintPage>
    </div>
  );
}
