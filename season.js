---
---
{% if jekyll.environment == "test" %}
var DATA_ROOT="ldata";
{% else %}
var DATA_ROOT="data";
{% endif %}

function season_path(season_id) {
    return DATA_ROOT+'/'+season_id+'/season.json';
}

function table_cell(value) {
    var cell = $('<div/>', {'class':'Cell'});
    cell.append('<div>'+value+'</div>');
    return cell;
}

$( document ).ready(function() {
    var urlParams = new URLSearchParams(window.location.search);
    $.getJSON(season_path(urlParams.get('season')), function(data) {
        var season_table = $('#season_table');
        for (stage_num in data.stages) {
            var stage_data = data.stages[stage_num];
            for (week_num in stage_data) {
                var week_data = stage_data[week_num];
                for (day_num in stage_data) {
                    var day_data = week_data[day_num];
                    for (match_num in day_data) {
                        var match_data = day_data[match_num];
                        if (match_data.visitor) {
                            var row = $('<div/>', {'class':'Row'}).appendTo(season_table);
                            row.append(table_cell(stage_num));
                            row.append(table_cell(parseInt(week_num)+1));
                            row.append(table_cell(parseInt(day_num)+1));
                            row.append(table_cell(parseInt(match_num)+1));
                            var details = $('<div/>', {'class':'Cell'}).appendTo(row);
                            details.append(match_data.visitor+' at '+match_data.home + ' ' + match_data.score);
                            for (map_num in match_data.maps) {
                                var map_data = match_data.maps[map_num];
                                console.log(map_data.name);
                                var details = $('<div/>', {'class':'Cell'}).appendTo(row);
                                details.append(map_data.name);
                                for (round in map_data.rounds) {
                                    console.log(round);
                                    var link = $('<a/>', {'href': 'round.html?matchId='+map_data.rounds[round]}).appendTo(details);
                                    link.append(parseInt(round)+1);
                                }
                            }

                        }
                    }
                }
            }
        }
    });
});

