import prettyjson from 'prettyjson';
import readXlsxFile from 'read-excel-file/node';

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

let players = [];

readXlsxFile('lms.xlsx').then((arrayRows) => {
    arrayRows = cleanNullsFromNestedArrays(arrayRows);
    arrayRows = isolateThePlayerRows(arrayRows);
    arrayRows.forEach(playerRow => {
        const regEx_player = /(?<name>[\w\d\ \.-]+(?<! ))\s*(?<asterisks>\*{0,2})/g;
        let pName, player;
        
        // Column A, player name and count of entries
        //
        for (const match of playerRow[0].matchAll(regEx_player)) {
            pName = match.groups?.name.replace(/\s+/g, ' ');
            player = {
                name: pName,
                paidFor: (match.groups?.asterisks || '').length,
            }
        }

        // Column B through S, Weekly choices
        //
        const playerGames = playerRow.slice(1).map(game => game.trim().toUpperCase());
        player.games = playerGames;
        player.gamesEntered = playerGames.length;
        player.gamesAreValid = (new Set(playerGames)).size === playerGames.length;

        players.push(player);
    });

    // console.log(prettyjson.render(playersObj));


    players.sort((p1, p2) => {
        if (!p1.gamesAreValid && p2.gamesAreValid) return -1;
        if (p1.gamesAreValid && !p2.gamesAreValid) return 1;

        if (p1.gamesEntered > p2.gamesEntered) return -1;
        if (p1.gamesEntered < p2.gamesEntered) return 1;

        if (p1.name < p2.paidFor) return -1;
        if (p1.name > p2.paidFor) return 1;

        return 0;
    })

    console.table(players);

});
