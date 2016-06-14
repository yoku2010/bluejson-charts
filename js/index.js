$(function(){
    $.dc = blue.diversityChart('#diversity_graph', {
        fileType: 'tsv',
        dataFile: 'data/data.tsv',
        width: 1100,
        height: 500,
        innerPadding: 0.5,
        outerPadding: 0.5,
        midSpace: 100
    });
    $.dc.draw();
});
