import ExcelJS from 'exceljs';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  AlignmentType, 
  Table, 
  TableRow, 
  TableCell,
  WidthType
} from 'docx';
import fs from 'fs/promises';

// Excel Interfaces
export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

export interface ExcelSheetData {
  name: string;
  columns: ExcelColumn[];
  rows: Record<string, any>[];
}

// DOCX Interfaces
export interface DocxParagraph {
  text: string;
  heading?: 'Heading1' | 'Heading2' | 'Heading3';
  bold?: boolean;
  italic?: boolean;
  alignment?: 'left' | 'center' | 'right' | 'justify';
}

export interface DocxTable {
  type: 'table';
  headers: string[];
  rows: string[][];
}

export interface DocxDocumentData {
  title: string;
  paragraphs: (DocxParagraph | DocxTable)[];
}

export class OfficeDocumentService {
  /**
   * Create Excel XLSX File
   */
  async createExcel(outputPath: string, sheets: ExcelSheetData[]): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    for (const sheetData of sheets) {
      const sheet = workbook.addWorksheet(sheetData.name || 'Sheet');
      
      sheet.columns = sheetData.columns.map(col => ({
        header: col.header,
        key: col.key,
        width: col.width || 15
      }));
      
      sheet.addRows(sheetData.rows);
      
      // Header row styling
      const headerRow = sheet.getRow(1);
      headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1F4E78' } // Dark blue
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 24;
      
      headerRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'medium' },
          right: { style: 'thin' }
        };
      });
      
      // Cell styling
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        row.height = 20;
        row.eachCell((cell) => {
          cell.font = { name: 'Arial', size: 10 };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
          };
        });
      });
    }
    
    await workbook.xlsx.writeFile(outputPath);
  }

  /**
   * Create Word DOCX File
   */
  async createDocx(outputPath: string, data: DocxDocumentData): Promise<void> {
    const children: any[] = [];

    // Title
    children.push(
      new Paragraph({
        text: data.title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 }
      })
    );

    for (const item of data.paragraphs) {
      if ('type' in item && item.type === 'table') {
        const tableRows = [];
        
        // Headers Row
        const headerCells = item.headers.map(h => 
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: h, bold: true, color: 'FFFFFF' })],
              alignment: AlignmentType.CENTER
            })],
            shading: { fill: '1F4E78' }
          })
        );
        tableRows.push(new TableRow({ children: headerCells }));

        // Body Rows
        for (const rowData of item.rows) {
          const rowCells = rowData.map(cellText => 
            new TableCell({
              children: [new Paragraph({ text: cellText })],
              margins: { top: 100, bottom: 100, left: 150, right: 150 }
            })
          );
          tableRows.push(new TableRow({ children: rowCells }));
        }

        children.push(
          new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE }
          })
        );
        // Spacer paragraph after table
        children.push(new Paragraph({ text: "", spacing: { after: 200 } }));
      } else {
        const p = item as DocxParagraph;
        const textRun = new TextRun({
          text: p.text,
          bold: p.bold,
          italics: p.italic
        });

        let heading: any = undefined;
        if (p.heading === 'Heading1') heading = HeadingLevel.HEADING_1;
        else if (p.heading === 'Heading2') heading = HeadingLevel.HEADING_2;
        else if (p.heading === 'Heading3') heading = HeadingLevel.HEADING_3;

        let alignment: any = AlignmentType.START;
        if (p.alignment === 'center') alignment = AlignmentType.CENTER;
        else if (p.alignment === 'right') alignment = AlignmentType.END;
        else if (p.alignment === 'justify') alignment = AlignmentType.BOTH;

        children.push(
          new Paragraph({
            children: [textRun],
            heading,
            alignment,
            spacing: { after: 150 }
          })
        );
      }
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    await fs.writeFile(outputPath, buffer);
  }
}
