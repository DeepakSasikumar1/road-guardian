import { useCallback, useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useObstacles } from '@/context/ObstacleContext';
import { format } from 'date-fns';

export function useDownloadReport() {
  const { stats, obstacles } = useObstacles();
  const [isGenerating, setIsGenerating] = useState(false);

  const downloadPDF = useCallback(async (chartContainerId?: string) => {
    setIsGenerating(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;

      // Header
      pdf.setFillColor(26, 26, 46);
      pdf.rect(0, 0, pageWidth, 40, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RoadWatch AI', margin, 18);
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Analytics Report - Salem District', margin, 28);
      
      pdf.setFontSize(9);
      pdf.text(`Generated: ${format(new Date(), 'PPpp')}`, margin, 35);
      
      yPosition = 50;

      // Reset text color
      pdf.setTextColor(0, 0, 0);

      // Summary Section
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Executive Summary', margin, yPosition);
      yPosition += 10;

      // Key Metrics Grid
      const metrics = [
        { label: 'Total Obstacles', value: stats.totalObstacles.toString() },
        { label: 'High Severity', value: stats.highSeverity.toString() },
        { label: 'Medium Severity', value: stats.mediumSeverity.toString() },
        { label: 'Low Severity', value: stats.lowSeverity.toString() },
        { label: 'Resolved Today', value: stats.resolvedToday.toString() },
        { label: 'Active Alerts', value: stats.activeAlerts.toString() },
      ];

      pdf.setFontSize(10);
      const colWidth = (pageWidth - margin * 2) / 3;
      
      metrics.forEach((metric, index) => {
        const col = index % 3;
        const row = Math.floor(index / 3);
        const x = margin + col * colWidth;
        const y = yPosition + row * 18;

        // Card background
        pdf.setFillColor(248, 250, 252);
        pdf.roundedRect(x, y, colWidth - 5, 15, 2, 2, 'F');

        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        pdf.text(metric.label, x + 3, y + 5);
        
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(14);
        pdf.text(metric.value, x + 3, y + 12);
        pdf.setFontSize(10);
      });

      yPosition += 45;

      // Status Breakdown
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Status Breakdown', margin, yPosition);
      yPosition += 8;

      const statusCounts = obstacles.reduce((acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const statusItems = [
        { label: 'Reported', value: statusCounts.reported || 0, color: [59, 130, 246] },
        { label: 'In Progress', value: statusCounts.in_progress || 0, color: [245, 158, 11] },
        { label: 'Resolved', value: statusCounts.resolved || 0, color: [34, 197, 94] },
      ];

      pdf.setFontSize(10);
      statusItems.forEach((item, index) => {
        const x = margin + index * 60;
        pdf.setFillColor(item.color[0], item.color[1], item.color[2]);
        pdf.circle(x + 3, yPosition + 3, 2, 'F');
        pdf.setTextColor(0, 0, 0);
        pdf.text(`${item.label}: ${item.value}`, x + 8, yPosition + 5);
      });

      yPosition += 15;

      // Type Distribution
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Obstacle Types', margin, yPosition);
      yPosition += 8;

      const typeCounts = obstacles.reduce((acc, o) => {
        const label = o.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        acc[label] = (acc[label] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      Object.entries(typeCounts).forEach(([type, count], index) => {
        const percentage = stats.totalObstacles > 0 ? Math.round((count / stats.totalObstacles) * 100) : 0;
        pdf.text(`• ${type}: ${count} (${percentage}%)`, margin + 5, yPosition + index * 6);
      });

      yPosition += Object.keys(typeCounts).length * 6 + 10;

      // Area Distribution
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Top Affected Areas', margin, yPosition);
      yPosition += 8;

      const areaCounts = obstacles.reduce((acc, o) => {
        acc[o.location.area] = (acc[o.location.area] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topAreas = Object.entries(areaCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      topAreas.forEach(([area, count], index) => {
        pdf.text(`${index + 1}. ${area}: ${count} obstacles`, margin + 5, yPosition + index * 6);
      });

      yPosition += topAreas.length * 6 + 15;

      // Capture charts if container exists
      if (chartContainerId) {
        const chartContainer = document.getElementById(chartContainerId);
        if (chartContainer) {
          // Check if we need a new page
          if (yPosition > pageHeight - 100) {
            pdf.addPage();
            yPosition = margin;
          }

          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Visual Analytics', margin, yPosition);
          yPosition += 10;

          const canvas = await html2canvas(chartContainer, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false,
          });

          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pageWidth - margin * 2;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          // Check if image fits on current page
          if (yPosition + imgHeight > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }

          pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, Math.min(imgHeight, pageHeight - margin - yPosition));
        }
      }

      // Footer
      const totalPages = pdf.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `Page ${i} of ${totalPages} | RoadWatch AI - Salem Road Authority`,
          pageWidth / 2,
          pageHeight - 8,
          { align: 'center' }
        );
      }

      // Save
      const fileName = `roadwatch-report-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`;
      pdf.save(fileName);

      return { success: true, fileName };
    } catch (error) {
      console.error('Error generating PDF:', error);
      return { success: false, error };
    } finally {
      setIsGenerating(false);
    }
  }, [stats, obstacles]);

  return { downloadPDF, isGenerating };
}
