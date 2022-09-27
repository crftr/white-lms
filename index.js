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
const losses = [
    [ 'ATL', 'AZ', 'CAR', 'CINN', 'DAL', 'DEN', 'DET', 'GB', 'JAC', 'LAR', 'LV', 'NE', 'NYJ', 'SF', 'TENN', ],
    [ 'ATL', 'BAL', 'CAR', 'CHI', 'CINN', 'CLV', 'HOU', 'IND', 'LAC', 'LV', 'MINN', 'NO', 'PITT', 'SEA', 'TENN', 'WSH', ],
    [ 'PITT', 'NE', 'BUFF', 'NYJ', 'DET', 'HOU', 'KC', 'STL', 'LV', 'WSH', 'LAC', 'SEA', 'TB', 'AZ', 'SF', 'NYG', ],
]

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

        let pLosses = 0;
        player.games.forEach((game, weekIdx) => {
            if (weekIdx >= losses.length) { return; }
            if (losses[weekIdx].includes(game)) { pLosses++; }
        });
        player.losses = pLosses;

        player.isOut = player.losses >= player.paidFor;

        player.gamesAreValid = (new Set(playerGames)).size === playerGames.length;

        players.push(player);
    });

    // console.log(prettyjson.render(playersObj));

    players.sort((p1, p2) => {
        if (!p1.gamesAreValid && p2.gamesAreValid) return -1;
        if (p1.gamesAreValid && !p2.gamesAreValid) return 1;

        if (!p1.isOut && p2.isOut) return -1;
        if (p1.isOut && !p2.isOut) return 1;

        if (p1.gamesEntered > p2.gamesEntered) return -1;
        if (p1.gamesEntered < p2.gamesEntered) return 1;

        if (p1.losses < p2.losses) return -1;
        if (p1.losses > p2.losses) return 1;

        if (p1.name < p2.paidFor) return -1;
        if (p1.name > p2.paidFor) return 1;

        return 0;
    })

    console.table(players);

});
