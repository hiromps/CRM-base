/**
 * 連絡先データをCSV形式でエクスポート
 * @param {Array} contacts - エクスポートする連絡先データの配列
 * @param {string} filename - ダウンロードするファイル名
 */
export const exportContactsToCSV = async (contacts, filename = 'contacts.csv') => {
    try {
        // papaparseを動的インポート
        const Papa = await import('papaparse');
        
        // CSVのヘッダー（インポート/テンプレートと統一）
        const csvHeader = ['名前', 'グループ', 'メモ'];
        
        // データを整形（インポート/テンプレートと統一）
        const csvData = contacts.map(contact => [
            contact.name || '',
            contact.group || '',
            contact.memo || ''
        ]);
        
        // ヘッダーを追加
        csvData.unshift(csvHeader);
        
        // CSV文字列を生成（BOM付きでExcelでの文字化けを防ぐ）
        const csv = Papa.default.unparse(csvData);
        const bom = '\uFEFF';
        const csvWithBom = bom + csv;
        
        // Blobを作成してダウンロード
        const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // URLを解放
        URL.revokeObjectURL(url);
        
        return true;
    } catch (error) {
        console.error('CSV Export Error:', error);
        throw new Error(`CSVエクスポートに失敗しました: ${error.message}`);
    }
};

/**
 * 連絡先データをExcel形式でエクスポート
 * @param {Array} contacts - エクスポートする連絡先データの配列
 * @param {string} filename - ダウンロードするファイル名
 */
export const exportContactsToExcel = async (contacts, filename = 'contacts.xlsx') => {
    try {
        // xlsxを動的インポート
        const XLSX = await import('xlsx');
        
        // データを整形
        const worksheetData = contacts.map(contact => ({
            '名前': contact.name || '',
            'グループ': contact.group || '',
            'メモ': contact.memo || ''
        }));
        
        // ワークシートを作成
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        
        // 列幅を調整
        const colWidths = [
            { width: 20 }, // 名前
            { width: 15 }, // グループ
            { width: 30 }  // メモ
        ];
        worksheet['!cols'] = colWidths;
        
        // ワークブックを作成
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, '連絡先');
        
        // Excelファイルをバイナリ形式で生成
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        
        // Blobを作成してダウンロード
        const blob = new Blob([excelBuffer], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // URLを解放
        URL.revokeObjectURL(url);
        
        return true;
    } catch (error) {
        console.error('Excel Export Error:', error);
        throw new Error(`Excelエクスポートに失敗しました: ${error.message}`);
    }
};

/**
 * CSVファイルから連絡先データをインポート
 * @param {File} file - インポートするCSVファイル
 * @returns {Promise<Array>} パースされた連絡先データの配列
 */
export const importContactsFromCSV = async (file) => {
    try {
        // papaparseを動的インポート
        const Papa = await import('papaparse');
        
        return new Promise((resolve, reject) => {
            Papa.default.parse(file, {
                header: true,
                encoding: 'UTF-8',
                skipEmptyLines: true,
                complete: (results) => {
                    try {
                        // データの検証と整形
                        const contacts = results.data.map((row, index) => {
                            // 名前は必須
                            const name = row['名前'] || row['name'] || row['Name'] || row['氏名'];
                            if (!name || !name.trim()) {
                                throw new Error(`行 ${index + 2}: 名前が空です`);
                            }
                            
                            return {
                                name: name.trim(),
                                group: (row['グループ'] || row['group'] || row['Group'] || row['部署'] || '').trim(),
                                memo: (row['メモ'] || row['memo'] || row['Memo'] || row['備考'] || '').trim(),
                                // 作成日と更新日は新規作成時に設定されるため、インポート時は含めない
                            };
                        });
                        
                        if (contacts.length === 0) {
                            throw new Error('インポート可能なデータが見つかりません');
                        }
                        
                        resolve(contacts);
                    } catch (error) {
                        reject(error);
                    }
                },
                error: (error) => {
                    reject(new Error(`CSVの解析エラー: ${error.message}`));
                }
            });
        });
    } catch (error) {
        console.error('CSV Import Error:', error);
        throw new Error(`CSVインポートに失敗しました: ${error.message}`);
    }
};

/**
 * Excelファイルから連絡先データをインポート
 * @param {File} file - インポートするExcelファイル
 * @returns {Promise<Array>} パースされた連絡先データの配列
 */
export const importContactsFromExcel = async (file) => {
    try {
        // xlsxを動的インポート
        const XLSX = await import('xlsx');
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // 最初のシートを取得
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    
                    // JSONに変換
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);
                    
                    // データの検証と整形
                    const contacts = jsonData.map((row, index) => {
                        // 名前は必須
                        const name = row['名前'] || row['name'] || row['Name'] || row['氏名'];
                        if (!name || !name.toString().trim()) {
                            throw new Error(`行 ${index + 2}: 名前が空です`);
                        }
                        
                        return {
                            name: name.toString().trim(),
                            group: (row['グループ'] || row['group'] || row['Group'] || row['部署'] || '').toString().trim(),
                            memo: (row['メモ'] || row['memo'] || row['Memo'] || row['備考'] || '').toString().trim(),
                        };
                    });
                    
                    if (contacts.length === 0) {
                        throw new Error('インポート可能なデータが見つかりません');
                    }
                    
                    resolve(contacts);
                } catch (error) {
                    reject(new Error(`Excelファイルの解析エラー: ${error.message}`));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('ファイルの読み込みに失敗しました'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    } catch (error) {
        console.error('Excel Import Error:', error);
        throw new Error(`Excelインポートに失敗しました: ${error.message}`);
    }
};

/**
 * CSVテンプレートをダウンロード
 */
export const downloadCSVTemplate = async () => {
    try {
        // papaparseを動的インポート
        const Papa = await import('papaparse');
        
        const templateData = [
            ['名前', 'グループ', 'メモ'],
            ['山田太郎', '営業部', '重要顧客'],
            ['鈴木花子', '開発部', 'プロジェクトリーダー'],
            ['佐藤次郎', '総務部', '']
        ];
        
        // CSV文字列を生成（BOM付き）
        const csv = Papa.default.unparse(templateData);
        const bom = '\uFEFF';
        const csvWithBom = bom + csv;
        
        // ダウンロード
        const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.setAttribute('href', url);
        link.setAttribute('download', 'contacts_template.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        return true;
    } catch (error) {
        console.error('CSV Template Download Error:', error);
        throw new Error(`CSVテンプレートのダウンロードに失敗しました: ${error.message}`);
    }
};

/**
 * Excelテンプレートをダウンロード
 */
export const downloadExcelTemplate = async () => {
    try {
        // xlsxを動的インポート
        const XLSX = await import('xlsx');
        
        const templateData = [
            { '名前': '山田太郎', 'グループ': '営業部', 'メモ': '重要顧客' },
            { '名前': '鈴木花子', 'グループ': '開発部', 'メモ': 'プロジェクトリーダー' },
            { '名前': '佐藤次郎', 'グループ': '総務部', 'メモ': '' }
        ];
        
        // ワークシートを作成
        const worksheet = XLSX.utils.json_to_sheet(templateData);
        
        // 列幅を調整
        const colWidths = [
            { width: 20 }, // 名前
            { width: 15 }, // グループ
            { width: 30 }  // メモ
        ];
        worksheet['!cols'] = colWidths;
        
        // ワークブックを作成
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, '連絡先テンプレート');
        
        // Excelファイルをバイナリ形式で生成
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        
        // ダウンロード
        const blob = new Blob([excelBuffer], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.setAttribute('href', url);
        link.setAttribute('download', 'contacts_template.xlsx');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        return true;
    } catch (error) {
        console.error('Excel Template Download Error:', error);
        throw new Error(`Excelテンプレートのダウンロードに失敗しました: ${error.message}`);
    }
};

/**
 * ファイル形式を判定
 * @param {File} file - 判定するファイル
 * @returns {string} ファイル形式 ('csv' | 'excel' | 'unknown')
 */
export const getFileType = (file) => {
    const extension = file.name.toLowerCase().split('.').pop();
    if (extension === 'csv') return 'csv';
    if (extension === 'xlsx' || extension === 'xls') return 'excel';
    return 'unknown';
};

/**
 * ファイルから連絡先データをインポート（自動判定）
 * @param {File} file - インポートするファイル
 * @returns {Promise<Array>} パースされた連絡先データの配列
 */
export const importContactsFromFile = async (file) => {
    const fileType = getFileType(file);
    
    switch (fileType) {
        case 'csv':
            return importContactsFromCSV(file);
        case 'excel':
            return importContactsFromExcel(file);
        default:
            throw new Error('サポートされていないファイル形式です。CSV(.csv)またはExcel(.xlsx)ファイルを選択してください。');
    }
};

/**
 * インポートデータの検証
 * @param {Array} contacts - 検証する連絡先データの配列
 * @param {Array} existingContacts - 既存の連絡先データ
 * @returns {Object} 検証結果
 */
export const validateImportData = (contacts, existingContacts = []) => {
    const errors = [];
    const warnings = [];
    const validContacts = [];
    
    // 既存の名前セットを作成
    const existingNames = new Set(existingContacts.map(c => c.name.toLowerCase()));
    
    contacts.forEach((contact, index) => {
        // 名前の重複チェック
        if (existingNames.has(contact.name.toLowerCase())) {
            warnings.push({
                index: index + 1,
                message: `"${contact.name}" は既に登録されています`
            });
        }
        
        // 名前の長さチェック
        if (contact.name.length > 100) {
            errors.push({
                index: index + 1,
                message: `名前が長すぎます（最大100文字）: "${contact.name}"`
            });
            return;
        }
        
        // グループの長さチェック
        if (contact.group && contact.group.length > 50) {
            errors.push({
                index: index + 1,
                message: `グループ名が長すぎます（最大50文字）: "${contact.group}"`
            });
            return;
        }
        
        // メモの長さチェック
        if (contact.memo && contact.memo.length > 500) {
            errors.push({
                index: index + 1,
                message: `メモが長すぎます（最大500文字）`
            });
            return;
        }
        
        validContacts.push(contact);
    });
    
    return {
        valid: errors.length === 0,
        validContacts,
        errors,
        warnings,
        totalCount: contacts.length,
        validCount: validContacts.length
    };
}; 