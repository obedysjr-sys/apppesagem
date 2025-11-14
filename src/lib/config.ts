export const config = {
  sheets: {
    spreadsheetId: import.meta.env.VITE_SHEETS_SPREADSHEET_ID as string | undefined,
    range: import.meta.env.VITE_SHEETS_RANGE as string | undefined, // e.g. "Página1!A:Z"
  },
};