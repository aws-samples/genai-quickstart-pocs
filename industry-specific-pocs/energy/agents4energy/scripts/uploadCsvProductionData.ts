import { JSDOM } from 'jsdom';
import * as path from 'path';
import { writeFile, mkdir } from 'fs/promises';

// const wellApiNumber = `30-015-27892`
const wellApiNumber = `30-045-29202`


const productionUrl = `https://wwwapps.emnrd.nm.gov/OCD/OCDPermitting/Data/ProductionSummaryPrint.aspx?report=csv&api=${wellApiNumber}`

console.log("Production URL: ", productionUrl)
const wellFileUrl = `https://ocdimage.emnrd.nm.gov/imaging/WellFileView.aspx?RefType=WF&RefID=${wellApiNumber.replaceAll("-","")}0000`
console.log('Well File URL: ', wellFileUrl)

async function saveStringToFile(content: string, filename: string) {
    try {
        await mkdir(path.dirname(filename), { recursive: true });
        await writeFile(filename, content, 'utf8');
        console.log('File has been saved successfully');
    } catch (error) {
        console.error('Error writing to file:', error);
    }
}

async function parseHtmlTableToArrays(htmlContent: string): Promise<string[][] | void> {
    // Create a DOM using jsdom
    const dom = new JSDOM(htmlContent);
    const doc = dom.window.document;
    
    // Find all tables in the document
    const tables = doc.getElementsByTagName('table');
    if (tables.length === 0) return;

    // The first table is the column names
    const columnNameElements = tables[0].getElementsByTagName('tr')[2].getElementsByTagName('td')
    const columnNames = Array.from(columnNameElements).map(element => element.textContent?.trim() || '').slice(0,7);

    const csvRows: string[][] = [columnNames];
    // const dataColumns: {[name: string]: string[]} = {}

    // Iterate through each table
    for (let i = 1; i < tables.length; i++) {
        const cells = tables[i].getElementsByTagName('tr')[0].getElementsByTagName('td');
        // const cellsHeader = tables[i].getElementsByTagName('th');
        
        // Combine all cells in the row
        const rowData: string[] = [];
        
        // // Handle header cells
        // for (let cell of cellsHeader) {
        //     rowData.push(cell.textContent?.trim() || '');
        // }
        
        // Handle data cells
        for (let cell of Array.from(cells).slice(0,7)) {
            rowData.push(cell.textContent?.trim() || '');
        }
        
        // Add the row to our CSV data, properly escaped
        if (rowData.length > 0) {
            csvRows.push(rowData.map(cell => `${cell.replace(/"/g, '""')}`));
        }
    }

    return csvRows;
}


const main = async () => {
    const response = await fetch(productionUrl)
    const htmlContent = await response.text()

    const csvContent = await parseHtmlTableToArrays(htmlContent);
    if (!csvContent) return

    const csvContentWithDate = [["FirstDayOfMonth", ...csvContent[0]]]

    csvContentWithDate.push(
        ...csvContent.slice(1).map(row => ([
            new Date(`${row[2]} 1, ${row[0]}`).toISOString().split('T')[0],
            ...row,
        ]))
    )

    const csvContentString = csvContentWithDate.map(row => row.join(',')).join('\n')
    
    const productionFilePath = path.join(
        '.',
        'tmp',
        'production-agent',
        'structured-data-files',
        'monthly_produciton',
        `api=${wellApiNumber}`,
        'production.csv'
    )

    await saveStringToFile(csvContentString, productionFilePath)
    
    // console.log(csvContentString);

}

main()