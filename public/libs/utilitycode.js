function getSelectedOptions(sel, fn) {
    var opts = [], opt;
    
    // loop through options in select list
    for (var i=0, len=sel.options.length; i<len; i++) {
        opt = sel.options[i];
        
        // check if selected
        if ( opt.selected ) {
            // add to array of option elements to return from this function
            opts.push(opt.value);
            
            // invoke optional callback function if provided
            if (fn) {
                fn(opt);
            }
        }
    }
    
    // return array containing references to selected option elements
    //console.log(opts);
    return opts;
}

function setGenreOptions() {
    let dropdown = $('#selectedGenres');

    var jqxhr = $.get( "https://qwizz-api.herokuapp.com/genres/dropdown", function(data) {
        $.each(data.rows, function (key, entry) {
            dropdown.append($('<option></option>').attr('value', entry.id).text(entry.name));
          })
      });
}

function score_on() {
    $('#playerScores').css('display','block');
    //document.getElementById("playerScores").style.display = "block";
}

function score_off() {
    $('#playerScores').css('display','none');
    //document.getElementById("playerScores").style.display = "none";
}

$( document ).ready(function() {
    $('#image').height( $(window).height() - $("#hostWord").height()
     - 30 );
});
$(window).resize(function(){
    $('#image').height( $(window).height());  
})
$(window).resize();

function makeVisible() {
    $('#youtubeplayer').show();

  }
