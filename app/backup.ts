// Utility function to export localStorage data
export function exportLocalStorage() {
  const keys = ['cardProgress', 'mnemonicEdits', 'levelProgress', 'newCardsToday'];
  const data: Record<string, any> = {};

  keys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        data[key] = JSON.parse(value);
      }
    } catch (error) {
      console.error(`Error exporting ${key}:`, error);
    }
  });

  // Create a Blob with the data
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  // Create a link and trigger download
  const a = document.createElement('a');
  a.href = url;
  a.download = `flashcards_progress_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Utility function to import localStorage data
export function importLocalStorage(jsonData: string) {
  try {
    const data = JSON.parse(jsonData);
    Object.entries(data).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
} 