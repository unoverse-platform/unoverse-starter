import React from "react";
import PrintPage from "../../../../atoms/print/PrintPage/PrintPage";
import styles from "./StatementReport.module.css";
import type { StatementReportProps, StatementReportData } from "./types";
import { mockStatementReportData } from "./defaults";

/* ── Police Shield SVG (matches PoliceReport) ── */
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

export default function StatementReport({ object }: StatementReportProps) {
  const d: StatementReportData = object ?? mockStatementReportData;

  // Inject Google Fonts into main document (required for Shadow DOM)
  React.useEffect(() => {
    const fontId = "gravity-statement-report-fonts";
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
            {/* Watermark */}
            <div className={styles.watermark}>STATEMENT</div>

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

            <div className={styles.reportTitle}>Official Witness Statement</div>

            {/* Meta fields */}
            <div className={styles.metaGrid}>
              <div className={styles.metaCell}>
                <span className={styles.metaLabel}>Case No.</span>
                <span className={styles.metaValue}>{d.case_no}</span>
              </div>
              <div className={styles.metaCell}>
                <span className={styles.metaLabel}>Date</span>
                <span className={styles.metaValue}>{d.date}</span>
              </div>
              <div className={styles.metaCell}>
                <span className={styles.metaLabel}>Reporting Officer</span>
                <span className={styles.metaValue}>{d.reporting_officer}</span>
              </div>
              <div className={styles.metaCell}>
                <span className={styles.metaLabel}>Filed By</span>
                <span className={styles.metaValue}>{d.filed_by}</span>
              </div>
            </div>

            {/* Statement Section */}
            <div className={styles.statementSection}>
              <div className={styles.statementHeader}>
                <span className={styles.statementTitle}>Official Statement</span>
                <span className={styles.statementName}>{d.suspect_name}</span>
              </div>
              <div className={styles.statementBody}>
                {d.statement_text.split(/\\n/g).map((para, i) =>
                  para.trim() ? (
                    <p key={i} className={styles.statementParagraph}>
                      {para.trim()}
                    </p>
                  ) : null,
                )}
              </div>
            </div>

            {/* Signature Block */}
            <div className={styles.signatureBlock}>
              <div className={styles.signatureLeft}>
                <div className={styles.handwrittenSignature}>{d.signature}</div>
                <div className={styles.signatureLine} />
                <div className={styles.signatureLabel}>Signature of Reporting Officer</div>
              </div>
              <div className={styles.signatureDate}>
                <div className={styles.typedDate}>{d.signature_date}</div>
                <div className={styles.signatureLine} />
                <div className={styles.signatureLabel}>Date</div>
              </div>
            </div>

            {/* Footer */}
            <div className={styles.pageFooter}>
              <span>CCPD Form 201-W</span>
              <span>Page 1 of 1</span>
              <span>Case {d.case_no}</span>
            </div>
          </div>
        </div>
      </PrintPage>
    </div>
  );
}
