import * as XLSX from 'xlsx';

/**
 * Common export utility to Excel
 */
export const exportToExcel = (data: any[], fileName: string, sheetName: string = 'Sheet1') => {
  try {
    // Create worksheet from JSON
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Generate buffer & trigger download
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Export error:', error);
    return false;
  }
};

/**
 * Filtered members export
 */
export const exportMembersToExcel = (members: any[], tontineName: string) => {
  const formattedData = members.map(m => ({
    'Nom Complet': m.name,
    'Téléphone': m.phone || 'Non renseigné',
    'Rôle': m.role === 'admin' ? 'Fondateur' : 'Partenaire',
    'Date d\'adhésion': new Date(m.joined_at).toLocaleDateString('fr-FR'),
    'Statut Cotisation': m.rotation_position ? 'Payé' : 'En attente'
  }));

  return exportToExcel(formattedData, `Membres_${tontineName.replace(/\s+/g, '_')}`, 'Membres');
};

/**
 * Filtered transactions export
 */
export const exportTransactionsToExcel = (transactions: any[], tontineName: string) => {
  const formattedData = transactions.map(t => ({
    'Date': new Date(t.transaction_date).toLocaleDateString('fr-FR'),
    'Membre': t.user_name || 'Utilisateur inconnu',
    'Montant (FCFA)': t.amount,
    'Type': t.type === 'contribution' ? 'Tontine' : (t.type === 'bank' ? 'Banque' : t.type),
    'Méthode': t.method === 'manual' ? 'Saisie Admin' : 'Paiement Mobile',
    'Statut': t.status === 'completed' ? 'Vérifié' : (t.status === 'pending' ? 'En attente' : 'Échoué'),
    'Commentaire': t.description || ''
  }));

  return exportToExcel(formattedData, `Transactions_${tontineName.replace(/\s+/g, '_')}`, 'Journal_Caisse');
};
