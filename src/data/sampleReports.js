/**
 * Preset sample medical reports for instant 1-click testing in the Patient Portal.
 */

export const SAMPLE_REPORTS = [
  {
    id: 'cbc-report',
    title: 'Complete Blood Count (CBC) with Differential',
    category: 'Hematology',
    summary: 'Routine blood panel measuring hemoglobin, white blood cells, platelets, and red cell indices.',
    filename: 'sample_cbc_lab_report.png',
    text: `CENTRAL METROPOLITAN CLINICAL LABORATORY
PATIENT NAME: Alex Morgan
PATIENT ID: CM-982341
DATE OF COLLECTION: 2024-11-12
ORDERING PHYSICIAN: Dr. Robert Evans, MD

LABORATORY TEST REPORT: COMPLETE BLOOD COUNT (CBC)

TEST NAME                 RESULT    REFERENCE RANGE    UNITS    FLAG
---------------------------------------------------------------------
White Blood Cells (WBC)   11.8      4.5 - 11.0         10^3/uL  HIGH
Red Blood Cells (RBC)     4.65      4.30 - 5.90        10^6/uL  NORMAL
Hemoglobin (Hgb)          14.2      13.5 - 17.5        g/dL     NORMAL
Hematocrit (Hct)          42.1      38.8 - 50.0        %        NORMAL
Mean Corpuscular Vol(MCV) 90.5      80.0 - 100.0       fL       NORMAL
Mean Corpuscular Hgb(MCH) 30.5      27.0 - 33.0        pg       NORMAL
Platelets                 245       150 - 450          10^3/uL  NORMAL

DIFFERENTIAL:
Neutrophils (%)           74.0      40.0 - 70.0        %        HIGH
Lymphocytes (%)           18.2      20.0 - 45.0        %        LOW
Monocytes (%)             5.8       2.0 - 8.0          %        NORMAL
Eosinophils (%)           1.6       1.0 - 4.0          %        NORMAL
Basophils (%)             0.4       0.0 - 2.0          %        NORMAL

LAB NOTES: Mild leukocytosis with relative neutrophilia. Clinical correlation recommended.
REPORT STATUS: Final verified report.
`,
  },
  {
    id: 'lipid-panel',
    title: 'Lipid & Cardiovascular Panel',
    category: 'Biochemistry / Cardiology',
    summary: 'Cholesterol screening evaluating Total Cholesterol, LDL, HDL, and Triglycerides.',
    filename: 'sample_lipid_panel.png',
    text: `APEX DIAGNOSTIC HEALTHCARE SERVICES
PATIENT: Jordan Taylor
AGE: 46 | SEX: Female
SPECIMEN ID: SPEC-2024-88412
COLLECTION DATE: 2024-10-25
FASTING STATUS: Fasted 12 Hours

COMPREHENSIVE LIPID PROFILE

ASSAY                      RESULT    DESIRABLE RANGE    UNITS    STATUS
------------------------------------------------------------------------
Total Cholesterol          238       < 200              mg/dL    HIGH
Triglycerides              185       < 150              mg/dL    BORDERLINE HIGH
HDL Cholesterol (Good)     42        > 50 (Female)      mg/dL    LOW
LDL Cholesterol (Calculated)159      < 100              mg/dL    ELEVATED
Cholesterol / HDL Ratio    5.67      < 4.50             Ratio    HIGH
Non-HDL Cholesterol        196       < 130              mg/dL    HIGH

COMMENTS: Elevated atherogenic lipoproteins. Total cholesterol and LDL are above target thresholds.
RECOMMENDATION: Dietary evaluation, physical activity assessment, and clinical review with primary physician.
VERIFIED BY: Lab Director Dr. S. Patel, PhD, DABCC
`,
  },
  {
    id: 'lft-metabolic',
    title: 'Comprehensive Liver Function (LFT)',
    category: 'Hepatic & Metabolic',
    summary: 'Assessment of liver enzymes, bilirubin, albumin, and protein synthesis.',
    filename: 'sample_liver_function.png',
    text: `SUNRISE MEDICAL CENTER - CLINICAL BIOCHEMISTRY
PATIENT NAME: Daniel K. Vance
DOB: 1982-05-14
ACCESSION #: 7749102-L
DATE: 2024-09-18

HEPATIC FUNCTION PANEL (LIVER PANEL)

TEST                       RESULT    REFERENCE INTERVAL UNITS    INTERPRETATION
--------------------------------------------------------------------------------
Total Bilirubin            1.1       0.2 - 1.2          mg/dL    NORMAL
Direct Bilirubin           0.3       0.0 - 0.3          mg/dL    NORMAL
Alanine Aminotransferase(ALT) 58     7 - 45             U/L      MILD ELEVATION
Aspartate Aminotrans(AST)  49        8 - 40             U/L      MILD ELEVATION
Alkaline Phosphatase (ALP) 82        44 - 121           U/L      NORMAL
Total Protein              7.2       6.0 - 8.3          g/dL     NORMAL
Albumin                    4.3       3.5 - 5.0          g/dL     NORMAL
Globulin                   2.9       2.0 - 3.5          g/dL     NORMAL
A/G Ratio                  1.48      1.1 - 2.5                   NORMAL

INTERPRETATION: Isolated mild transaminitis (ALT 58, AST 49). Alkaline phosphatase and bilirubin are within reference limits.
`,
  },
];

/**
 * Render sample report text into a crisp PNG image File object
 * so it passes the backend file upload & Groq Vision OCR cleanly.
 */
export async function createSampleReportImageFile(text, filename = 'sample_report.png') {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const lines = text.split('\n');
  const fontSize = 16;
  const lineHeight = 24;
  const padding = 40;

  ctx.font = `${fontSize}px "Courier New", Courier, monospace`;
  let maxLineWidth = 0;
  for (const line of lines) {
    const w = ctx.measureText(line).width;
    if (w > maxLineWidth) maxLineWidth = w;
  }

  const width = Math.max(900, maxLineWidth + padding * 2);
  const height = lines.length * lineHeight + padding * 2 + 50;

  canvas.width = width;
  canvas.height = height;

  // Clean paper background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Clinical top header bar
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(0, 0, width, 8);

  // Watermark or clinical header
  ctx.fillStyle = '#0284c7';
  ctx.font = 'bold 13px "Segoe UI", Roboto, sans-serif';
  ctx.fillText('HEALTHCARE SAAS • CERTIFIED MEDICAL LABORATORY REPORT', padding, padding - 15);

  // Draw text lines
  ctx.font = `${fontSize}px "Courier New", Courier, monospace`;
  ctx.fillStyle = '#0f172a';

  lines.forEach((line, index) => {
    if (line.includes('HIGH') || line.includes('ELEVATED')) {
      ctx.fillStyle = '#dc2626';
      ctx.font = `bold ${fontSize}px "Courier New", Courier, monospace`;
    } else if (line.includes('LOW')) {
      ctx.fillStyle = '#2563eb';
      ctx.font = `bold ${fontSize}px "Courier New", Courier, monospace`;
    } else {
      ctx.fillStyle = '#1e293b';
      ctx.font = `${fontSize}px "Courier New", Courier, monospace`;
    }

    const y = padding + (index + 1) * lineHeight;
    ctx.fillText(line, padding, y);
  });

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const file = new File([blob], filename, { type: 'image/png' });
      resolve(file);
    }, 'image/png');
  });
}
