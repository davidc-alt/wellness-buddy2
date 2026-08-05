import jsPDF from 'jspdf';

export function exportRegimenPDF(patient) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(47, 72, 88); // #2F4858
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('WELLNESS BUDDY', 15, 20);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('CUSTOM SUPPLEMENT PROTOCOL & REGIMEN', 15, 30);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 15, 30, { align: 'right' });

  // Patient Info Box
  let y = 50;
  doc.setFillColor(244, 246, 248);
  doc.roundedRect(15, y, pageWidth - 30, 35, 3, 3, 'F');

  doc.setTextColor(30, 41, 59);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`Patient: ${patient.name}`, 22, y + 12);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`DOB: ${patient.dob} | Email: ${patient.email}`, 22, y + 22);
  doc.text(`Primary Health Goal: ${patient.primaryGoal || 'Peak Vitality & Longevity'}`, 22, y + 30);

  // Guidance Note
  y += 45;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(47, 72, 88);
  doc.text('PRACTITIONER GUIDANCE NOTE', 15, y);

  y += 6;
  doc.setFillColor(230, 240, 238);
  doc.setDrawColor(78, 135, 140);
  doc.roundedRect(15, y, pageWidth - 30, 22, 2, 2, 'FD');

  doc.setFont('Helvetica', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(40, 60, 70);
  const guidanceText = patient.guidanceNote || 'Follow prescribed timing instructions carefully.';
  doc.text(`"${guidanceText}"`, 20, y + 13);

  // Prescribed Protocol Section
  y += 32;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59);
  doc.text('PRESCRIBED SUPPLEMENT PROTOCOL', 15, y);

  y += 8;
  if (!patient.supplements || patient.supplements.length === 0) {
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(120, 120, 120);
    doc.text('No active supplements currently prescribed.', 15, y + 10);
  } else {
    patient.supplements.forEach((sup, idx) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      // Supplement card
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(15, y, pageWidth - 30, 36, 2, 2, 'FD');

      // Title & timing badge
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text(`${idx + 1}. ${sup.name}`, 20, y + 10);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`${sup.manufacturer || 'Empower Pharma'} • ${sup.frequency} • ${sup.recurrence}`, 20, y + 17);

      // Quote instructions
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(20, y + 21, pageWidth - 40, 11, 1, 1, 'F');

      doc.setFont('Helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text(`"${sup.instructions}"`, 24, y + 28);

      y += 42;
    });
  }

  // Footer
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('WellnessBuddy Encrypted Health Regimen • Confidential Medical Record', pageWidth / 2, 285, { align: 'center' });

  // Save file
  const fileName = `${patient.name.replace(/\s+/g, '_')}_Regimen_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}

export function exportRegimenText(patient) {
  let content = `========================================================\n`;
  content += `           WELLNESS BUDDY - PRESCRIPTION PROTOCOL\n`;
  content += `========================================================\n\n`;
  content += `Patient Name: ${patient.name}\n`;
  content += `Date of Birth: ${patient.dob}\n`;
  content += `Email: ${patient.email}\n`;
  content += `Primary Health Goal: ${patient.primaryGoal || 'Peak Vitality'}\n`;
  content += `Generated Date: ${new Date().toLocaleString()}\n\n`;
  content += `--------------------------------------------------------\n`;
  content += `PRACTITIONER GUIDANCE NOTE:\n`;
  content += `"${patient.guidanceNote || 'Follow dosage schedule carefully.'}"\n`;
  content += `--------------------------------------------------------\n\n`;
  content += `PRESCRIBED SUPPLEMENT PROTOCOL:\n\n`;

  if (!patient.supplements || patient.supplements.length === 0) {
    content += `No supplements prescribed yet.\n`;
  } else {
    patient.supplements.forEach((sup, i) => {
      content += `${i + 1}. ${sup.name}\n`;
      content += `   - Manufacturer: ${sup.manufacturer || 'Empower Pharma'}\n`;
      content += `   - Frequency: ${sup.frequency}\n`;
      content += `   - Timing: [${sup.timing}]\n`;
      content += `   - Instructions: "${sup.instructions}"\n\n`;
    });
  }

  content += `========================================================\n`;
  content += `Encrypted Health Record - Wellness Buddy Platform\n`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${patient.name.replace(/\s+/g, '_')}_Regimen.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
