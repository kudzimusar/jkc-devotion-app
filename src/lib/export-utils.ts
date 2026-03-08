import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export data to CSV
 */
export const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    const csvContent = [
        headers.join(","),
        ...data.map(row =>
            headers.map(header => {
                const cell = row[header] === undefined || row[header] === null ? "" : row[header];
                // Escape commas and quotes for CSV
                const cellStr = String(cell).replace(/"/g, '""');
                return cellStr.includes(",") ? `"${cellStr}"` : cellStr;
            }).join(",")
        )
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}.csv`);
};

/**
 * Export data to Excel (.xlsx)
 */
export const exportToExcel = (data: any[], filename: string, sheetName: string = 'Sheet1') => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${filename}.xlsx`);
};

/**
 * Export data to a structured PDF
 */
export const exportToPDF = (data: any[], filename: string, title: string, headers: string[], keys: string[]) => {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape A4

    // Add Title
    doc.setFontSize(18);
    doc.text(title, 14, 22);

    // Add Generation Date
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    // Prepare table data
    const tableData = data.map(item => keys.map(key => item[key]));

    // Generate Table
    autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 35,
        theme: 'striped',
        headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        styles: { fontSize: 8, font: 'helvetica' },
        margin: { top: 35 },
    });

    doc.save(`${filename}.pdf`);
};

/**
 * Export text-based content to a readable TXT file
 */
export const exportToText = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    saveAs(blob, `${filename}.txt`);
};
