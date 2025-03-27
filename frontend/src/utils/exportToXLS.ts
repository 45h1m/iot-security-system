import * as XLSX from 'xlsx';
import { Log } from '../components/LogsButton';

function exportLogsToExcel(logs: Log[], filename: string = `SENSE25-logs-${new Date().toLocaleString()}.xlsx`): void {
    try {
        logs = logs.map((log) => ({...log, date: new Date(log.date).toLocaleString()}));
        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(logs);

        // Apply some styling to headers
        // const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:Z1");
        // const headerRow = range.s.r;

        // Create workbook and add the worksheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Logs");

        // Generate Excel file and trigger download
        XLSX.writeFile(workbook, filename);

        console.log(`Logs successfully exported to ${filename}`);
    } catch (error) {
        console.error("Failed to export logs:", error);
        throw new Error("Failed to export logs to Excel");
    }
}

export default exportLogsToExcel;