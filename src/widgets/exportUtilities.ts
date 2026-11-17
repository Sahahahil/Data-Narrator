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

  exportDataAsCSV(data: any[], fileName: string): void {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csv = [headers.join(','), ...data.map(row => headers.map(h => JSON.stringify(row[h])).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }
}