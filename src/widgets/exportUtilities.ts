import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import PptxGenJS from 'pptxgenjs';

export interface DashboardWidget {
  widgetType: string;
  config: {
    title: string;
    description: string;
    xAxisKey: string;
    yAxisKeys: string[];
    groupKey?: string;
    dataKey: string;
  };
  data: Record<string, unknown>[];
}

export interface NarrativeSession {
  id: string;
  timestamp: number;
  fileName: string;
  fileSize: number;
  question: string;
  sql: string;
  widgetType: string;
  chartConfig: Record<string, unknown>;
  description: string;
  dataSnapshot?: unknown[];
  tags: string[];
  thumbnail?: string;
}

export class ExportUtilities {
  exportChartAsPNG(container: HTMLElement, fileName: string): void {
    const svg = container.querySelector('svg');
    if (svg) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const data = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(blob => {
          const url = URL.createObjectURL(blob!);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          a.click();
          URL.revokeObjectURL(url);
        });
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(data);
    }
  }

  exportDataAsCSV(data: Record<string, unknown>[], fileName: string): void {
    if (!data.length) return;
    const firstRow = data[0];
    if (!firstRow) return;
    const headers = Object.keys(firstRow);
    const csv = [headers.join(','), ...data.map(row => headers.map(h => JSON.stringify(row[h])).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  async exportDashboardAsPDF(widgetElements: HTMLElement[], fileName: string): Promise<void> {
    const pdf = new jsPDF('p', 'mm', 'a4');

    for (let i = 0; i < widgetElements.length; i++) {
      const element = widgetElements[i];
      if (!element) continue;
      if (i > 0) pdf.addPage();
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const width = pdf.internal.pageSize.getWidth() - 20;
      pdf.addImage(imgData, 'PNG', 10, 10, width, 0);
    }
    pdf.save(fileName);
  }

  async exportDashboardAsPPTX(widgets: DashboardWidget[], fileName: string = 'dashboard.pptx'): Promise<void> {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';

    for (const widget of widgets) {
      const slide = pptx.addSlide();

      // Render widget to canvas (off-screen)
      const canvas = await this.renderWidgetToCanvas(widget);
      const imgData = canvas.toDataURL('image/png');

      slide.addImage({ data: imgData, x: 0.5, y: 0.5, w: 12, h: 5.5 });
      slide.addText(widget.config.title, { x: 0.5, y: 0.1, fontSize: 28, bold: true, color: 'ffffff' });
      slide.addText(widget.config.description, { x: 0.5, y: 6.2, fontSize: 14, color: '94a3b8' });
    }

    const base64 = await (pptx.write as (format: string) => Promise<string>)('base64');
    const blob = this.base64ToBlob(base64);
    saveAs(blob, fileName);
  }

  private base64ToBlob(base64: string): Blob {
    const byteArrays: Uint8Array[] = [];
    for (let offset = 0; offset < base64.length; offset += 512) {
      const slice = base64.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays as BlobPart[], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
  }

  async exportNarrativeReport(
    session: NarrativeSession,
    fileName: string = 'narrative-report.pdf'
  ): Promise<void> {
    const pdf = new jsPDF('p', 'mm', 'a4');

    // Header
    pdf.setFontSize(24);
    pdf.setTextColor(15, 23, 42); // slate-900
    pdf.text('Data Narrative Report', 20, 25);

    // Metadata
    pdf.setFontSize(10);
    pdf.setTextColor(100, 116, 139); // slate-500
    pdf.text('Question: ' + session.question, 20, 35);
    pdf.text('Generated: ' + new Date(session.timestamp).toLocaleString(), 20, 41);
    pdf.text('Source: ' + session.fileName, 20, 47);

    // SQL
    pdf.setFontSize(9);
    pdf.setFont('courier', 'normal');
    pdf.setTextColor(51, 65, 85); // slate-700
    const sqlLines = pdf.splitTextToSize(session.sql, 170);
    pdf.text(sqlLines, 20, 55);

    // Chart
    const canvas = await this.renderChartFromSession(session);
    const imgData = canvas.toDataURL('image/png');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = 170;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 20, 55 + sqlLines.length * 5, pdfWidth, pdfHeight);

    // Narrative
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(51, 65, 85);
    const narrativeY = 55 + sqlLines.length * 5 + pdfHeight + 10;
    const narrativeLines = pdf.splitTextToSize(session.description, 170);
    pdf.text(narrativeLines, 20, narrativeY);

    pdf.save(fileName);
  }

  private async renderWidgetToCanvas(widget: DashboardWidget): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 600;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1200, 600);
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px DM Sans';
    ctx.fillText(widget.config.title, 60, 100);
    ctx.font = '16px DM Sans';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(widget.config.description, 60, 140);

    // Draw a simple chart representation
    if (widget.data.length > 0) {
      const bw = 80;

      const xKey = widget.config.xAxisKey;
      const yKey = widget.config.yAxisKeys[0];

      if (xKey && yKey) {
        const maxVal = Math.max(...widget.data.map(r => Number(r[yKey]) || 0), 1);

        widget.data.slice(0, 10).forEach((row, i) => {
          const xVal = row[xKey];
          const yVal = Number(row[yKey]) || 0;
          const ratio = maxVal > 0 ? yVal / maxVal : 0;
          const barHeight = ratio * 300;
          const x = 60 + i * (bw + 20);
          ctx.fillStyle = '#f472b6';
          ctx.fillRect(x, 450 - barHeight, bw, barHeight);

          // Label
          ctx.fillStyle = '#94a3b8';
          ctx.font = '12px DM Sans';
          ctx.textAlign = 'center';
          if (xVal !== undefined) {
            ctx.fillText(String(xVal), x + bw / 2, 470);
          }
        });
      }
    }

    return canvas;
  }

  private async renderChartFromSession(session: NarrativeSession): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 600;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1200, 600);
    ctx.fillStyle = '#111827';
    ctx.font = '24px DM Sans';
    ctx.fillText('Chart: ' + session.widgetType, 60, 100);
    ctx.font = '16px DM Sans';
    ctx.fillStyle = '#5f6672';
    ctx.fillText(session.description, 60, 140);
    return canvas;
  }
}