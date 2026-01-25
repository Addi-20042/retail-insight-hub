import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportData {
  title: string;
  subtitle?: string;
  date?: string;
  sections: ExportSection[];
}

export interface ExportSection {
  title: string;
  type: 'table' | 'summary' | 'chart-placeholder';
  data?: Record<string, string | number>[];
  columns?: string[];
  summary?: { label: string; value: string | number }[];
}

export const exportToPdf = (exportData: ExportData): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header
  doc.setFontSize(24);
  doc.setTextColor(20, 184, 166); // Primary color
  doc.text(exportData.title, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  if (exportData.subtitle) {
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(exportData.subtitle, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
  }

  // Date
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Generated: ${exportData.date || new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Divider
  doc.setDrawColor(200);
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 10;

  // Sections
  exportData.sections.forEach((section) => {
    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    // Section title
    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text(section.title, 20, yPos);
    yPos += 8;

    if (section.type === 'summary' && section.summary) {
      section.summary.forEach((item) => {
        doc.setFontSize(11);
        doc.setTextColor(80);
        doc.text(`${item.label}: `, 25, yPos);
        doc.setTextColor(40);
        doc.text(String(item.value), 80, yPos);
        yPos += 6;
      });
      yPos += 5;
    }

    if (section.type === 'table' && section.data && section.columns) {
      autoTable(doc, {
        startY: yPos,
        head: [section.columns],
        body: section.data.map((row) => section.columns!.map((col) => String(row[col] ?? ''))),
        theme: 'striped',
        headStyles: {
          fillColor: [20, 184, 166],
          textColor: 255,
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        margin: { left: 20, right: 20 },
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    if (section.type === 'chart-placeholder') {
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(20, yPos, pageWidth - 40, 40, 3, 3, 'F');
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text('[Chart visualization - See dashboard for interactive view]', pageWidth / 2, yPos + 22, { align: 'center' });
      yPos += 50;
    }
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(
      `RetailMind Analytics Report - Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Download
  doc.save(`${exportData.title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
};

// Quick export helpers
export const exportForecastToPdf = (forecastData: any) => {
  exportToPdf({
    title: 'Sales Forecast Report',
    subtitle: 'AI-Powered Demand Prediction',
    sections: [
      {
        title: 'Forecast Summary',
        type: 'summary',
        summary: [
          { label: 'Forecast Period', value: forecastData?.days || '7 days' },
          { label: 'Model Accuracy', value: forecastData?.accuracy || '94.2%' },
          { label: 'Predicted Revenue', value: forecastData?.total || '$125,000' },
        ],
      },
      {
        title: 'Daily Predictions',
        type: 'chart-placeholder',
      },
    ],
  });
};

export const exportSegmentsToPdf = (segmentData: any[]) => {
  exportToPdf({
    title: 'Customer Segmentation Report',
    subtitle: 'K-Means Clustering Analysis',
    sections: [
      {
        title: 'Segment Overview',
        type: 'table',
        columns: ['name', 'count', 'avgSpend', 'frequency'],
        data: segmentData || [
          { name: 'High Value', count: 1250, avgSpend: '$450', frequency: 'Weekly' },
          { name: 'Regular', count: 3500, avgSpend: '$180', frequency: 'Bi-weekly' },
          { name: 'Occasional', count: 2800, avgSpend: '$75', frequency: 'Monthly' },
        ],
      },
    ],
  });
};

export const exportBasketToPdf = (basketRules: any[]) => {
  exportToPdf({
    title: 'Market Basket Analysis',
    subtitle: 'Product Association Rules',
    sections: [
      {
        title: 'Top Association Rules',
        type: 'table',
        columns: ['antecedent', 'consequent', 'support', 'confidence', 'lift'],
        data: basketRules || [
          { antecedent: 'Bread', consequent: 'Butter', support: '0.35', confidence: '0.72', lift: '2.1' },
          { antecedent: 'Coffee', consequent: 'Milk', support: '0.28', confidence: '0.65', lift: '1.9' },
        ],
      },
    ],
  });
};

export const exportAlertsToPdf = (alerts: any[]) => {
  exportToPdf({
    title: 'Alerts Report',
    subtitle: 'Anomaly Detection & Notifications',
    sections: [
      {
        title: 'Active Alerts',
        type: 'table',
        columns: ['type', 'message', 'severity', 'timestamp'],
        data: alerts || [
          { type: 'Anomaly', message: 'Unusual spike in sales', severity: 'High', timestamp: 'Today' },
        ],
      },
    ],
  });
};
