import React from "react";
import PrintPage from "../../../../atoms/print/PrintPage/PrintPage";
import styles from "./ForensicsReport.module.css";
import type { ForensicsReportProps } from "./types";
import { mockForensicsReportData } from "./defaults";

function ForensicsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Government seal style icon */}
      <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="2" />
      <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1" />
      {/* Microscope simplified */}
      <rect x="44" y="25" width="12" height="4" rx="1" fill="currentColor" opacity="0.8" />
      <rect x="48" y="29" width="4" height="24" fill="currentColor" opacity="0.8" />
      <circle cx="50" cy="58" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
      <rect x="38" y="68" width="24" height="3" rx="1" fill="currentColor" opacity="0.8" />
      <rect x="42" y="71" width="16" height="2" rx="1" fill="currentColor" opacity="0.6" />
      {/* Stars */}
      <text x="20" y="52" fontSize="6" fill="currentColor">
        ★
      </text>
      <text x="76" y="52" fontSize="6" fill="currentColor">
        ★
      </text>
    </svg>
  );
}

export default function ForensicsReport({ object }: ForensicsReportProps) {
  const d = object || mockForensicsReportData;

  // Inject Google Fonts into main document (required for Shadow DOM)
  React.useEffect(() => {
    const fontId = "gravity-forensics-report-fonts";
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
      <PrintPage size="letter" orientation="landscape">
        <div className={styles.pageContent}>
          <div className={styles.pageBorder}>
            {/* Watermark */}
            <div className={styles.watermark}>FORENSICS</div>

            {/* Approved Stamp */}
            <div className={styles.stampContainer}>
              <div className={styles.stamp}>Approved</div>
            </div>

            {/* Header Bar */}
            <div className={styles.headerBar}>
              <ForensicsIcon className={styles.headerIcon} />
              <div className={styles.headerTextBlock}>
                <div className={styles.headerLabel}>Forensics Report</div>
                <div className={styles.headerTitle}>Forensics Report</div>
              </div>
              <div className={styles.pageNumber}>
                PAGE <strong>1</strong> OF <strong>1</strong>
              </div>
            </div>

            {/* Report Information */}
            <div className={styles.reportInfoTitle}>Report Information</div>
            <div className={styles.metaGrid}>
              <div className={styles.metaCell}>
                <span className={styles.metaLabel}>Lab Number</span>
                <span className={styles.metaValue}>{d.lab_number}</span>
              </div>
              <div className={styles.metaCell}>
                <span className={styles.metaLabel}>Date Received</span>
                <span className={styles.metaValue}>{d.date_received}</span>
              </div>
              <div className={styles.metaCell}>
                <span className={styles.metaLabel}>Case Number</span>
                <span className={styles.metaValue}>{d.case_number}</span>
              </div>
              <div className={styles.metaCell}>
                <span className={styles.metaLabel}>Date Reported</span>
                <span className={styles.metaValue}>{d.date_reported}</span>
              </div>
              <div className={`${styles.metaCell} ${styles.metaCellWide}`}>
                <span className={styles.metaLabel}>Requesting Agency</span>
                <span className={styles.metaValue}>{d.requesting_agency}</span>
              </div>
            </div>

            {/* Item Analysis */}
            <div className={styles.analysisSectionTitle}>Item Analysis</div>
            <div className={styles.examinerLine}>{d.examiner_name}</div>

            <div className={styles.itemsGrid}>
              {/* Item 1 */}
              <div className={styles.evidenceItem}>
                <div className={styles.evidenceRow}>
                  <span className={styles.evidenceLabel}>Number:</span>
                  <span className={styles.evidenceNumberValue}>{d.item_1_number}</span>
                </div>
                <div className={styles.evidenceRow}>
                  <span className={styles.evidenceLabel}>Description:</span>
                  <span className={styles.evidenceValue}>{d.item_1_description}</span>
                </div>
                <div className={styles.evidenceRow}>
                  <span className={styles.evidenceLabel}>Method:</span>
                  <span className={styles.evidenceValue}>{d.item_1_method}</span>
                </div>
                <div className={styles.evidenceRow}>
                  <span className={styles.evidenceLabel}>Result:</span>
                  <span className={styles.evidenceValue}>{d.item_1_result}</span>
                </div>
              </div>

              {/* Item 2 */}
              <div className={styles.evidenceItem}>
                <div className={styles.evidenceRow}>
                  <span className={styles.evidenceLabel}>Number:</span>
                  <span className={styles.evidenceNumberValue}>{d.item_2_number}</span>
                </div>
                <div className={styles.evidenceRow}>
                  <span className={styles.evidenceLabel}>Description:</span>
                  <span className={styles.evidenceValue}>{d.item_2_description}</span>
                </div>
                <div className={styles.evidenceRow}>
                  <span className={styles.evidenceLabel}>Method:</span>
                  <span className={styles.evidenceValue}>{d.item_2_method}</span>
                </div>
                <div className={styles.evidenceRow}>
                  <span className={styles.evidenceLabel}>Result:</span>
                  <span className={styles.evidenceValue}>{d.item_2_result}</span>
                </div>
              </div>

              {/* Item 3 */}
              <div className={styles.evidenceItem}>
                <div className={styles.evidenceRow}>
                  <span className={styles.evidenceLabel}>Number:</span>
                  <span className={styles.evidenceNumberValue}>{d.item_3_number}</span>
                </div>
                <div className={styles.evidenceRow}>
                  <span className={styles.evidenceLabel}>Description:</span>
                  <span className={styles.evidenceValue}>{d.item_3_description}</span>
                </div>
                <div className={styles.evidenceRow}>
                  <span className={styles.evidenceLabel}>Method:</span>
                  <span className={styles.evidenceValue}>{d.item_3_method}</span>
                </div>
                <div className={styles.evidenceRow}>
                  <span className={styles.evidenceLabel}>Result:</span>
                  <span className={styles.evidenceValue}>{d.item_3_result}</span>
                </div>
              </div>

              {/* Item 4 */}
              <div className={styles.evidenceItem}>
                <div className={styles.evidenceRow}>
                  <span className={styles.evidenceLabel}>Number:</span>
                  <span className={styles.evidenceNumberValue}>{d.item_4_number}</span>
                </div>
                <div className={styles.evidenceRow}>
                  <span className={styles.evidenceLabel}>Description:</span>
                  <span className={styles.evidenceValue}>{d.item_4_description}</span>
                </div>
                <div className={styles.evidenceRow}>
                  <span className={styles.evidenceLabel}>Method:</span>
                  <span className={styles.evidenceValue}>{d.item_4_method}</span>
                </div>
                <div className={styles.evidenceRow}>
                  <span className={styles.evidenceLabel}>Result:</span>
                  <span className={styles.evidenceValue}>{d.item_4_result}</span>
                </div>
              </div>
            </div>

            {/* Conclusion */}
            <div className={styles.conclusionSection}>
              <div className={styles.conclusionHeader}>
                <span className={styles.conclusionTitle}>Conclusion</span>
              </div>
              <div className={styles.conclusionBody}>{d.conclusion}</div>
            </div>

            {/* Signature */}
            <div className={styles.signatureBlock}>
              <div className={styles.signatureLeft}>
                <div className={styles.handwrittenSignature}>{d.signature}</div>
                <div className={styles.signatureLine} />
                <div className={styles.signatureLabel}>Forensic Examiner</div>
              </div>
              <div className={styles.signatureBoxes}>
                <div className={styles.signatureBox}>
                  <div className={styles.signatureBoxLabel}>Initial</div>
                </div>
                <div className={styles.signatureBox}>
                  <div className={styles.signatureBoxLabel}>Date</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={styles.pageFooter}>
              <span>Forensic Laboratory Report</span>
              <span>Page 1 of 1</span>
              <span>Lab {d.lab_number}</span>
            </div>
          </div>
        </div>
      </PrintPage>
    </div>
  );
}
