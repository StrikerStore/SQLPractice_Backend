export function diffQueryResults(user, canonical) {
    const missingColumns = canonical.columns.filter((col) => !user.columns.includes(col));
    const extraColumns = user.columns.filter((col) => !canonical.columns.includes(col));
    const rowCountDelta = user.rows.length - canonical.rows.length;
    const hasColumnIssues = missingColumns.length > 0 || extraColumns.length > 0;
    const hasRowIssues = rowCountDelta !== 0 || !rowsEqual(user.rows, canonical.rows);
    if (!hasColumnIssues && !hasRowIssues) {
        return null;
    }
    return {
        missingColumns: missingColumns.length ? missingColumns : undefined,
        extraColumns: extraColumns.length ? extraColumns : undefined,
        rowCountDelta: rowCountDelta || undefined,
    };
}
function rowsEqual(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    const normalize = (rows) => rows
        .map((row) => {
        const sortedEntries = Object.entries(row).sort(([k1], [k2]) => k1.localeCompare(k2));
        return JSON.stringify(sortedEntries);
    })
        .sort();
    const [normA, normB] = [normalize(a), normalize(b)];
    return normA.every((val, idx) => val === normB[idx]);
}
