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
  type: 'table' | 'summary' | 'chart-placeholder' | 'chart-image';
  data?: Record<string, string | number>[];
  columns?: string[];
  summary?: { label: string; value: string | number }[];
  imageDataUrl?: string;
}

export const exportToPdf = (exportData: ExportData): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header
  doc.setFontSize(24);
  doc.setTextColor(20, 184, 166);
  doc.text(exportData.title, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  if (exportData.subtitle) {
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(exportData.subtitle, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
  }

  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Generated: ${exportData.date || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  doc.setDrawColor(200);
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 10;

  exportData.sections.forEach((section) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

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

    if (section.type === 'chart-image' && section.imageDataUrl) {
      const imgWidth = pageWidth - 40;
      const imgHeight = imgWidth * 0.5; // 2:1 aspect
      if (yPos + imgHeight > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        yPos = 20;
        doc.setFontSize(14);
        doc.setTextColor(40);
        doc.text(section.title, 20, yPos);
        yPos += 8;
      }
      doc.addImage(section.imageDataUrl, 'PNG', 20, yPos, imgWidth, imgHeight);
      yPos += imgHeight + 10;
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

  doc.save(`${exportData.title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
};

// ─── Capture a chart container as a PNG data URL ───
export const captureChartAsImage = async (chartContainerSelector: string): Promise<string | null> => {
  try {
    const container = document.querySelector(chartContainerSelector);
    if (!container) return null;

    const svgElement = container.querySelector('svg');
    if (!svgElement) return null;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width * 2;
        canvas.height = img.height * 2;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    });
  } catch {
    return null;
  }
};

// ─── Enhanced forecast export with chart + data table ───
export const exportForecastToPdf = async (forecastData: {
  days: string;
  accuracy: string;
  total: string;
  avgDaily?: string;
  trend?: string;
  forecastRows?: { date: string; predicted: number; lower: number; upper: number }[];
}) => {
  // Try to capture the chart
  const chartImage = await captureChartAsImage('.recharts-wrapper');

  const sections: ExportSection[] = [
    {
      title: 'Forecast Summary',
      type: 'summary',
      summary: [
        { label: 'Forecast Period', value: `${forecastData.days} days` },
        { label: 'Predicted Revenue', value: forecastData.total },
        ...(forecastData.avgDaily ? [{ label: 'Avg Daily Sales', value: forecastData.avgDaily }] : []),
        ...(forecastData.trend ? [{ label: 'Trend Direction', value: forecastData.trend }] : []),
        { label: 'Model Accuracy', value: forecastData.accuracy },
      ],
    },
  ];

  // Add chart image if captured
  if (chartImage) {
    sections.push({
      title: 'Forecast Chart',
      type: 'chart-image',
      imageDataUrl: chartImage,
    });
  } else {
    sections.push({
      title: 'Forecast Chart',
      type: 'chart-placeholder',
    });
  }

  // Add forecast data table
  if (forecastData.forecastRows && forecastData.forecastRows.length > 0) {
    sections.push({
      title: 'Daily Forecast Data',
      type: 'table',
      columns: ['Date', 'Predicted (₹)', 'Lower Bound (₹)', 'Upper Bound (₹)'],
      data: forecastData.forecastRows.map((row) => ({
        'Date': row.date,
        'Predicted (₹)': row.predicted.toLocaleString('en-IN'),
        'Lower Bound (₹)': row.lower.toLocaleString('en-IN'),
        'Upper Bound (₹)': row.upper.toLocaleString('en-IN'),
      })),
    });
  }

  exportToPdf({
    title: 'Sales Forecast Report',
    subtitle: 'AI-Powered Demand Prediction',
    sections,
  });
};

export const exportSegmentsToPdf = (segmentData: any[], chartImage?: string | null) => {
  const sections: ExportSection[] = [
    {
      title: 'Segment Overview',
      type: 'table',
      columns: ['name', 'count', 'avgSpend', 'frequency'],
      data: segmentData || [],
    },
  ];

  if (chartImage) {
    sections.push({ title: 'Segment Distribution', type: 'chart-image', imageDataUrl: chartImage });
  }

  exportToPdf({
    title: 'Customer Segmentation Report',
    subtitle: 'K-Means Clustering Analysis',
    sections,
  });
};

export const exportBasketToPdf = (basketRules: any[]) => {
  const sections: ExportSection[] = [];

  if (basketRules && basketRules.length > 0) {
    sections.push({
      title: 'Summary',
      type: 'summary',
      summary: [
        { label: 'Rules Found', value: basketRules.length },
        { label: 'Avg Confidence', value: `${(basketRules.reduce((s, r) => s + (r.confidence || 0), 0) / basketRules.length * 100).toFixed(1)}%` },
        { label: 'Avg Lift', value: `${(basketRules.reduce((s, r) => s + (r.lift || 0), 0) / basketRules.length).toFixed(2)}x` },
      ],
    });
  }

  sections.push({
    title: 'Top Association Rules',
    type: 'table',
    columns: ['Product A', 'Product B', 'Support', 'Confidence', 'Lift'],
    data: (basketRules || []).map(r => ({
      'Product A': r.productA || r.antecedent || '',
      'Product B': r.productB || r.consequent || '',
      'Support': `${((r.support || 0) * 100).toFixed(1)}%`,
      'Confidence': `${((r.confidence || 0) * 100).toFixed(1)}%`,
      'Lift': `${(r.lift || 0).toFixed(2)}x`,
    })),
  });

  exportToPdf({
    title: 'Market Basket Analysis',
    subtitle: 'Product Association Rules',
    sections,
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
