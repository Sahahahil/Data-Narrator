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
    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;
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
}