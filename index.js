import prettyjson from 'prettyjson';
import readXlsxFile from 'read-excel-file/node';

let players = {};

readXlsxFile('lms.xlsx').then((arrayRows) => {

    arrayRows = cleanNullsFromNestedArrays(arrayRows);
    arrayRows = isolateThePlayerRows(arrayRows);

    arrayRows.forEach(playerRow => {
        let pName;
        const regEx_player = /(?<name>[\w\d\ \.-]+(?<! ))\s*(?<paid>\*{0,2})/g;
        
        for (const match of playerRow[0].matchAll(regEx_player)) {
            pName = match.groups?.name.replace(/\s+/g, ' ');
            players[pName] = {
                name: pName,
                paid: (match.groups?.paid || '').length,
            }
        }

        const playerGames = playerRow.slice(1).map(game => game.trim().toUpperCase());
        players[pName].games = playerGames;
    });

    console.log(prettyjson.render(players));

})

function cleanNullsFromNestedArrays(arrayOfArrays) {
    return arrayOfArrays.map((row) => row.filter((rowElement) => rowElement !== null));
}

function isolateThePlayerRows(rows) {
    return rows.filter(row => {
        const validLength = row.length > 1;
        const isHeaderRow = (/last\s*man\s*standing/i).test(row.join(''));
        return validLength && !isHeaderRow;
    });
}