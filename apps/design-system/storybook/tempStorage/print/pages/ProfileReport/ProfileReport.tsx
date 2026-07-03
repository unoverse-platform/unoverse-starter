import React from "react";
import PrintPage from "../../../../atoms/print/PrintPage/PrintPage";
import styles from "./ProfileReport.module.css";
import type { ProfileReportProps } from "./types";
import { mockProfileReportData } from "./defaults";

function DeptSeal({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="47" stroke="currentColor" strokeWidth="2" />
      <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="0.75" />
      <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
      {/* Eagle simplified */}
      <path
        d="M50 24 L44 34 L38 30 L42 38 L36 42 L44 40 L50 48 L56 40 L64 42 L58 38 L62 30 L56 34 Z"
        stroke="currentColor"
        strokeWidth="0.8"
        fill="none"
      />
      {/* Shield */}
      <path d="M44 48 L44 58 Q44 64 50 68 Q56 64 56 58 L56 48 Z" stroke="currentColor" strokeWidth="1" fill="none" />
      <line x1="50" y1="48" x2="50" y2="66" stroke="currentColor" strokeWidth="0.5" />
      <line x1="44" y1="54" x2="56" y2="54" stroke="currentColor" strokeWidth="0.5" />
      {/* Stars */}
      <circle cx="34" cy="50" r="1.5" fill="currentColor" />
      <circle cx="66" cy="50" r="1.5" fill="currentColor" />
      <circle cx="50" cy="76" r="1.5" fill="currentColor" />
      <text x="50" y="84" textAnchor="middle" fontSize="4.5" fontFamily="serif" fontWeight="bold" fill="currentColor">
        INVESTIGATION
      </text>
    </svg>
  );
}

export default function ProfileReport({ object }: ProfileReportProps) {
  const d = object || mockProfileReportData;

  React.useEffect(() => {
    const fontId = "gravity-profile-report-fonts";
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
            {/* Top section: header + identity on left, photo on right */}
            <div className={styles.topSection}>
              <div className={styles.topLeft}>
                {/* Header */}
                <div className={styles.header}>
                  <DeptSeal className={styles.seal} />
                  <div className={styles.headerText}>
                    <div className={styles.headerDept}>Department of</div>
                    <div className={styles.headerRedacted}>
                      <div className={styles.redactedBar} />
                      <div className={styles.redactedBar} />
                    </div>
                  </div>
                </div>

                {/* Identity: Name / Aliases / Status */}
                <div className={styles.identitySection}>
                  <div className={styles.identityRow}>
                    <span className={styles.identityLabel}>Name:</span>
                    <span className={styles.identityValue}>{d.name}</span>
                  </div>
                  <div className={styles.identityRow}>
                    <span className={styles.identityLabel}>Aliases:</span>
                    <span className={styles.identityValue}>{d.aliases}</span>
                  </div>
                  <div className={styles.identityRow}>
                    <span className={styles.identityLabel}>Status:</span>
                    <span className={styles.identityValue}>{d.status}</span>
                  </div>
                </div>
              </div>

              {/* Photo — polaroid style */}
              <div className={styles.photoArea}>
                <div className={styles.polaroid}>
                  <img src={d.photo_url} alt={`Photo of ${d.name}`} className={styles.polaroidImg} />
                </div>
              </div>
            </div>

            {/* Details Grid: 2 columns */}
            <div className={styles.detailsSection}>
              <div className={styles.detailsGrid}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Date of Birth:</span>
                  <span className={styles.detailValue}>{d.date_of_birth}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Scars &amp; Marks:</span>
                  <span className={styles.detailValue}>{d.scars_marks}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Place of Birth:</span>
                  <span className={styles.detailValue}>{d.place_of_birth}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Hair Color:</span>
                  <span className={styles.detailValue}>{d.hair_color}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Height:</span>
                  <span className={styles.detailValue}>{d.height}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Coat Color(s):</span>
                  <span className={styles.detailValue}>{d.coat_colors}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Weight:</span>
                  <span className={styles.detailValue}>{d.weight}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Eye Color:</span>
                  <span className={styles.detailValue}>{d.eye_color}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Build:</span>
                  <span className={styles.detailValue}>{d.build}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Sex:</span>
                  <span className={styles.detailValue}>{d.sex}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Occupation:</span>
                  <span className={styles.detailValue}>{d.occupation}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Species:</span>
                  <span className={styles.detailValue}>{d.species}</span>
                </div>
              </div>
            </div>

            {/* Lined spacer */}
            <div className={styles.linedSpacer} />

            {/* Remarks */}
            <div className={styles.remarksSection}>
              <div className={styles.remarksHeader}>Remarks:</div>
              <div className={styles.remarksBody}>{d.remarks}</div>
              <div className={styles.remarksLines} />
            </div>

            {/* Case watermark */}
            <div className={styles.caseWatermark}>Case File — Confidential</div>
          </div>
        </div>
      </PrintPage>
    </div>
  );
}
