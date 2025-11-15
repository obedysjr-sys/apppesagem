export const config = {
  sheets: {
    spreadsheetId: import.meta.env.VITE_SHEETS_SPREADSHEET_ID as string | undefined,
    range: import.meta.env.VITE_SHEETS_RANGE as string | undefined, // e.g. "Página1!A:Z"
    // Opcional: Apps Script Web App publicado como "Anyone" para fallback
    appsScriptUrl: import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined,
  },
};