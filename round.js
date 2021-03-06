var DATA_ROOT="data";

function playerReady() {
    //alert("ready");
}

timerId = false;
GRAPH_HEIGHT = 400;
PIXELS_PER_SEC = 1;

function secs_to_timestamp(secs) {
    var round_secs = Math.round(secs);
    var minutes = Math.floor(round_secs / 60);
    return minutes+':'+(round_secs-(minutes*60)+"").padStart(2,'0');
}

function playerPaused() {
    if (timerId) {
        clearInterval(timerId);
    }
}

function move_scrubber(new_x) {
    var element = image_svg().getElementById('scrubber');
    if (element) {
        element.setAttribute('x1', new_x);
        element.setAttribute('x2', new_x);
    }
    var element = image_svg().getElementById('scrubber_text');
    if (element) {
        element.setAttribute('x', new_x);
        $('#scrubber_text').text(secs_to_timestamp(new_x));
    }
}

function move_indicator(new_x) {
    var element = image_svg().getElementById('indicator');
    if (element) {
        element.setAttribute('x1', new_x);
        element.setAttribute('x2', new_x);
    }
    var element = image_svg().getElementById('indicator_text');
    if (element) {
        element.setAttribute('x', new_x);
        $('#indicator_text').text(secs_to_timestamp(new_x));
    }
}

function update_player_indicator(offset) {
    var svg = image_svg();
    var new_x = (player.getCurrentTime() - offset) * PIXELS_PER_SEC;
    move_indicator(new_x);
}

function secs_to_x(secs) {
    return secs * PIXELS_PER_SEC;
}

function percent_to_y(percent) {
    return ((1 - percent) * GRAPH_HEIGHT);
}

function player_advantage_to_y(advantage) {
    return GRAPH_HEIGHT - ((6 + advantage) * (GRAPH_HEIGHT / 12));
}

TEAM_HEALTH_SEGMENT_SIZE = GRAPH_HEIGHT / (2 * 3 * 6) //2 teams, 3 health levels, 6 players

function visitor_health_to_y(health) {
    return GRAPH_HEIGHT/2 - (health * TEAM_HEALTH_SEGMENT_SIZE);
}

function home_health_to_y(health) {
    return GRAPH_HEIGHT/2 + (health * TEAM_HEALTH_SEGMENT_SIZE);
}

function image_svg() {
    return $('#image_area').svg('get');
}

function draw_region(svg, group, left, top, right, bottom, class_) {
    svg.rect(group, secs_to_x(left), percent_to_y(top), secs_to_x(right)-secs_to_x(left), percent_to_y(bottom)-percent_to_y(top),
             {class_:class_});
}

function draw_timeline(svg, group, points, y_func, class_) {
    svg.polyline(group, points.map(function(point) { return [secs_to_x(point[0]), y_func(point[1])]}), {class_:class_});
}

function table_cell(value) {
    var cell = $('<div/>', {'class':'Cell'});
    cell.append('<p>'+value+'</p>');
    return cell;
}

function sort2(a, b) {
    var list = [a, b];
    list.sort();
    return list
}

function draw_skips(svg, group, skips) {
    var skips_g = svg.group(group, 'skips');
    for (skip_id in skips) {
        var skip = skips[skip_id];
        console.log(skip);
        var left = secs_to_x(skip[0]-3) // 3 secs before the skip indicator shows.
        svg.rect(group, left, 1, secs_to_x(skip[1])-left, GRAPH_HEIGHT-2, {class_:'replay_area'});
    }
}

function draw_fights(svg, group, fights) {
    var fights_g = svg.group(group, 'fights');
    for (fight_id in fights) {
        var fight = fights[fight_id];
        var l = sort2(fight.progress_start, fight.push_end);
        progress_low = l[0];
        progress_high = l[1];
        if (progress_low == progress_high) {
            progress_low-=.01;
            progress_high+=.01;
        }
        draw_region(svg, fights_g, fight.fight_start, progress_high, fight.fight_end, progress_low, "fight_area");

        var duration = fight.push_duration;
        var progress = fight.push_end-fight.progress_start;

        var fight_table = $('#fight_table');
        var row = $('<div/>', {'class':'Row'});
        fight_table.append(row);
        row.append(table_cell(fight.number));
        row.append(table_cell(secs_to_timestamp(fight.fight_start)));
        row.append(table_cell(fight.fight_end-fight.fight_start));
        row.append(table_cell(Math.round(progress * 100)+'%'));
        row.append(table_cell(duration));
        row.append(table_cell(Math.round((progress/duration) * 1000)/10));
    }
}

function draw_pushes(svg, group, pushes) {
    var pushes_g = svg.group(group, 'pushes');
    for (push_id in pushes) {
        var push = pushes[push_id];
        var l = sort2(push.progress_start, push.progress_end);
        progress_low = l[0];
        progress_high = l[1];

        if (progress_low == progress_high) {
            progress_low-=.01;
            progress_high+=.01;
        }
        draw_region(svg, pushes_g, push.push_start, progress_high, push.push_end, progress_low, "push_area");
    }
}

function draw_completion_lines(svg, group, cleared_checkpoints) {
    var g = svg.group(group, 'completion_lines');
    for (i in cleared_checkpoints) {
        var cp = cleared_checkpoints[i];
        if (i > 0) {
            var left = cleared_checkpoints[i-1][0];
        } else {
            var left = 0;
        }
        svg.line(g, secs_to_x(cp[0]), percent_to_y(1.0), secs_to_x(cp[0]), percent_to_y(cp[1]), {class_: 'progress_target_line'});
        svg.line(g, secs_to_x(left), percent_to_y(cp[1]), secs_to_x(cp[0]), percent_to_y(cp[1]), {class_: 'progress_completion_line'});
        svg.text(g, secs_to_x(cp[0]), -5, secs_to_timestamp(cp[0]));
        //chart.text(time, (time, -5), (chart.time_to_graph_x, None), group='completion')
    }
}

function draw_player_lifeline(svg, group, position, line) {
    var y = (parseInt(position) + 1) * (GRAPH_HEIGHT/13);
    for (section in line) {
        lifeline = line[section];
        svg.polyline(group, [[secs_to_x(lifeline[0]), y],
                             [secs_to_x(lifeline[1]), y]],
                     {class_:'player_lifeline'})
    }
}
function draw_player_lifelines(svg, group, player_lifelines) {
    var g = svg.group(group, 'player_lifelines');
    for (i in player_lifelines) {
        var line = player_lifelines[i];
        draw_player_lifeline(svg, g, i, line);
    }
    add_layer_toggle('#player_lifelines','Player Lifelines');
}

function draw_player_advantage(svg, group, player_advantage) {
    var g = svg.group(group, 'player_advantage');
    for (i in player_advantage) {
        var line = player_advantage[i];
        draw_timeline(svg, g, line, player_advantage_to_y, "player_advantage");
    }
    add_layer_toggle('#player_advantage','Player Advantage');

}

function draw_team_health(svg, group, team_health) {
    var g = svg.group(group, 'team_health');
    var total_health_percent = [];
    total_health_percent = team_health['visitor'].map(function(value, index) {
        return [value[0], (value[1]+team_health['home'][index][1])/(12*3)]
    });
    //for (i in team_health['visitor']) {
    //    console.log(team_health['visitor'][i]);
    //    total_health_percent = total_health_percent.concat([team_health['visitor'][i][0], (team_health['visitor'][i][1]+team_health['home'][i][1])/(12*3)]);
    //    console.log(total_health_percent);
    // }
    //console.log(total_health_percent);
    draw_timeline(svg, g, total_health_percent, percent_to_y, "team_health");
}

function draw_payload_progress(svg, group, payload_progress) {
    var g = svg.group(group, 'payload_progress');
    for (i in payload_progress) {
        var line = payload_progress[i];
        draw_timeline(svg, g, line, percent_to_y, "progress");
    }
}

function draw_graph(data) {
    var svg = image_svg();
    svg.configure({height: '500px', width: secs_to_x(data.duration)+10+10}, true);
    var graph_right = secs_to_x(data.duration);
    var g = svg.group('graph', {transform:'translate(10, 45)'});
    svg.rect(g, 0, 0, graph_right, GRAPH_HEIGHT, {class_: "graph_border"});
    var minute_g = svg.group(g, 'minute_ref');
    for (pixels = PIXELS_PER_SEC*60; pixels < graph_right; pixels+=PIXELS_PER_SEC*60) {
        var line_x = pixels;
        svg.line(minute_g, line_x, 0, line_x, GRAPH_HEIGHT, {class:'minute_ref_line'});
        svg.text(minute_g, line_x, GRAPH_HEIGHT+20, (pixels/(PIXELS_PER_SEC * 60)+':00'));
    }
    draw_skips(svg, g, data.skip_areas);
    draw_fights(svg, g, data.fights);
    draw_pushes(svg, g, data.pushes);
    draw_completion_lines(svg, g, data.cleared_checkpoints);
    draw_player_lifelines(svg, g, data.player_lifelines);
    draw_player_advantage(svg, g, data.player_advantage);
    draw_team_health(svg, g, data.team_health);
    draw_payload_progress(svg, g, data.payload_progress);
    svg.line(g, 0, 0, 0, GRAPH_HEIGHT+25, {id:'indicator'});
    svg.text(g, 0, GRAPH_HEIGHT+35, '0:00', {id:'indicator_text'});
    svg.line(g, 0, -20, 0, GRAPH_HEIGHT, {id:'scrubber'});
    svg.text(g, 0, -25, '0:00', {id:'scrubber_text'});

    $('#scrubber').click(function(eventObject) {
        var element = image_svg().getElementById('scrubber');
        var x = element.getAttribute('x1');
        var time = data.offset + (x / PIXELS_PER_SEC)
        player.seek(time);
        move_indicator(x);
        //player.play()
    });
}

function add_layer_toggle(group_id, text) {
    var button = $('<button>'+text+'</button>').click(function () {
        var x = $(group_id).css('display');
        if (x === "none") {
            $(group_id).css('display', "block");
        } else {
            $(group_id).css('display', "none");
        }
    });
    $('#layer_controls').append(button);
}
round_data = null;

function summary_path(round_id) {
    var parts = round_id.split(':');
    var a_parts = parts[0].split('_');
    var b_parts = parts[0].split('_');
    var c_parts = parts[0].split('_');
    return DATA_ROOT+'/'+a_parts[0]+'/'+parts[0]+'/'+parts[1]+'/'+parts[2]+'_summary.json';
}

$( document ).ready(function() {
    $('#image_area').svg();
    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('data')) {
        DATA_ROOT=urlParams.get('data');
    }
    $.getJSON(summary_path(urlParams.get('matchId')), function(data) {
        round_data = data; //Intentionally leaked for debugging aid.
        var options = {
		        width: 600,
		        height: 400,
 		        video: data.video_id,
            html5: true,
            /*volume: 0.0,*/
            muted: true,
            autoplay: false,
        };
        player = new Twitch.Player("player_div", options);
        player.addEventListener(Twitch.Player.READY, playerReady);
        player.addEventListener(Twitch.Player.PAUSE, playerPaused);
        player.addEventListener(Twitch.Player.PLAYING,
                                function playerPlaying() {
                                    timerId = setInterval(function () {update_player_indicator(data.offset)}, 100)
                                });
        draw_graph(data)
    });
    $('#image_area').mousemove(function() {
        var new_x = event.pageX - $(this).offset().left-10; //10 from the graph group translation
        move_scrubber(new_x);
    });
});

